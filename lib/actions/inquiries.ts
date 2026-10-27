// ============================================================
// Admin actions for inquiries, quotations and email recovery
// ============================================================
// Every export is callable over HTTP, so each one authorizes first.
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireOwner } from "@/lib/auth/guard";
import { crmContext, drainOutbox } from "@/lib/crm/service";
import { addNote, changeStatus, getInquiry, recordContact, scheduleFollowup, updateInquiryDetails, eventStatement, type ActionResult } from "@/lib/crm/inquiries";
import { INQUIRY_STATUSES, GUARDED_TARGETS, type InquiryStatus } from "@/lib/crm/status";
import {
	acceptQuote, createQuoteFromInquiry, createRevision, getQuote, rejectQuote, saveQuoteDraft, sendQuotation, type QuoteInput,
} from "@/lib/crm/quotes";
import { enqueueEmail, retryEmail } from "@/lib/email/outbox";
import { bookingConfirmationEmail, customerFollowUpEmail, testEmail } from "@/lib/email/templates";
import { formatMoney } from "@/lib/crm/money";
import { saveCrmSettings, CRM_DEFAULTS, type CrmSettings } from "@/lib/crm/settings";
import { convertQuoteToBooking } from "@/lib/actions/quotes";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { isMailConfigured } from "@/lib/env";
import { athensToday } from "@/lib/crm/inquiry-input";

type R = ActionResult & { [k: string]: unknown };

const isId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v);
const bad = (m = "Invalid request."): R => ({ ok: false, error: m });

function refresh(inquiryId?: string | null) {
	for (const p of ["/admin/inquiries", "/admin/followups", "/admin/dashboard", "/admin/emails", "/admin/quotes", "/admin/reports"]) revalidatePath(p);
	if (inquiryId) revalidatePath(`/admin/inquiries/${inquiryId}`);
}

async function guarded<T extends R>(fn: () => Promise<T>): Promise<T | R> {
	try {
		return await fn();
	} catch (e) {
		if ((e as Error).name === "UnauthorizedError") return bad((e as Error).message);
		console.error("admin action failed", e);
		return bad("Something went wrong. Please try again.");
	}
}

// ── Inquiry ─────────────────────────────────────────────────

export async function changeInquiryStatusAction(id: string, to: string, reason?: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(id) || !INQUIRY_STATUSES.includes(to as InquiryStatus)) return bad();
		if (GUARDED_TARGETS.includes(to as InquiryStatus)) return bad("Use the dedicated action for that step (send quotation / confirm booking / complete).");
		const ctx = await crmContext();
		const r = await changeStatus(ctx.db, id, to as InquiryStatus, { actorId: user.id, reason: reason?.slice(0, 300), settings: ctx.settings });
		refresh(id);
		return r;
	});
}

export async function addInquiryNoteAction(id: string, note: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(id)) return bad();
		const ctx = await crmContext();
		const r = await addNote(ctx.db, id, String(note ?? ""), user.id);
		refresh(id);
		return r;
	});
}

export async function scheduleFollowupAction(id: string, date: string | null, note?: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(id)) return bad();
		let when: string | null = null;
		if (date) {
			if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(date)) return bad("Invalid date.");
			// Date-only values mean 09:00 Athens time (~07:00 UTC).
			when = date.length === 10 ? new Date(`${date}T07:00:00Z`).toISOString() : new Date(date).toISOString();
		}
		const ctx = await crmContext();
		const r = await scheduleFollowup(ctx.db, id, when, note ?? null, user.id);
		refresh(id);
		return r;
	});
}

export async function recordContactAction(id: string, note: string, customerResponded: boolean): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(id)) return bad();
		const ctx = await crmContext();
		const r = await recordContact(ctx.db, id, { note: String(note ?? ""), customerResponded: !!customerResponded, actorId: user.id, settings: ctx.settings });
		refresh(id);
		return r;
	});
}

