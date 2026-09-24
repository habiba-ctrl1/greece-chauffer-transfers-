// ============================================================
// Email System Server Actions
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId, formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/actions/activity";
import { getCompanySettings } from "@/lib/actions/settings";
import { getQuoteById, updateQuoteStatus } from "@/lib/actions/quotes";
import { getBookingById } from "@/lib/actions/bookings";
import {
	dispatchEmail,
	wrapInLuxuryEmailTemplate,
	interpolateTemplate,
} from "@/lib/email/dispatcher";
import type { EmailLog, EmailTemplate } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export interface GetEmailLogsFilter {
	related_type?: "quote" | "booking" | "invoice";
	related_id?: string;
	page?: number;
	limit?: number;
}

export interface GetEmailLogsResult {
	logs: EmailLog[];
	total: number;
	page: number;
	totalPages: number;
}

/**
 * Seed default email templates if table is empty.
 */
export async function ensureDefaultEmailTemplates(): Promise<void> {
	try {
		const db = await getDb();
		const count = await db
			.prepare("SELECT COUNT(*) as count FROM email_templates")
			.first<{ count: number }>();

		if (count && count.count > 0) return;

		const defaultTemplates = [
			{
				slug: "quote_sent",
				name: "Quotation Proposal",
				subject: "Executive Chauffeur Quotation {{quote_number}} — Greece Chauffeur Service",
				body_html: `
<h2 style="color: #12151b; margin-top: 0;">Dear {{customer_name}},</h2>
<p>Thank you for choosing <strong>Greece Chauffeur Service</strong>. We have prepared an itemized quotation for your upcoming executive transfer request.</p>

<div class="info-card">
  <table width="100%" cellpadding="6">
    <tr>
      <td width="40%" style="color: #6c757d; font-size: 13px;">Quotation Reference:</td>
      <td style="font-weight: 600; color: #12151b; font-size: 14px;">{{quote_number}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Pickup Date & Time:</td>
      <td style="font-weight: 600; color: #12151b; font-size: 14px;">{{pickup_date}} at {{pickup_time}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Pickup Location:</td>
      <td style="color: #12151b; font-size: 14px;">{{pickup_location}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Dropoff Location:</td>
      <td style="color: #12151b; font-size: 14px;">{{dropoff_location}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Vehicle Category:</td>
      <td style="color: #12151b; font-size: 14px; text-transform: capitalize;">{{vehicle_category}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Passengers & Luggage:</td>
      <td style="color: #12151b; font-size: 14px;">{{passenger_count}} Passengers | {{luggage_info}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Total Amount:</td>
      <td style="font-weight: 700; color: #12151b; font-size: 18px;">{{total_amount}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Valid Until:</td>
      <td style="color: #d97706; font-size: 13px; font-weight: 600;">{{valid_until}}</td>
    </tr>
  </table>
</div>

<p>All transfers include personalized Meet & Greet at the airport/port, complimentary bottled water, flight monitoring, and professional English-speaking chauffeurs.</p>

<p style="margin-top: 24px;">To accept this proposal or discuss customized requirements, simply reply directly to this email or contact our 24/7 operations team at <strong>{{company_phone}}</strong>.</p>
`,
				variables: "customer_name,quote_number,pickup_date,pickup_time,pickup_location,dropoff_location,vehicle_category,passenger_count,luggage_info,total_amount,valid_until,company_phone",
			},
			{
				slug: "booking_confirmed",
				name: "Booking Confirmation Voucher",
				subject: "Reservation Confirmed: {{booking_number}} — Greece Chauffeur Service",
				body_html: `
<h2 style="color: #12151b; margin-top: 0;">Reservation Confirmed</h2>
<p>Dear {{customer_name}}, your chauffeur reservation <strong>{{booking_number}}</strong> is confirmed.</p>

<div class="info-card">
  <table width="100%" cellpadding="6">
    <tr>
      <td width="40%" style="color: #6c757d; font-size: 13px;">Booking Reference:</td>
      <td style="font-weight: 600; color: #12151b; font-size: 14px;">{{booking_number}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Pickup Date & Time:</td>
      <td style="font-weight: 600; color: #12151b; font-size: 14px;">{{pickup_date}} at {{pickup_time}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Pickup Location:</td>
      <td style="color: #12151b; font-size: 14px;">{{pickup_location}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Dropoff Location:</td>
      <td style="color: #12151b; font-size: 14px;">{{dropoff_location}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Flight Number:</td>
      <td style="color: #12151b; font-size: 14px;">{{flight_number}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Vehicle Class:</td>
      <td style="color: #12151b; font-size: 14px; text-transform: capitalize;">{{vehicle_category}}</td>
    </tr>
    <tr>
      <td style="color: #6c757d; font-size: 13px;">Total Amount:</td>
      <td style="font-weight: 700; color: #12151b; font-size: 18px;">{{total_amount}}</td>
    </tr>
  </table>
</div>

<p>Your chauffeur details will be sent prior to pickup. For urgent updates or flight changes, our 24/7 hotline is <strong>{{company_phone}}</strong>.</p>
`,
				variables: "customer_name,booking_number,pickup_date,pickup_time,pickup_location,dropoff_location,flight_number,vehicle_category,total_amount,company_phone",
			},
		];

		for (const t of defaultTemplates) {
			const id = generateId();
			await db
				.prepare(
					`INSERT OR IGNORE INTO email_templates (id, slug, name, subject, body_html, variables, is_active, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`
				)
				.bind(id, t.slug, t.name, t.subject, t.body_html, t.variables)
				.run();
		}
	} catch (e) {
		console.error("Failed to seed default email templates:", e);
	}
}

