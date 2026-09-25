// ============================================================
// Invoice Server Actions & Accounting Operations
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId, formatCurrency, formatDate, operationalDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/actions/activity";
import { getCompanySettings } from "@/lib/actions/settings";
import { getBookingById } from "@/lib/actions/bookings";
import {
	dispatchEmail,
	wrapInLuxuryEmailTemplate,
	interpolateTemplate,
} from "@/lib/email/dispatcher";
import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceWithDetails } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export interface GetInvoicesFilter {
	status?: string;
	search?: string;
	customer_id?: string;
	page?: number;
	limit?: number;
}

export interface GetInvoicesResult {
	invoices: InvoiceWithDetails[];
	total: number;
	page: number;
	totalPages: number;
}

/**
 * Generate sequential invoice number: GCS-INV-YYYY-XXXX
 */
async function generateInvoiceNumber(db: D1Database): Promise<string> {
	const year = new Date().getFullYear();
	const prefix = `GCS-INV-${year}-`;

	const last = await db
		.prepare(
			"SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1"
		)
		.bind(`${prefix}%`)
		.first<{ invoice_number: string }>();

	let seq = 1;
	if (last?.invoice_number) {
		const parts = last.invoice_number.split("-");
		const lastNum = parseInt(parts[parts.length - 1], 10);
		if (!isNaN(lastNum)) seq = lastNum + 1;
	}

	return `${prefix}${seq.toString().padStart(4, "0")}`;
}

/**
 * Fetch invoices with optional filtering, search, and pagination.
 */
export async function getInvoices(
	filter: GetInvoicesFilter = {}
): Promise<GetInvoicesResult> {
	const db = await getDb();
	const page = Math.max(1, filter.page || 1);
	const limit = Math.min(100, Math.max(1, filter.limit || 20));
	const offset = (page - 1) * limit;

	const conditions: string[] = [];
	const bindings: unknown[] = [];

	if (filter.status && filter.status !== "all") {
		conditions.push("i.status = ?");
		bindings.push(filter.status);
	}

	if (filter.customer_id) {
		conditions.push("i.customer_id = ?");
		bindings.push(filter.customer_id);
	}

	if (filter.search?.trim()) {
		const query = `%${filter.search.trim()}%`;
		conditions.push(
			"(i.invoice_number LIKE ? OR c.name LIKE ? OR c.email LIKE ? OR b.booking_number LIKE ?)"
		);
		bindings.push(query, query, query, query);
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	const countResult = await db
		.prepare(
			`SELECT COUNT(*) as count 
			 FROM invoices i
			 LEFT JOIN customers c ON c.id = i.customer_id
			 LEFT JOIN bookings b ON b.id = i.booking_id
			 ${whereClause}`
		)
		.bind(...bindings)
		.first<{ count: number }>();

	const total = countResult?.count || 0;

	const query = `
		SELECT 
			i.*,
			c.name as customer_name,
			c.email as customer_email,
			c.phone as customer_phone,
			c.company_name as customer_company,
			b.booking_number,
			b.pickup_location,
			b.dropoff_location,
			b.pickup_date,
			b.pickup_time
		FROM invoices i
		LEFT JOIN customers c ON c.id = i.customer_id
		LEFT JOIN bookings b ON b.id = i.booking_id
		${whereClause}
		ORDER BY i.created_at DESC
		LIMIT ? OFFSET ?
	`;

	const rows = await db
		.prepare(query)
		.bind(...bindings, limit, offset)
		.all<InvoiceWithDetails>();

	return {
		invoices: rows.results || [],
		total,
		page,
		totalPages: Math.ceil(total / limit) || 1,
	};
}

/**
 * Get single invoice by ID with full customer details and line items.
 */
export async function getInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
	const db = await getDb();

	const invoice = await db
		.prepare(
			`SELECT 
				i.*,
				c.name as customer_name,
				c.email as customer_email,
				c.phone as customer_phone,
				c.company_name as customer_company,
				b.booking_number,
				b.pickup_location,
				b.dropoff_location,
				b.pickup_date,
				b.pickup_time
			FROM invoices i
			LEFT JOIN customers c ON c.id = i.customer_id
			LEFT JOIN bookings b ON b.id = i.booking_id
			WHERE i.id = ?`
		)
		.bind(id)
		.first<InvoiceWithDetails>();

	if (!invoice) return null;

	const items = await db
		.prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC")
		.bind(id)
		.all<InvoiceItem>();

	return {
		...invoice,
		items: items.results || [],
	};
}