export async function updateInquiryAction(id: string, patch: Record<string, string | number | null>): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(id)) return bad();
		const clean: Record<string, string | number | null> = {};
		for (const [k, v] of Object.entries(patch ?? {})) {
			if (["adults", "children"].includes(k)) {
				const n = Number(v);
				if (!Number.isInteger(n) || n < (k === "adults" ? 1 : 0) || n > 60) return bad(`${k} out of range.`);
				clean[k] = n;
			} else if (typeof v === "string" || v === null) clean[k] = v === null ? null : v.slice(0, 500);
		}
		if (typeof clean.pickup_date === "string" && clean.pickup_date && !/^\d{4}-\d{2}-\d{2}$/.test(clean.pickup_date)) return bad("Invalid pickup date.");
		const ctx = await crmContext();
		const r = await updateInquiryDetails(ctx.db, id, clean as Parameters<typeof updateInquiryDetails>[2], user.id);
		refresh(id);
		return r;
	});
}

export async function archiveInquiryAction(id: string, archived: boolean): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(id)) return bad();
		const ctx = await crmContext();
		const now = new Date().toISOString();
		await ctx.db.batch([
			ctx.db.prepare("UPDATE inquiries SET archived_at = ?, updated_at = ? WHERE id = ?").bind(archived ? now : null, now, id),
			eventStatement(ctx.db, { inquiryId: id, type: "inquiry_edited", message: archived ? "Inquiry archived" : "Inquiry restored from archive", actorId: user.id }, now),
		]);
		refresh(id);
		return { ok: true };
	});
}

// ── Quotations ──────────────────────────────────────────────

export async function createQuotationAction(inquiryId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(inquiryId)) return bad();
		const ctx = await crmContext();
		const r = await createQuoteFromInquiry(ctx.db, inquiryId, null, { settings: ctx.settings, actorId: user.id });
		refresh(inquiryId);
		return r;
	});
}

export async function reviseQuotationAction(quoteId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(quoteId)) return bad();
		const ctx = await crmContext();
		const r = await createRevision(ctx.db, quoteId, { actorId: user.id });
		const q = await getQuote(ctx.db, quoteId);
		refresh(q?.inquiry_id);
		return r;
	});
}

export async function saveQuotationAction(quoteId: string, input: QuoteInput): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(quoteId) || !input || !Array.isArray(input.items)) return bad();
		const ctx = await crmContext();
		const r = await saveQuoteDraft(ctx.db, quoteId, { ...input, currency: String(input.currency || "EUR").toUpperCase() }, { actorId: user.id });
		const q = await getQuote(ctx.db, quoteId);
		refresh(q?.inquiry_id);
		revalidatePath(`/admin/quotes/${quoteId}`);
		return r;
	});
}

/** Freeze → queue → try to deliver now. Safe to click repeatedly (one email per quotation). */
export async function sendQuotationAction(quoteId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(quoteId)) return bad();
		const ctx = await crmContext();
		const q = await getQuote(ctx.db, quoteId);
		const queued = await sendQuotation(ctx.db, quoteId, { cfg: ctx.cfg, brand: ctx.brand, settings: ctx.settings, actorId: user.id });
		if (!queued.ok || !queued.outboxId) {
			refresh(q?.inquiry_id);
			return queued;
		}
		if (!isMailConfigured(ctx.cfg)) {
			refresh(q?.inquiry_id);
			return { ok: false, error: "Email sending isn't configured yet (RESEND_API_KEY / EMAIL_FROM_ADDRESS). The quotation is queued and will send automatically once it is.", queued: true };
		}
		await drainOutbox(ctx, { onlyId: queued.outboxId });
		const row = await ctx.db.prepare("SELECT status, last_error FROM email_outbox WHERE id = ?").bind(queued.outboxId).first<{ status: string; last_error: string | null }>();
		refresh(q?.inquiry_id);
		revalidatePath(`/admin/quotes/${quoteId}`);
		if (row?.status === "sent") return { ok: true, sent: true };
		if (row?.status === "cancelled") return bad("This send was cancelled; send again.");
		return { ok: false, queued: true, error: `Not delivered yet (${row?.last_error ?? "pending"}). It will be retried automatically; you can also retry from Email Activity.` };
	});
}