/**
 * Fetch all registered email templates.
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
	await ensureDefaultEmailTemplates();
	const db = await getDb();
	const rows = await db
		.prepare("SELECT * FROM email_templates ORDER BY name ASC")
		.all<EmailTemplate>();
	return rows.results || [];
}

/**
 * Fetch paginated email delivery logs.
 */
export async function getEmailLogs(
	filter: GetEmailLogsFilter = {}
): Promise<GetEmailLogsResult> {
	const db = await getDb();
	const page = Math.max(1, filter.page || 1);
	const limit = Math.min(100, Math.max(1, filter.limit || 20));
	const offset = (page - 1) * limit;

	const conditions: string[] = [];
	const bindings: unknown[] = [];

	if (filter.related_type) {
		conditions.push("related_type = ?");
		bindings.push(filter.related_type);
	}

	if (filter.related_id) {
		conditions.push("related_id = ?");
		bindings.push(filter.related_id);
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	const countResult = await db
		.prepare(`SELECT COUNT(*) as count FROM email_logs ${whereClause}`)
		.bind(...bindings)
		.first<{ count: number }>();

	const total = countResult?.count || 0;

	const rows = await db
		.prepare(
			`SELECT * FROM email_logs
			 ${whereClause}
			 ORDER BY created_at DESC
			 LIMIT ? OFFSET ?`
		)
		.bind(...bindings, limit, offset)
		.all<EmailLog>();

	return {
		logs: rows.results || [],
		total,
		page,
		totalPages: Math.ceil(total / limit) || 1,
	};
}

/**
 * Send quotation proposal to customer via email.
 */
export async function sendQuoteEmail(
	quoteId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await ensureDefaultEmailTemplates();
		const db = await getDb();
		const quote = await getQuoteById(quoteId);

		if (!quote) {
			return { success: false, error: "Quote not found" };
		}

		if (!quote.customer_email?.trim()) {
			return { success: false, error: "Customer does not have a valid email address on file." };
		}

		const settings = await getCompanySettings();

		// Fetch template
		const template = await db
			.prepare("SELECT * FROM email_templates WHERE slug = 'quote_sent' AND is_active = 1")
			.first<EmailTemplate>();

		const variables: Record<string, string> = {
			customer_name: quote.customer_name || "Valued Client",
			quote_number: quote.quote_number,
			pickup_date: quote.pickup_date ? formatDate(quote.pickup_date) : "TBD",
			pickup_time: quote.pickup_time || "TBD",
			pickup_location: quote.pickup_location || "Athens, Greece",
			dropoff_location: quote.dropoff_location || "Destination, Greece",
			vehicle_category: quote.vehicle_category || "Executive Sedan",
			passenger_count: String(quote.passenger_count || 1),
			luggage_info: quote.luggage_info || "Standard luggage",
			total_amount: formatCurrency(quote.total),
			valid_until: quote.valid_until ? formatDate(quote.valid_until) : "7 days",
			company_phone: settings.company_phone || "+30 210 000 0000",
			company_name: settings.company_name || "Greece Chauffeur Service",
		};

		const subject = template
			? interpolateTemplate(template.subject, variables)
			: `Executive Chauffeur Quotation ${quote.quote_number} — Greece Chauffeur Service`;

		const rawHtml = template
			? interpolateTemplate(template.body_html, variables)
			: `<h2>Dear ${variables.customer_name},</h2><p>Here is your quotation ${variables.quote_number} totaling ${variables.total_amount}.</p>`;

		const finalHtml = wrapInLuxuryEmailTemplate(rawHtml, subject);

		// Dispatch email
		const dispatchRes = await dispatchEmail({
			to: quote.customer_email.trim(),
			toName: quote.customer_name,
			subject,
			html: finalHtml,
		});

		const logId = generateId();
		const now = new Date().toISOString();

		// Record in email_logs
		await db
			.prepare(
				`INSERT INTO email_logs (
					id, template_id, recipient_email, recipient_name, subject,
					status, related_type, related_id, has_attachment, error_message, sent_at, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				logId,
				template?.id || null,
				quote.customer_email.trim(),
				quote.customer_name,
				subject,
				dispatchRes.success ? "sent" : "failed",
				"quote",
				quoteId,
				0,
				dispatchRes.error || null,
				dispatchRes.success ? now : null,
				now
			)
			.run();

		if (dispatchRes.success) {
			// Update quote status to 'sent' if it was 'draft'
			if (quote.status === "draft") {
				await updateQuoteStatus(quoteId, "sent", `Proposal emailed to ${quote.customer_email}`);
			} else {
				await recordActivity(
					"quote.emailed",
					"quote",
					quoteId,
					{ message: `Quotation sent via email to ${quote.customer_email}` }
				);
			}

			revalidatePath("/admin/quotes");
			revalidatePath(`/admin/quotes/${quoteId}`);
			revalidatePath("/admin/emails");

			return { success: true };
		} else {
			return { success: false, error: dispatchRes.error || "Failed to dispatch email" };
		}
	} catch (e) {
		console.error("Error sending quote email:", e);
		return { success: false, error: (e as Error).message || "Error sending quote email" };
	}
}

/**
 * Send reservation confirmation email to customer.
 */
export async function sendBookingConfirmationEmail(
	bookingId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await ensureDefaultEmailTemplates();
		const db = await getDb();
		const result = await getBookingById(bookingId);

		if (!result || !result.booking) {
			return { success: false, error: "Booking not found" };
		}

		const { booking } = result;

		if (!booking.customer_email?.trim()) {
			return { success: false, error: "Customer does not have an email address on file." };
		}

		const settings = await getCompanySettings();

		const template = await db
			.prepare("SELECT * FROM email_templates WHERE slug = 'booking_confirmed' AND is_active = 1")
			.first<EmailTemplate>();

		const variables: Record<string, string> = {
			customer_name: booking.customer_name || "Valued Client",
			booking_number: booking.booking_number,
			pickup_date: booking.pickup_date ? formatDate(booking.pickup_date) : "TBD",
			pickup_time: booking.pickup_time || "TBD",
			pickup_location: booking.pickup_location || "Athens, Greece",
			dropoff_location: booking.dropoff_location || "Destination, Greece",
			flight_number: booking.flight_number || "N/A",
			vehicle_category: booking.vehicle_category || "Executive Vehicle",
			total_amount: formatCurrency(booking.total),
			company_phone: settings.company_phone || "+30 210 000 0000",
		};

		const subject = template
			? interpolateTemplate(template.subject, variables)
			: `Reservation Confirmed: ${booking.booking_number} — Greece Chauffeur Service`;

		const rawHtml = template
			? interpolateTemplate(template.body_html, variables)
			: `<h2>Dear ${variables.customer_name},</h2><p>Your reservation ${variables.booking_number} is confirmed.</p>`;

		const finalHtml = wrapInLuxuryEmailTemplate(rawHtml, subject);

		const dispatchRes = await dispatchEmail({
			to: booking.customer_email.trim(),
			toName: booking.customer_name,
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
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				logId,
				template?.id || null,
				booking.customer_email.trim(),
				booking.customer_name,
				subject,
				dispatchRes.success ? "sent" : "failed",
				"booking",
				bookingId,
				0,
				dispatchRes.error || null,
				dispatchRes.success ? now : null,
				now
			)
			.run();

		if (dispatchRes.success) {
			await recordActivity(
				"booking.confirmation_emailed",
				"booking",
				bookingId,
				{ message: `Booking confirmation emailed to ${booking.customer_email}` }
			);

			revalidatePath("/admin/bookings");
			revalidatePath(`/admin/bookings/${bookingId}`);
			revalidatePath("/admin/emails");

			return { success: true };
		} else {
			return { success: false, error: dispatchRes.error || "Failed to dispatch email" };
		}
	} catch (e) {
		console.error("Error sending booking confirmation email:", e);
		return { success: false, error: (e as Error).message || "Failed to send confirmation email" };
	}
}