/**
 * Get existing invoice linked to a booking (if already generated).
 */
export async function getInvoiceByBookingId(bookingId: string): Promise<InvoiceWithDetails | null> {
	const db = await getDb();

	const invoice = await db
		.prepare("SELECT id FROM invoices WHERE booking_id = ? LIMIT 1")
		.bind(bookingId)
		.first<{ id: string }>();

	if (!invoice) return null;
	return getInvoiceById(invoice.id);
}

/**
 * Generate official Invoice directly from a completed or confirmed Booking.
 */
export async function createInvoiceFromBooking(
	bookingId: string
): Promise<{ success: boolean; invoiceId?: string; invoiceNumber?: string; error?: string }> {
	try {
		const db = await getDb();
		const result = await getBookingById(bookingId);

		if (!result || !result.booking) {
			return { success: false, error: "Booking not found" };
		}

		const { booking } = result;

		// Check if invoice already exists
		const existing = await getInvoiceByBookingId(bookingId);
		if (existing) {
			return {
				success: true,
				invoiceId: existing.id,
				invoiceNumber: existing.invoice_number,
			};
		}

		const currentUser = await getCurrentUser();
		const invoiceId = generateId();
		const invoiceNumber = await generateInvoiceNumber(db);
		const settings = await getCompanySettings();

		const initialStatus: InvoiceStatus =
			booking.payment_status === "paid" ? "paid" : "sent";

		const paidDate =
			booking.payment_status === "paid" ? new Date().toISOString() : null;

		// 1. Insert Invoice
		await db
			.prepare(
				`INSERT INTO invoices (
					id, invoice_number, booking_id, customer_id, status,
					subtotal, discount_amount, tax_amount, total,
					due_date, paid_date, notes, created_by, created_at, updated_at
				) VALUES (
					?, ?, ?, ?, ?,
					?, ?, ?, ?,
					date('now', '+7 days'), ?, ?, ?, datetime('now'), datetime('now')
				)`
			)
			.bind(
				invoiceId,
				invoiceNumber,
				booking.id,
				booking.customer_id,
				initialStatus,
				booking.price || booking.total,
				booking.discount_amount || 0,
				booking.tax_amount || 0,
				booking.total,
				paidDate,
				settings.invoice_terms || "Payment due upon receipt.",
				currentUser?.id || null
			)
			.run();

		// 2. Insert primary transfer line item
		const lineItemId = generateId();
		const serviceDesc = `${booking.vehicle_category ? booking.vehicle_category.toUpperCase() : "EXECUTIVE"} CHAUFFEUR SERVICE: ${booking.pickup_location || "Pickup"} → ${booking.dropoff_location || "Destination"}`;

		await db
			.prepare(
				`INSERT INTO invoice_items (
					id, invoice_id, description, quantity, unit_price, total, sort_order
				) VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				lineItemId,
				invoiceId,
				serviceDesc,
				1,
				booking.price || booking.total,
				booking.price || booking.total,
				0
			)
			.run();

		// 3. Record Activity
		await recordActivity(
			"invoice.created_from_booking",
			"invoice",
			invoiceId,
			{ message: `Generated invoice ${invoiceNumber} from booking ${booking.booking_number}` }
		);

		revalidatePath("/admin/bookings");
		revalidatePath(`/admin/bookings/${bookingId}`);
		revalidatePath("/admin/invoices");
		revalidatePath(`/admin/customers/${booking.customer_id}`);

		return {
			success: true,
			invoiceId,
			invoiceNumber,
		};
	} catch (e) {
		console.error("Error creating invoice from booking:", e);
		return { success: false, error: (e as Error).message || "Failed to generate invoice" };
	}
}

export interface FinancialSnapshot {
	revenueMtd: number;
	/** False if the payments table has no rows at all — see comment below. */
	revenueAvailable: boolean;
	paid: number;
	outstanding: number;
	overdue: number;
}

/**
 * Dashboard "Financial Overview" data.
 *
 * Paid / Outstanding / Overdue are computed from the invoices table, which
 * already carries exactly those statuses and is populated by
 * createInvoiceFromBooking(). Revenue MTD is computed from the payments
 * table, same as the original dashboard stat — but since there is no
 * Payments UI anywhere yet, that table can easily be completely empty even
 * while real business is happening. Rather than show a misleading €0.00 in
 * that case, revenueAvailable is set to false so the UI can say the figure
 * is unavailable instead of implying zero revenue.
 */
export async function getFinancialSnapshot(): Promise<FinancialSnapshot> {
	try {
		const db = await getDb();
		const today = operationalDate(0);
		const monthStart = `${today.slice(0, 7)}-01`;

		const [paidRes, outstandingRes, overdueRes, paymentsCountRes, revenueRes] = await Promise.all([
			db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM invoices WHERE status = 'paid'").first<{ sum: number }>(),
			db
				.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM invoices WHERE status = 'sent' AND (due_date IS NULL OR due_date >= ?)")
				.bind(today)
				.first<{ sum: number }>(),
			db
				.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM invoices WHERE status = 'overdue' OR (status = 'sent' AND due_date < ?)")
				.bind(today)
				.first<{ sum: number }>(),
			db.prepare("SELECT COUNT(*) as count FROM payments").first<{ count: number }>(),
			db
				.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND payment_date >= ?")
				.bind(monthStart)
				.first<{ total: number }>(),
		]);

		return {
			revenueMtd: revenueRes?.total ?? 0,
			revenueAvailable: (paymentsCountRes?.count ?? 0) > 0,
			paid: paidRes?.sum ?? 0,
			outstanding: outstandingRes?.sum ?? 0,
			overdue: overdueRes?.sum ?? 0,
		};
	} catch (e) {
		console.error("Error in getFinancialSnapshot:", e);
		return {
			revenueMtd: 0,
			revenueAvailable: false,
			paid: 0,
			outstanding: 0,
			overdue: 0,
		};
	}
}

/**
 * Update invoice status (e.g. mark as paid, cancelled, overdue).
 */
export async function updateInvoiceStatus(
	id: string,
	status: InvoiceStatus
): Promise<{ success: boolean; error?: string }> {
	try {
		const db = await getDb();
		const current = await getInvoiceById(id);
		if (!current) return { success: false, error: "Invoice not found" };

		const paidDate = status === "paid" ? new Date().toISOString() : current.paid_date;

		await db
			.prepare("UPDATE invoices SET status = ?, paid_date = ?, updated_at = datetime('now') WHERE id = ?")
			.bind(status, paidDate, id)
			.run();

		// If invoice marked paid and linked to booking, sync booking payment status
		if (status === "paid" && current.booking_id) {
			await db
				.prepare("UPDATE bookings SET payment_status = 'paid', updated_at = datetime('now') WHERE id = ?")
				.bind(current.booking_id)
				.run();
		}

		await recordActivity(
			"invoice.status_changed",
			"invoice",
			id,
			{ message: `Invoice ${current.invoice_number} status updated to ${status}` }
		);

		revalidatePath("/admin/invoices");
		revalidatePath(`/admin/invoices/${id}`);
		if (current.booking_id) {
			revalidatePath(`/admin/bookings/${current.booking_id}`);
		}

		return { success: true };
	} catch (e) {
		console.error("Error updating invoice status:", e);
		return { success: false, error: (e as Error).message || "Failed to update status" };
	}
}

/**
 * Dispatch official invoice to customer via email.
 */
export async function sendInvoiceEmail(
	invoiceId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const db = await getDb();
		const invoice = await getInvoiceById(invoiceId);

		if (!invoice) return { success: false, error: "Invoice not found" };
		if (!invoice.customer_email?.trim()) {
			return { success: false, error: "Customer does not have an email address on file." };
		}

		const settings = await getCompanySettings();

		const subject = `Official Tax Invoice ${invoice.invoice_number} — ${settings.company_name}`;
		const isPaid = invoice.status === "paid";

		const rawHtml = `
<h2 style="color: #12151b; margin-top: 0;">Tax Invoice & Receipt</h2>
<p>Dear ${invoice.customer_name}, please find attached your official invoice <strong>${invoice.invoice_number}</strong> for executive chauffeur services.</p>

<div class="info-card">
  <table width="100%" cellpadding="6">
    <tr>
      <td width="40%" style="color: #6c757d; font-size: 13px;">Invoice Number:</td>
      <td style="font-weight: 600; color: #12151b; font-size: 14px;">${invoice.invoice_number}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Booking Reference:</td>
      <td style="font-weight: 600; color: #12151b; font-size: 14px;">${invoice.booking_number || "Direct"}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Service Date:</td>
      <td style="color: #12151b; font-size: 14px;">${invoice.pickup_date ? formatDate(invoice.pickup_date) : formatDate(invoice.created_at)}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Transfer Route:</td>
      <td style="color: #12151b; font-size: 14px;">${invoice.pickup_location || "Origin"} → ${invoice.dropoff_location || "Destination"}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Payment Status:</td>
      <td style="font-weight: 700; color: ${isPaid ? "#16a34a" : "#d97706"}; font-size: 14px; text-transform: uppercase;">
        ${isPaid ? "✓ PAID IN FULL" : "PAYMENT PENDING / DUE"}
      </td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Total Amount:</td>
      <td style="font-weight: 800; color: #12151b; font-size: 18px;">${formatCurrency(invoice.total)}</td>
    </tr>
  </table>
</div>

<p>Thank you for placing your trust in <strong>${settings.company_name}</strong>. If you require further assistance or wish to book your next trip, contact our 24/7 team at <strong>${settings.company_phone}</strong>.</p>
`;

		const finalHtml = wrapInLuxuryEmailTemplate(rawHtml, subject);

		const dispatchRes = await dispatchEmail({
			to: invoice.customer_email.trim(),
			toName: invoice.customer_name,
			subject,
			html: finalHtml,
		});

		const logId = generateId();
		const now = new Date().toISOString();

		await db
			.prepare(
				`INSERT INTO email_logs (
					id, template_id, recipient_email, recipient_name, subject,
					status, related_type, related_id, has_attachment, error_message, sent_at, created_at
				) VALUES (?, NULL, ?, ?, ?, ?, 'invoice', ?, 0, ?, ?, ?)`
			)
			.bind(
				logId,
				invoice.customer_email.trim(),
				invoice.customer_name,
				subject,
				dispatchRes.success ? "sent" : "failed",
				invoiceId,
				dispatchRes.error || null,
				dispatchRes.success ? now : null,
				now
			)
			.run();

		if (dispatchRes.success) {
			if (invoice.status === "draft") {
				await updateInvoiceStatus(invoiceId, "sent");
			}
			await recordActivity(
				"invoice.emailed",
				"invoice",
				invoiceId,
				{ message: `Invoice ${invoice.invoice_number} emailed to ${invoice.customer_email}` }
			);

			revalidatePath("/admin/invoices");
			revalidatePath(`/admin/invoices/${invoiceId}`);
			revalidatePath("/admin/emails");

			return { success: true };
		} else {
			return { success: false, error: dispatchRes.error || "Failed to dispatch email" };
		}
	} catch (e) {
		console.error("Error sending invoice email:", e);
		return { success: false, error: (e as Error).message || "Failed to send invoice email" };
	}
}