export async function acceptQuotationAction(quoteId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(quoteId)) return bad();
		const ctx = await crmContext();
		const q = await getQuote(ctx.db, quoteId);
		if (!q) return bad("Quotation not found.");
		const out = await acceptQuote(ctx.db, q, "manual", { cfg: ctx.cfg, brand: ctx.brand, actorId: user.id });
		refresh(q.inquiry_id);
		if (out === "accepted" || out === "already_accepted") return { ok: true };
		return bad(out === "not_current" ? "This version has been superseded by a newer one." : "Only a sent quotation can be marked as accepted.");
	});
}

export async function rejectQuotationAction(quoteId: string, reason: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(quoteId)) return bad();
		const ctx = await crmContext();
		const q = await getQuote(ctx.db, quoteId);
		const r = await rejectQuote(ctx.db, quoteId, String(reason ?? ""), user.id);
		refresh(q?.inquiry_id);
		return r;
	});
}

// ── Booking conversion ──────────────────────────────────────

/** Accepted quotation → confirmed booking. Idempotent: never creates a second booking. */
export async function confirmBookingAction(quoteId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(quoteId)) return bad();
		const ctx = await crmContext();
		const q = await getQuote(ctx.db, quoteId);
		if (!q || !q.inquiry_id) return bad("Quotation not found.");
		if (q.status !== "accepted") return bad("Record the customer's acceptance of this quotation before confirming the booking.");
		const res = await convertQuoteToBooking(quoteId);
		if (!res.success || !res.bookingId) return bad(res.error ?? "Could not create the booking.");
		const now = new Date().toISOString();
		await ctx.db.batch([
			ctx.db.prepare("UPDATE bookings SET inquiry_id = ?, booking_source = 'website', updated_at = ? WHERE id = ? AND inquiry_id IS NULL").bind(q.inquiry_id, now, res.bookingId),
			ctx.db.prepare("UPDATE inquiries SET status = 'confirmed', next_followup_at = NULL, updated_at = ? WHERE id = ? AND status IN ('accepted','quote_sent','preparing_quote','reviewing','awaiting_info','new')").bind(now, q.inquiry_id),
			eventStatement(ctx.db, { inquiryId: q.inquiry_id, quoteId, type: "booking_confirmed", message: `Booking ${res.bookingNumber} confirmed from quotation ${q.quote_number} (v${q.version})`, meta: { bookingId: res.bookingId }, actorId: user.id }, now),
		]);
		refresh(q.inquiry_id);
		revalidatePath("/admin/bookings");
		return { ok: true, bookingId: res.bookingId, bookingNumber: res.bookingNumber };
	});
}

export async function sendBookingConfirmationAction(bookingId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(bookingId)) return bad();
		const ctx = await crmContext();
		const b = await ctx.db.prepare(
			`SELECT b.*, c.name AS customer_name, c.email AS customer_email, q.payment_terms, q.cancellation_terms, q.currency
			 FROM bookings b JOIN customers c ON c.id = b.customer_id LEFT JOIN quotes q ON q.id = b.quote_id WHERE b.id = ?`
		).bind(bookingId).first<Record<string, string | number | null>>();
		if (!b) return bad("Booking not found.");
		if (!["confirmed", "driver_assigned", "driver_confirmed"].includes(String(b.status))) return bad("A confirmation can only be sent for a confirmed booking.");
		if (!b.customer_email) return bad("The customer has no email address.");
		const mail = bookingConfirmationEmail(ctx.brand, {
			customerName: String(b.customer_name), bookingNumber: String(b.booking_number),
			journey: [["Pickup", b.pickup_location], ["Drop-off", b.dropoff_location], ["Date", b.pickup_date], ["Time", b.pickup_time], ["Return", [b.return_date, b.return_time].filter(Boolean).join(" ")], ["Vehicle", b.vehicle_category], ["Passengers", b.passenger_count]],
			totalFormatted: formatMoney(Math.round(Number(b.total ?? 0) * 100), String(b.currency || "EUR")),
			paymentTerms: b.payment_terms as string | null, cancellationTerms: b.cancellation_terms as string | null,
		});
		const id = await enqueueEmail(ctx.db, {
			category: "booking_confirmation", to: String(b.customer_email), toName: String(b.customer_name), replyTo: ctx.brand.email, subject: mail.subject, html: mail.html, text: mail.text,
			bookingId, inquiryId: (b.inquiry_id as string | null) ?? null, dedupeKey: `booking-confirmation:${bookingId}:${Date.now().toString(36)}`,
		});
		if (id && isMailConfigured(ctx.cfg)) await drainOutbox(ctx, { onlyId: id });
		void user;
		refresh(b.inquiry_id as string | null);
		return { ok: true, queued: !isMailConfigured(ctx.cfg) };
	});
}

