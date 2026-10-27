// ============================================================
// Email System Server Actions
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/guard";
import { sendBookingConfirmationAction, sendQuotationAction } from "@/lib/actions/inquiries";
import type { EmailLog, EmailTemplate } from "@/lib/schema";

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
	await requireAdmin();
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
	await requireAdmin();
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
	await requireAdmin();
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
 * Send a quotation to the customer. Delegates to the outbox-backed pipeline
 * (frozen snapshot + PDF attachment + retry), so legacy callers get the same guarantees.
 */
export async function sendQuoteEmail(quoteId: string): Promise<{ success: boolean; error?: string }> {
	await requireAdmin();
	const r = await sendQuotationAction(quoteId);
	return { success: r.ok, error: r.error };
}

/**
 * Send reservation confirmation email to customer.
 */
export async function sendBookingConfirmationEmail(
	bookingId: string
): Promise<{ success: boolean; error?: string }> {
	await requireAdmin();
	const r = await sendBookingConfirmationAction(bookingId);
	return { success: r.ok, error: r.error };
}
