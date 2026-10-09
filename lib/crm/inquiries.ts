// ============================================================
// Inquiry core (framework-free: takes a D1Database, easy to test)
// ============================================================
import { generateId } from "@/lib/utils";
import { athensToday, type InquiryInput } from "@/lib/crm/inquiry-input";
import { canTransition, FOLLOWUP_ELIGIBLE, INQUIRY_STATUSES, TERMINAL_STATUSES, type InquiryStatus } from "@/lib/crm/status";
import { afterFollowupDone, initialFollowup } from "@/lib/crm/followups";
import type { CrmSettings } from "@/lib/crm/settings";
import { enqueueStatement } from "@/lib/email/outbox";
import { customerAckEmail, ownerNewInquiryEmail, type BrandInfo, type InquiryEmailData } from "@/lib/email/templates";
import type { MailConfig } from "@/lib/env";

// ── Events ──────────────────────────────────────────────────

export type EventType =
	| "inquiry_received" | "status_changed" | "note_added" | "inquiry_edited"
	| "followup_scheduled" | "followup_done" | "customer_responded" | "contact_recorded"
	| "quote_created" | "quote_edited" | "quote_sent" | "quote_send_failed" | "quote_accepted" | "quote_rejected"
	| "quote_expired" | "quote_revised" | "booking_confirmed" | "email_sent" | "email_failed" | "email_retried" | "email_queued";