export async function completeInquiryAction(inquiryId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(inquiryId)) return bad();
		const ctx = await crmContext();
		const inq = await getInquiry(ctx.db, inquiryId);
		if (!inq) return bad("Inquiry not found.");
		if (inq.status !== "confirmed") return bad("Only a confirmed booking can be completed.");
		const bk = await ctx.db.prepare("SELECT id FROM bookings WHERE inquiry_id = ? AND status NOT IN ('cancelled','declined','no_show') LIMIT 1").bind(inquiryId).first<{ id: string }>();
		if (bk) await updateBookingStatus(bk.id, "completed", "Completed from inquiry");
		const r = await changeStatus(ctx.db, inquiryId, "completed", { actorId: user.id, settings: ctx.settings });
		refresh(inquiryId);
		return r;
	});
}

// ── Email recovery / admin tools ────────────────────────────

export async function retryEmailAction(outboxId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(outboxId)) return bad();
		const ctx = await crmContext();
		const row = await ctx.db.prepare("SELECT inquiry_id, quote_id FROM email_outbox WHERE id = ?").bind(outboxId).first<{ inquiry_id: string | null; quote_id: string | null }>();
		if (!(await retryEmail(ctx.db, outboxId))) return bad("This email was already delivered to the provider, so it can't be retried.");
		if (row?.inquiry_id) await eventStatement(ctx.db, { inquiryId: row.inquiry_id, quoteId: row.quote_id, type: "email_retried", message: "Email retry requested", actorId: user.id }).run();
		if (!isMailConfigured(ctx.cfg)) {
			refresh(row?.inquiry_id);
			return bad("Email sending isn't configured yet. The email stays queued.");
		}
		await drainOutbox(ctx, { onlyId: outboxId });
		const after = await ctx.db.prepare("SELECT status, last_error FROM email_outbox WHERE id = ?").bind(outboxId).first<{ status: string; last_error: string | null }>();
		refresh(row?.inquiry_id);
		return after?.status === "sent" ? { ok: true } : { ok: false, error: `Still failing: ${after?.last_error ?? "unknown error"}` };
	});
}

export async function processEmailQueueAction(): Promise<R> {
	return guarded(async () => {
		await requireAdmin();
		const ctx = await crmContext();
		if (!isMailConfigured(ctx.cfg)) return bad("Email sending isn't configured yet.");
		const res = await drainOutbox(ctx, { limit: 25, force: true });
		refresh();
		return { ok: true, ...res };
	});
}

/** Sends a test message to the business notification inbox only (never to arbitrary addresses). */
export async function sendTestEmailAction(): Promise<R> {
	return guarded(async () => {
		await requireOwner();
		const ctx = await crmContext();
		if (!isMailConfigured(ctx.cfg)) return bad("Not configured: set RESEND_API_KEY and EMAIL_FROM_ADDRESS as Worker secrets.");
		const mail = testEmail(ctx.brand);
		const id = await enqueueEmail(ctx.db, { category: "test", to: ctx.cfg.notifyTo, subject: mail.subject, html: mail.html, text: mail.text, dedupeKey: `test:${Date.now()}`, maxAttempts: 1 });
		await drainOutbox(ctx, { onlyId: id! });
		const row = await ctx.db.prepare("SELECT status, last_error FROM email_outbox WHERE id = ?").bind(id).first<{ status: string; last_error: string | null }>();
		refresh();
		return row?.status === "sent" ? { ok: true, to: ctx.cfg.notifyTo } : { ok: false, error: row?.last_error ?? "Send failed." };
	});
}

