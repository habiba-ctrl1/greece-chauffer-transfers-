// ============================================================
// Read models for the admin (lists, detail, dashboard, reports)
// ============================================================
import { athensToday } from "@/lib/crm/inquiry-input";
import type { InquiryRow } from "@/lib/crm/inquiries";
import type { QuoteRow } from "@/lib/crm/quotes";
import type { OutboxRow } from "@/lib/email/outbox";
import { FOLLOWUP_ELIGIBLE } from "@/lib/crm/status";

/** UTC instant of 00:00 Europe/Athens for the Athens calendar date of `now` (+ offsetDays). */
export function athensDayStart(now: Date, offsetDays = 0): string {
	const d = athensToday(new Date(now.getTime() + offsetDays * 86400_000));
	// Athens is UTC+2/+3; find which by probing the offset at that date.
	const probe = new Date(`${d}T12:00:00Z`);
	const part = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Athens", timeZoneName: "longOffset" }).formatToParts(probe).find((p) => p.type === "timeZoneName")?.value ?? "GMT+02:00";
	const m = /GMT([+-])(\d{2}):(\d{2})/.exec(part);
	const offsetMin = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 120;
	return new Date(new Date(`${d}T00:00:00Z`).getTime() - offsetMin * 60_000).toISOString();
}

const FOLLOWUP_IN = FOLLOWUP_ELIGIBLE.map((s) => `'${s}'`).join(",");

export interface InquiryFilters {
	q?: string;
	status?: string;
	service?: string;
	followup?: "due" | "overdue" | "scheduled" | "none" | "";
	from?: string;
	to?: string;
	archived?: boolean;
	sort?: "created_at" | "pickup_date" | "updated_at" | "next_followup_at" | "reference";
	dir?: "asc" | "desc";
	page?: number;
	pageSize?: number;
}

export interface InquiryListItem extends InquiryRow {
	customer_name: string;
	customer_email: string | null;
	customer_phone: string | null;
	quote_state: string | null;
	quote_number: string | null;
	quote_total: number | null;
}

const SORTS = ["created_at", "pickup_date", "updated_at", "next_followup_at", "reference"];

function buildWhere(f: InquiryFilters, now: Date) {
	const where: string[] = [];
	const args: unknown[] = [];
	where.push(f.archived ? "i.archived_at IS NOT NULL" : "i.archived_at IS NULL");
	if (f.q?.trim()) {
		const term = f.q.trim().toLowerCase().replace(/[%_\\]/g, "");
		if (!term) {
			where.push("1 = 0"); // nothing searchable left after stripping wildcards
		} else {
			const like = `%${term}%`;
			const digits = term.replace(/\D/g, "");
			// Phone numbers are matched by digits only when the query itself looks like a phone number.
			const phoneLike = digits.length >= 5 && digits.length >= term.replace(/[\s+()-]/g, "").length * 0.7;
			const phoneClause = " OR replace(replace(replace(replace(c.phone,' ',''),'-',''),'+',''),'(','') LIKE ?";
			where.push(
				`(lower(i.reference) LIKE ? OR lower(c.name) LIKE ? OR lower(c.email) LIKE ? OR lower(i.pickup_location) LIKE ? OR lower(i.destination) LIKE ?${phoneLike ? phoneClause : ""})`
			);
			args.push(like, like, like, like, like);
			if (phoneLike) args.push(`%${digits}%`);
		}
	}
	if (f.status === "open") where.push("i.status NOT IN ('completed','lost','cancelled')");
	else if (f.status) {
		where.push("i.status = ?");
		args.push(f.status);
	}
	if (f.service) {
		where.push("i.service_type = ?");
		args.push(f.service);
	}
	if (f.from) {
		where.push("i.pickup_date >= ?");
		args.push(f.from);
	}
	if (f.to) {
		where.push("i.pickup_date <= ?");
		args.push(f.to);
	}
	const dayStart = athensDayStart(now);
	const nowIso = now.toISOString();
	if (f.followup === "overdue") {
		where.push(`i.status IN (${FOLLOWUP_IN}) AND i.next_followup_at IS NOT NULL AND i.next_followup_at < ?`);
		args.push(dayStart);
	} else if (f.followup === "due") {
		where.push(`i.status IN (${FOLLOWUP_IN}) AND i.next_followup_at IS NOT NULL AND i.next_followup_at <= ?`);
		args.push(nowIso);
	} else if (f.followup === "scheduled") {
		where.push(`i.status IN (${FOLLOWUP_IN}) AND i.next_followup_at > ?`);
		args.push(nowIso);
	} else if (f.followup === "none") {
		where.push(`(i.next_followup_at IS NULL OR i.status NOT IN (${FOLLOWUP_IN}))`);
	}
	return { sql: where.join(" AND "), args };
}