export function eventStatement(
	db: D1Database,
	e: { inquiryId: string; quoteId?: string | null; type: EventType; message: string; meta?: Record<string, unknown> | null; actorId?: string | null },
	nowIso: string = new Date().toISOString()
) {
	return db
		.prepare(`INSERT INTO inquiry_events (id, inquiry_id, quote_id, type, message, meta_json, actor_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
		.bind(generateId(), e.inquiryId, e.quoteId ?? null, e.type, e.message.slice(0, 1000), e.meta ? JSON.stringify(e.meta) : null, e.actorId ?? null, nowIso);
}

export async function addEvent(db: D1Database, e: Parameters<typeof eventStatement>[1], nowIso?: string) {
	await eventStatement(db, e, nowIso).run();
}

// ── References ──────────────────────────────────────────────

/** Atomic, gap-tolerant sequence: GCS-2026-00001. Safe under concurrent requests. */
export async function nextReference(db: D1Database, now: Date = new Date()): Promise<string> {
	const year = Number(athensToday(now).slice(0, 4));
	const row = await db
		.prepare(
			`INSERT INTO counters (name, year, value) VALUES ('inquiry', ?, 1)
			 ON CONFLICT(name, year) DO UPDATE SET value = value + 1 RETURNING value`
		)
		.bind(year)
		.first<{ value: number }>();
	return `GCS-${year}-${String(row!.value).padStart(5, "0")}`;
}

// ── Create ──────────────────────────────────────────────────

export interface CreateInquiryResult {
	id: string;
	reference: string;
	duplicate: boolean;
}

export interface CreateInquiryContext {
	cfg: MailConfig;
	brand: BrandInfo;
	settings: CrmSettings;
	now?: Date;
}

export function toEmailData(i: InquiryInput, reference: string): InquiryEmailData {
	return {
		reference, firstName: i.firstName, lastName: i.lastName, email: i.email, phone: i.phone, service: i.service,
		pickup: i.pickup, destination: i.destination, date: i.date, time: i.time, returnDate: i.returnDate, returnTime: i.returnTime,
		adults: i.adults, children: i.children, luggage: i.luggage, vehicle: i.vehicle, notes: i.notes, details: i.details, sourcePage: i.sourcePage,
	};
}

/**
 * Persist a validated inquiry (customer + inquiry + timeline + both outbox
 * emails) in ONE atomic batch. Email sending happens afterwards and can never
 * lose the inquiry.
 */
export async function createInquiry(db: D1Database, input: InquiryInput, ctx: CreateInquiryContext): Promise<CreateInquiryResult> {
	const now = ctx.now ?? new Date();
	const nowIso = now.toISOString();

	if (input.idempotencyKey) {
		const dup = await db.prepare("SELECT id, reference FROM inquiries WHERE idempotency_key = ?").bind(input.idempotencyKey).first<{ id: string; reference: string }>();
		if (dup) return { ...dup, duplicate: true };
	}

	const existing = await db.prepare("SELECT id, name, phone, first_name FROM customers WHERE lower(email) = ? ORDER BY created_at ASC LIMIT 1").bind(input.email).first<{ id: string; name: string; phone: string | null; first_name: string | null }>();
	const customerId = existing?.id ?? generateId();
	const fullName = `${input.firstName} ${input.lastName}`.trim();

	const id = generateId();
	const reference = await nextReference(db, now);
	const data = toEmailData(input, reference);
	const adminUrl = `${ctx.cfg.baseUrl}/admin/inquiries/${id}`;
	const owner = ownerNewInquiryEmail(ctx.brand, data, adminUrl);
	const ack = customerAckEmail(ctx.brand, data);
	const followup = initialFollowup(now, ctx.settings);

	const stmts: D1PreparedStatement[] = [];
	if (!existing) {
		stmts.push(
			db.prepare(
				`INSERT INTO customers (id, name, first_name, last_name, email, phone, customer_type, notes, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, 'individual', 'Created from website inquiry', ?, ?)`
			).bind(customerId, fullName, input.firstName, input.lastName, input.email, input.phone, nowIso, nowIso)
		);
	} else {
		// Fill gaps only — never overwrite what is already on file.
		stmts.push(
			db.prepare(
				`UPDATE customers SET phone = COALESCE(NULLIF(phone, ''), ?), first_name = COALESCE(first_name, ?), last_name = COALESCE(last_name, ?), updated_at = ? WHERE id = ?`
			).bind(input.phone, input.firstName, input.lastName, nowIso, customerId)
		);
	}

	const details = { ...input.details, contact: { firstName: input.firstName, lastName: input.lastName, phone: input.phone }, returnPickup: input.returnPickup || undefined, returnDestination: input.returnDestination || undefined };
	stmts.push(
		db.prepare(
			`INSERT INTO inquiries (
				id, reference, idempotency_key, customer_id, service_type, pickup_location, destination, pickup_date, pickup_time,
				return_date, return_time, adults, children, luggage, vehicle_preference, details_json, customer_notes,
				source_page, utm_json, consent_at, status, next_followup_at, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`
		).bind(
			id, reference, input.idempotencyKey || null, customerId, input.service, input.pickup, input.destination || null, input.date, input.time || null,
			input.returnDate || null, input.returnTime || null, input.adults, input.children, input.luggage || null, input.vehicle || null,
			JSON.stringify(details), input.notes || null, input.sourcePage || null, Object.keys(input.utm).length ? JSON.stringify(input.utm) : null,
			nowIso, followup, nowIso, nowIso
		),
		eventStatement(db, { inquiryId: id, type: "inquiry_received", message: `Inquiry ${reference} received from ${fullName}`, meta: { source: input.sourcePage || null } }, nowIso),
		enqueueStatement(db, { category: "owner_new_inquiry", to: ctx.cfg.notifyTo, replyTo: input.email, subject: owner.subject, html: owner.html, text: owner.text, inquiryId: id, dedupeKey: `inquiry-owner:${id}` }, nowIso),
		enqueueStatement(db, { category: "customer_acknowledgment", to: input.email, toName: fullName, replyTo: ctx.brand.email, subject: ack.subject, html: ack.html, text: ack.text, inquiryId: id, dedupeKey: `inquiry-ack:${id}` }, nowIso)
	);

	try {
		await db.batch(stmts);
	} catch (e) {
		// Lost an idempotency race with a concurrent identical request.
		if (input.idempotencyKey) {
			const dup = await db.prepare("SELECT id, reference FROM inquiries WHERE idempotency_key = ?").bind(input.idempotencyKey).first<{ id: string; reference: string }>();
			if (dup) return { ...dup, duplicate: true };
		}
		throw e;
	}
	return { id, reference, duplicate: false };
}

// ── Status / notes / follow-ups ─────────────────────────────

export interface InquiryRow {
	id: string;
	reference: string;
	customer_id: string;
	service_type: string;
	pickup_location: string;
	destination: string | null;
	pickup_date: string;
	pickup_time: string | null;
	return_date: string | null;
	return_time: string | null;
	adults: number;
	children: number;
	luggage: string | null;
	vehicle_preference: string | null;
	details_json: string | null;
	customer_notes: string | null;
	source_page: string | null;
	utm_json: string | null;
	status: InquiryStatus;
	assigned_to: string | null;
	internal_notes: string | null;
	lost_reason: string | null;
	last_contact_at: string | null;
	next_followup_at: string | null;
	followup_note: string | null;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

export const getInquiry = (db: D1Database, id: string) => db.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first<InquiryRow>();

export type ActionResult = { ok: boolean; error?: string };

export async function changeStatus(
	db: D1Database,
	id: string,
	to: InquiryStatus,
	opts: { actorId?: string | null; reason?: string; settings: CrmSettings; force?: boolean; now?: Date }
): Promise<ActionResult> {
	if (!INQUIRY_STATUSES.includes(to)) return { ok: false, error: "Unknown status." };
	const row = await getInquiry(db, id);
	if (!row) return { ok: false, error: "Inquiry not found." };
	if (!opts.force && !canTransition(row.status, to)) {
		return { ok: false, error: `Can't move from ${row.status.replace(/_/g, " ")} to ${to.replace(/_/g, " ")}.` };
	}
	if (to === "lost" && !opts.reason?.trim()) return { ok: false, error: "Please record a reason for marking this inquiry as lost." };

	const now = (opts.now ?? new Date());
	const nowIso = now.toISOString();
	let next: string | null | undefined; // undefined = leave as is
	if (TERMINAL_STATUSES.includes(to) || to === "confirmed") next = null;
	else if (TERMINAL_STATUSES.includes(row.status) || row.status === "confirmed") next = initialFollowup(now, opts.settings); // reopened

	await db.batch([
		db.prepare(
			`UPDATE inquiries SET status = ?, lost_reason = ?, ${next !== undefined ? "next_followup_at = ?," : ""} updated_at = ? WHERE id = ?`
		).bind(...[to, to === "lost" ? opts.reason!.trim().slice(0, 300) : null, ...(next !== undefined ? [next] : []), nowIso, id]),
		eventStatement(db, { inquiryId: id, type: "status_changed", message: `Status changed from ${row.status} to ${to}${opts.reason ? ` — ${opts.reason.trim().slice(0, 200)}` : ""}`, meta: { from: row.status, to }, actorId: opts.actorId }, nowIso),
	]);
	return { ok: true };
}

export async function addNote(db: D1Database, id: string, note: string, actorId?: string | null): Promise<ActionResult> {
	const text = note.trim().slice(0, 2000);
	if (!text) return { ok: false, error: "Note is empty." };
	const row = await getInquiry(db, id);
	if (!row) return { ok: false, error: "Inquiry not found." };
	const nowIso = new Date().toISOString();
	await db.batch([
		db.prepare("UPDATE inquiries SET internal_notes = ?, updated_at = ? WHERE id = ?").bind(
			`${row.internal_notes ? `${row.internal_notes}\n\n` : ""}[${nowIso.slice(0, 16).replace("T", " ")} UTC] ${text}`, nowIso, id),
		eventStatement(db, { inquiryId: id, type: "note_added", message: text, actorId }, nowIso),
	]);
	return { ok: true };
}

export async function scheduleFollowup(db: D1Database, id: string, whenIso: string | null, note: string | null, actorId?: string | null): Promise<ActionResult> {
	const row = await getInquiry(db, id);
	if (!row) return { ok: false, error: "Inquiry not found." };
	if (whenIso !== null) {
		if (!FOLLOWUP_ELIGIBLE.includes(row.status)) return { ok: false, error: "Follow-ups can't be scheduled for a closed inquiry." };
		if (Number.isNaN(new Date(whenIso).getTime())) return { ok: false, error: "Invalid follow-up date." };
	}
	const nowIso = new Date().toISOString();
	const when = whenIso ? new Date(whenIso).toISOString() : null;
	await db.batch([
		db.prepare("UPDATE inquiries SET next_followup_at = ?, followup_note = ?, updated_at = ? WHERE id = ?").bind(when, note?.trim().slice(0, 300) || null, nowIso, id),
		eventStatement(db, { inquiryId: id, type: "followup_scheduled", message: when ? `Follow-up scheduled for ${when.slice(0, 16).replace("T", " ")} UTC${note ? ` — ${note.trim().slice(0, 200)}` : ""}` : "Follow-up cleared", actorId }, nowIso),
	]);
	return { ok: true };
}

/** Owner contacted the customer (or recorded a reply). Re-plans the next reminder. */
export async function recordContact(
	db: D1Database,
	id: string,
	args: { note: string; customerResponded: boolean; actorId?: string | null; settings: CrmSettings; now?: Date }
): Promise<ActionResult> {
	const row = await getInquiry(db, id);
	if (!row) return { ok: false, error: "Inquiry not found." };
	const now = args.now ?? new Date();
	const nowIso = now.toISOString();
	const note = args.note.trim().slice(0, 1000);

	let next: string | null = null;
	if (!args.customerResponded) {
		const sent = await db.prepare("SELECT MAX(sent_at) AS s FROM quotes WHERE inquiry_id = ? AND sent_at IS NOT NULL").bind(id).first<{ s: string | null }>();
		const sentAt = sent?.s ? new Date(sent.s) : null;
		const since = sentAt ? sentAt.toISOString() : row.created_at;
		const done = await db.prepare("SELECT COUNT(*) AS c FROM inquiry_events WHERE inquiry_id = ? AND type = 'followup_done' AND created_at >= ?").bind(id, since).first<{ c: number }>();
		next = afterFollowupDone({ status: row.status, quoteSentAt: sentAt, doneCount: (done?.c ?? 0) + 1, now, settings: args.settings });
	}
	await db.batch([
		db.prepare("UPDATE inquiries SET last_contact_at = ?, next_followup_at = ?, followup_note = NULL, updated_at = ? WHERE id = ?").bind(nowIso, FOLLOWUP_ELIGIBLE.includes(row.status) ? next : null, nowIso, id),
		eventStatement(db, {
			inquiryId: id,
			type: args.customerResponded ? "customer_responded" : "followup_done",
			message: args.customerResponded ? `Customer responded${note ? `: ${note}` : ""}` : `Follow-up done${note ? `: ${note}` : ""}`,
			actorId: args.actorId,
		}, nowIso),
	]);
	return { ok: true };
}

export async function updateInquiryDetails(
	db: D1Database,
	id: string,
	patch: Partial<Pick<InquiryRow, "pickup_location" | "destination" | "pickup_date" | "pickup_time" | "adults" | "children" | "luggage" | "vehicle_preference" | "customer_notes" | "return_date" | "return_time">>,
	actorId?: string | null
): Promise<ActionResult> {
	const allowed = ["pickup_location", "destination", "pickup_date", "pickup_time", "adults", "children", "luggage", "vehicle_preference", "customer_notes", "return_date", "return_time"] as const;
	const entries = Object.entries(patch).filter(([k, v]) => (allowed as readonly string[]).includes(k) && v !== undefined);
	if (!entries.length) return { ok: false, error: "Nothing to update." };
	const row = await getInquiry(db, id);
	if (!row) return { ok: false, error: "Inquiry not found." };
	const nowIso = new Date().toISOString();
	const sets = entries.map(([k]) => `${k} = ?`).join(", ");
	await db.batch([
		db.prepare(`UPDATE inquiries SET ${sets}, updated_at = ? WHERE id = ?`).bind(...entries.map(([, v]) => (v === "" ? null : v)), nowIso, id),
		eventStatement(db, { inquiryId: id, type: "inquiry_edited", message: `Inquiry edited: ${entries.map(([k]) => k.replace(/_/g, " ")).join(", ")}`, actorId }, nowIso),
	]);
	return { ok: true };
}