export async function sendCustomerFollowUpAction(inquiryId: string): Promise<R> {
	return guarded(async () => {
		const user = await requireAdmin();
		if (!isId(inquiryId)) return bad();
		const ctx = await crmContext();
		const inq = await getInquiry(ctx.db, inquiryId);
		if (!inq) return bad("Inquiry not found.");
		if (!["new", "reviewing", "awaiting_info", "preparing_quote", "quote_sent"].includes(inq.status)) return bad("Follow-up emails are only sent for open inquiries that haven't been accepted or closed.");
		const cust = await ctx.db.prepare("SELECT name, email FROM customers WHERE id = ?").bind(inq.customer_id).first<{ name: string; email: string | null }>();
		if (!cust?.email) return bad("The customer has no email address.");
		const q = await ctx.db.prepare("SELECT quote_number FROM quotes WHERE inquiry_id = ? AND status = 'sent' AND superseded_by_id IS NULL ORDER BY version DESC LIMIT 1").bind(inquiryId).first<{ quote_number: string }>();
		const mail = customerFollowUpEmail(ctx.brand, cust.name, inq.reference, q?.quote_number);
		const id = await enqueueEmail(ctx.db, { category: "customer_followup", to: cust.email, toName: cust.name, replyTo: ctx.brand.email, subject: mail.subject, html: mail.html, text: mail.text, inquiryId, dedupeKey: `followup:${inquiryId}:${Date.now().toString(36)}` });
		if (id && isMailConfigured(ctx.cfg)) await drainOutbox(ctx, { onlyId: id });
		const done = await recordContact(ctx.db, inquiryId, { note: "Follow-up email sent", customerResponded: false, actorId: user.id, settings: ctx.settings });
		refresh(inquiryId);
		return { ok: done.ok, queued: !isMailConfigured(ctx.cfg) };
	});
}

// ── Settings (CRM + quotation defaults) ─────────────────────

export async function saveCrmSettingsAction(patch: Partial<CrmSettings>): Promise<R> {
	return guarded(async () => {
		await requireOwner();
		const out: Partial<CrmSettings> = {};
		const num = (k: "followupNewHours" | "followupQuote1Hours" | "followupQuote2Hours" | "followupRepeatHours" | "quoteValidityDays" | "taxPercent", max: number) => {
			if (patch[k] === undefined) return null;
			const n = Number(patch[k]);
			if (!Number.isFinite(n) || n < 0 || n > max) return `${k} must be between 0 and ${max}.`;
			out[k] = n;
			return null;
		};
		for (const err of [num("followupNewHours", 720), num("followupQuote1Hours", 720), num("followupQuote2Hours", 2160), num("followupRepeatHours", 2160), num("quoteValidityDays", 90), num("taxPercent", 100)]) {
			if (err) return bad(err);
		}
		for (const k of ["paymentTerms", "cancellationTerms", "inclusions", "exclusions", "companyName", "companyPhone", "companyAddress", "companyVat", "companyWebsite"] as const) {
			if (patch[k] !== undefined) out[k] = String(patch[k]).slice(0, 2000);
		}
		if (patch.companyEmail !== undefined) {
			const e = String(patch.companyEmail).trim().toLowerCase();
			if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return bad("Business email looks invalid.");
			out.companyEmail = e || CRM_DEFAULTS.companyEmail;
		}
		if (patch.defaultCurrency !== undefined) {
			const c = String(patch.defaultCurrency).toUpperCase();
			if (!/^[A-Z]{3}$/.test(c)) return bad("Currency must be a 3-letter code.");
			out.defaultCurrency = c;
		}
		const ctx = await crmContext();
		await saveCrmSettings(ctx.db, out);
		revalidatePath("/admin/settings");
		return { ok: true };
	});
}

export async function todayAthensAction(): Promise<string> {
	await requireAdmin();
	return athensToday();
}