const LIST_SELECT = `SELECT i.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
	(SELECT q.status FROM quotes q WHERE q.inquiry_id = i.id AND q.superseded_by_id IS NULL ORDER BY q.version DESC LIMIT 1) AS quote_state,
	(SELECT q.quote_number FROM quotes q WHERE q.inquiry_id = i.id AND q.superseded_by_id IS NULL ORDER BY q.version DESC LIMIT 1) AS quote_number,
	(SELECT q.total FROM quotes q WHERE q.inquiry_id = i.id AND q.superseded_by_id IS NULL ORDER BY q.version DESC LIMIT 1) AS quote_total
	FROM inquiries i JOIN customers c ON c.id = i.customer_id`;

export async function listInquiries(db: D1Database, f: InquiryFilters = {}, now: Date = new Date()) {
	const page = Math.max(1, f.page ?? 1);
	const pageSize = Math.min(100, Math.max(5, f.pageSize ?? 25));
	const { sql, args } = buildWhere(f, now);
	const sort = SORTS.includes(f.sort ?? "") ? f.sort! : "created_at";
	const dir = f.dir === "asc" ? "ASC" : "DESC";
	const nulls = sort === "next_followup_at" ? `i.${sort} IS NULL, ` : "";
	const total = (await db.prepare(`SELECT COUNT(*) AS c FROM inquiries i JOIN customers c ON c.id = i.customer_id WHERE ${sql}`).bind(...args).first<{ c: number }>())?.c ?? 0;
	const rows = await db
		.prepare(`${LIST_SELECT} WHERE ${sql} ORDER BY ${nulls}i.${sort} ${dir}, i.id DESC LIMIT ? OFFSET ?`)
		.bind(...args, pageSize, (page - 1) * pageSize)
		.all<InquiryListItem>();
	return { rows: rows.results ?? [], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface EventRow {
	id: string;
	inquiry_id: string;
	quote_id: string | null;
	type: string;
	message: string;
	actor_name: string | null;
	created_at: string;
}

export async function getInquiryDetail(db: D1Database, id: string) {
	const inquiry = await db.prepare(`${LIST_SELECT} WHERE i.id = ?`).bind(id).first<InquiryListItem>();
	if (!inquiry) return null;
	const [quotes, events, emails, bookings, customer] = await Promise.all([
		db.prepare("SELECT * FROM quotes WHERE inquiry_id = ? ORDER BY version DESC, created_at DESC").bind(id).all<QuoteRow>(),
		db.prepare(`SELECT e.*, u.name AS actor_name FROM inquiry_events e LEFT JOIN users u ON u.id = e.actor_id WHERE e.inquiry_id = ? ORDER BY e.created_at DESC, e.id DESC LIMIT 200`).bind(id).all<EventRow>(),
		db.prepare("SELECT * FROM email_outbox WHERE inquiry_id = ? ORDER BY created_at DESC").bind(id).all<OutboxRow>(),
		db.prepare("SELECT id, booking_number, status, payment_status, total, quote_id, pickup_date FROM bookings WHERE inquiry_id = ? OR quote_id IN (SELECT id FROM quotes WHERE inquiry_id = ?)").bind(id, id).all<{ id: string; booking_number: string; status: string; payment_status: string; total: number; quote_id: string | null; pickup_date: string | null }>(),
		db.prepare("SELECT id, name, email, phone, notes FROM customers WHERE id = ?").bind(inquiry.customer_id).first<{ id: string; name: string; email: string | null; phone: string | null; notes: string | null }>(),
	]);
	const itemsByQuote: Record<string, { description: string; quantity: number; unit_price: number; total: number }[]> = {};
	for (const q of quotes.results ?? []) {
		const it = await db.prepare("SELECT description, quantity, unit_price, total FROM quote_items WHERE quote_id = ? ORDER BY sort_order").bind(q.id).all<{ description: string; quantity: number; unit_price: number; total: number }>();
		itemsByQuote[q.id] = it.results ?? [];
	}
	return { inquiry, customer, quotes: quotes.results ?? [], itemsByQuote, events: events.results ?? [], emails: emails.results ?? [], bookings: bookings.results ?? [] };
}

// ── Dashboard ───────────────────────────────────────────────

export interface DashboardRange {
	from: string; // YYYY-MM-DD (Athens), inclusive
	to: string; // YYYY-MM-DD (Athens), inclusive
}

const rangeIso = (r: DashboardRange) => ({
	fromIso: athensDayStart(new Date(`${r.from}T12:00:00Z`)),
	toIso: athensDayStart(new Date(`${r.to}T12:00:00Z`), 1),
});

export async function crmDashboard(db: D1Database, range: DashboardRange, now: Date = new Date()) {
	const { fromIso, toIso } = rangeIso(range);
	const dayStart = athensDayStart(now);
	const dayEnd = athensDayStart(now, 1);
	const d = new Date(now);
	const dow = (new Date(`${athensToday(d)}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
	const weekStart = athensDayStart(now, -dow);
	const today = athensToday(now);
	const one = async <T>(sql: string, ...args: unknown[]) => (await db.prepare(sql).bind(...args).first<T>()) as T;
	const n = async (sql: string, ...args: unknown[]) => (await one<{ c: number }>(sql, ...args))?.c ?? 0;

	const [receivedRange, receivedToday, receivedWeek, newCount, awaitingPrep, quotesSent, dueToday, overdue, upcoming, completed, lost, failures, queuedStuck, quotedValue, confirmedValue, confirmedCount, inFlight] = await Promise.all([
		n("SELECT COUNT(*) c FROM inquiries WHERE created_at >= ? AND created_at < ?", fromIso, toIso),
		n("SELECT COUNT(*) c FROM inquiries WHERE created_at >= ? AND created_at < ?", dayStart, dayEnd),
		n("SELECT COUNT(*) c FROM inquiries WHERE created_at >= ? AND created_at < ?", weekStart, dayEnd),
		n("SELECT COUNT(*) c FROM inquiries WHERE status = 'new' AND archived_at IS NULL"),
		n("SELECT COUNT(*) c FROM inquiries WHERE status IN ('reviewing','preparing_quote','awaiting_info') AND archived_at IS NULL"),
		n("SELECT COUNT(*) c FROM quotes WHERE sent_at >= ? AND sent_at < ? AND sent_at IS NOT NULL", fromIso, toIso),
		n(`SELECT COUNT(*) c FROM inquiries WHERE status IN (${FOLLOWUP_IN}) AND next_followup_at >= ? AND next_followup_at < ?`, dayStart, dayEnd),
		n(`SELECT COUNT(*) c FROM inquiries WHERE status IN (${FOLLOWUP_IN}) AND next_followup_at < ?`, dayStart),
		n("SELECT COUNT(*) c FROM bookings WHERE status IN ('confirmed','driver_assigned','driver_confirmed','in_progress') AND pickup_date >= ?", today),
		n("SELECT COUNT(*) c FROM bookings WHERE status = 'completed' AND updated_at >= ? AND updated_at < ?", fromIso, toIso),
		n("SELECT COUNT(*) c FROM inquiries WHERE status = 'lost' AND updated_at >= ? AND updated_at < ?", fromIso, toIso),
		n("SELECT COUNT(*) c FROM email_outbox WHERE status IN ('failed','dead')"),
		n("SELECT COUNT(*) c FROM email_outbox WHERE status = 'queued' AND last_error IS NOT NULL"),
		one<{ s: number | null }>("SELECT SUM(total) s FROM quotes WHERE sent_at >= ? AND sent_at < ? AND sent_at IS NOT NULL AND currency = 'EUR'", fromIso, toIso),
		one<{ s: number | null }>("SELECT SUM(total) s FROM bookings WHERE created_at >= ? AND created_at < ? AND status NOT IN ('cancelled','declined','no_show')", fromIso, toIso),
		n("SELECT COUNT(*) c FROM bookings WHERE created_at >= ? AND created_at < ? AND status NOT IN ('cancelled','declined','no_show')", fromIso, toIso),
		n("SELECT COUNT(*) c FROM inquiries WHERE status IN ('new','reviewing','awaiting_info','preparing_quote','quote_sent','accepted') AND archived_at IS NULL"),
	]);
	return {
		receivedRange, receivedToday, receivedWeek, newCount, awaitingPrep, quotesSent, dueToday, overdue, upcoming, completed, lost,
		emailFailures: failures, emailQueuedBlocked: queuedStuck, quotedValue: quotedValue?.s ?? 0, confirmedValue: confirmedValue?.s ?? 0, confirmedCount, openInquiries: inFlight,
	};
}

export async function followupQueue(db: D1Database, now: Date = new Date()) {
	const dayStart = athensDayStart(now);
	const dayEnd = athensDayStart(now, 1);
	const base = `${LIST_SELECT} WHERE i.archived_at IS NULL AND i.status IN (${FOLLOWUP_IN}) AND i.next_followup_at`;
	const [overdue, today, upcoming, unscheduled] = await Promise.all([
		db.prepare(`${base} < ? ORDER BY i.next_followup_at ASC LIMIT 100`).bind(dayStart).all<InquiryListItem>(),
		db.prepare(`${base} >= ? AND i.next_followup_at < ? ORDER BY i.next_followup_at ASC LIMIT 100`).bind(dayStart, dayEnd).all<InquiryListItem>(),
		db.prepare(`${base} >= ? ORDER BY i.next_followup_at ASC LIMIT 50`).bind(dayEnd).all<InquiryListItem>(),
		db.prepare(`${LIST_SELECT} WHERE i.archived_at IS NULL AND i.status IN (${FOLLOWUP_IN}) AND i.next_followup_at IS NULL ORDER BY i.created_at ASC LIMIT 50`).all<InquiryListItem>(),
	]);
	return { overdue: overdue.results ?? [], today: today.results ?? [], upcoming: upcoming.results ?? [], unscheduled: unscheduled.results ?? [] };
}

export async function emailActivity(db: D1Database, f: { status?: string; category?: string; page?: number; pageSize?: number } = {}) {
	const page = Math.max(1, f.page ?? 1);
	const pageSize = Math.min(100, f.pageSize ?? 30);
	const where: string[] = [];
	const args: unknown[] = [];
	if (f.status === "problem") where.push("o.status IN ('failed','dead') OR (o.status = 'queued' AND o.last_error IS NOT NULL)");
	else if (f.status) {
		where.push("o.status = ?");
		args.push(f.status);
	}
	if (f.category) {
		where.push("o.category = ?");
		args.push(f.category);
	}
	const w = where.length ? `WHERE ${where.map((x) => `(${x})`).join(" AND ")}` : "";
	const total = (await db.prepare(`SELECT COUNT(*) c FROM email_outbox o ${w}`).bind(...args).first<{ c: number }>())?.c ?? 0;
	const rows = await db
		.prepare(`SELECT o.id, o.category, o.to_email, o.subject, o.status, o.attempts, o.max_attempts, o.last_error, o.provider_message_id, o.provider_status, o.sent_at, o.created_at, o.next_attempt_at, o.inquiry_id, o.quote_id, i.reference AS reference FROM email_outbox o LEFT JOIN inquiries i ON i.id = o.inquiry_id ${w} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`)
		.bind(...args, pageSize, (page - 1) * pageSize)
		.all<Pick<OutboxRow, "id" | "category" | "to_email" | "subject" | "status" | "attempts" | "max_attempts" | "last_error" | "provider_message_id" | "provider_status" | "sent_at" | "created_at" | "next_attempt_at" | "inquiry_id" | "quote_id"> & { reference: string | null }>();
	return { rows: rows.results ?? [], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// ── Reports ─────────────────────────────────────────────────

export async function reports(db: D1Database, range: DashboardRange) {
	const { fromIso, toIso } = rangeIso(range);
	const all = async <T>(sql: string, ...args: unknown[]) => (await db.prepare(sql).bind(...args).all<T>()).results ?? [];
	const one = async <T>(sql: string, ...args: unknown[]) => (await db.prepare(sql).bind(...args).first<T>()) as T;

	const [byDay, bySource, byService, lostReasons, quoteStats, confirmedByDay, emailStats] = await Promise.all([
		all<{ day: string; c: number }>("SELECT substr(created_at,1,10) AS day, COUNT(*) c FROM inquiries WHERE created_at >= ? AND created_at < ? GROUP BY day ORDER BY day", fromIso, toIso),
		all<{ source: string; c: number }>("SELECT COALESCE(json_extract(utm_json,'$.utm_source'), source_page, 'direct / unknown') AS source, COUNT(*) c FROM inquiries WHERE created_at >= ? AND created_at < ? GROUP BY source ORDER BY c DESC LIMIT 15", fromIso, toIso),
		all<{ service_type: string; c: number }>("SELECT service_type, COUNT(*) c FROM inquiries WHERE created_at >= ? AND created_at < ? GROUP BY service_type ORDER BY c DESC", fromIso, toIso),
		all<{ reason: string; c: number }>("SELECT COALESCE(NULLIF(lost_reason,''),'(no reason recorded)') AS reason, COUNT(*) c FROM inquiries WHERE status = 'lost' AND updated_at >= ? AND updated_at < ? GROUP BY reason ORDER BY c DESC", fromIso, toIso),
		one<{ created: number; sent: number; accepted: number; rejected: number; expired: number; sentValue: number | null; acceptedValue: number | null }>(
			`SELECT (SELECT COUNT(*) FROM quotes WHERE created_at >= ? AND created_at < ?) AS created,
			        COUNT(*) AS sent,
			        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
			        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
			        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired,
			        SUM(total) AS sentValue,
			        SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END) AS acceptedValue
			 FROM quotes WHERE sent_at >= ? AND sent_at < ? AND sent_at IS NOT NULL`, fromIso, toIso, fromIso, toIso),
		all<{ day: string; c: number; v: number }>("SELECT substr(created_at,1,10) AS day, COUNT(*) c, SUM(total) v FROM bookings WHERE created_at >= ? AND created_at < ? AND status NOT IN ('cancelled','declined','no_show') GROUP BY day ORDER BY day", fromIso, toIso),
		one<{ total: number; sent: number; failed: number; bounced: number }>(
			`SELECT COUNT(*) total, SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) sent, SUM(CASE WHEN status IN ('failed','dead') THEN 1 ELSE 0 END) failed,
			        SUM(CASE WHEN provider_status IN ('bounced','complained') THEN 1 ELSE 0 END) bounced
			 FROM email_outbox WHERE created_at >= ? AND created_at < ?`, fromIso, toIso),
	]);
	const sent = quoteStats?.sent ?? 0;
	const decided = (quoteStats?.accepted ?? 0) + (quoteStats?.rejected ?? 0);
	return {
		byDay, bySource, byService, lostReasons, confirmedByDay, emailStats,
		quotes: {
			created: quoteStats?.created ?? 0, sent, accepted: quoteStats?.accepted ?? 0, rejected: quoteStats?.rejected ?? 0, expired: quoteStats?.expired ?? 0,
			sentValue: quoteStats?.sentValue ?? 0, acceptedValue: quoteStats?.acceptedValue ?? 0,
			// Denominator = quotations actually sent (drafts excluded).
			acceptanceRate: sent ? (quoteStats.accepted / sent) * 100 : null,
			decidedRate: decided ? (quoteStats.accepted / decided) * 100 : null,
		},
	};
}

// ── CSV ─────────────────────────────────────────────────────

/** Neutralise spreadsheet formula injection and quote fields. */
export function csvCell(v: unknown): string {
	let s = v === null || v === undefined ? "" : String(v);
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return `"${s.replace(/"/g, '""')}"`;
}

export async function inquiriesCsv(db: D1Database, f: InquiryFilters, now: Date = new Date()): Promise<string> {
	const rows: InquiryListItem[] = [];
	for (let page = 1; page <= 50; page++) {
		const r = await listInquiries(db, { ...f, page, pageSize: 100 }, now);
		rows.push(...r.rows);
		if (page >= r.totalPages) break;
	}
	const head = ["Reference", "Created", "Status", "Service", "Customer", "Email", "Phone", "Pickup", "Destination", "Pickup date", "Pickup time", "Adults", "Children", "Quote", "Quote status", "Quote total", "Next follow-up", "Source page"];
	const lines = [head.map(csvCell).join(",")];
	for (const r of rows) {
		lines.push([r.reference, r.created_at, r.status, r.service_type, r.customer_name, r.customer_email, r.customer_phone, r.pickup_location, r.destination, r.pickup_date, r.pickup_time, r.adults, r.children, r.quote_number, r.quote_state, r.quote_total, r.next_followup_at, r.source_page].map(csvCell).join(","));
	}
	return lines.join("\r\n");
}
