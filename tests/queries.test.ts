import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "./helpers/d1";
import { athensToday, validateInquiry } from "@/lib/crm/inquiry-input";
import { changeStatus, createInquiry, recordContact, scheduleFollowup } from "@/lib/crm/inquiries";
import { CRM_DEFAULTS } from "@/lib/crm/settings";
import { athensDayStart, crmDashboard, followupQueue, inquiriesCsv, listInquiries, reports, emailActivity } from "@/lib/crm/queries";
import { afterFollowupDone, afterQuoteSent, followupState } from "@/lib/crm/followups";
import { canTransition } from "@/lib/crm/status";
import { processOutbox } from "@/lib/email/outbox";
import type { MailConfig } from "@/lib/env";

const cfg: MailConfig = { notifyTo: "greecechauffertransfers@gmail.com", fromName: "GCS", transport: "resend", baseUrl: "https://site.test" };
const brand = { name: "GCS", email: "greecechauffertransfers@gmail.com" };
const settings = CRM_DEFAULTS;
const future = (d: number) => athensToday(new Date(Date.now() + d * 86400_000));

let db: D1Database;
let n = 0;
async function make(over: Record<string, unknown> = {}) {
	n++;
	const r = validateInquiry({
		firstName: "Cust", lastName: `Number${n}`, email: `c${n}@example.com`, phone: "+30 6912345678", service: "airport_transfer", pickup: `Pickup ${n}`,
		destination: `Dest ${n}`, date: future(5 + n), time: "10:00", adults: "2", consent: "on", idempotencyKey: `idem-key-${String(n).padStart(4, "0")}`, ...over,
	});
	if (!r.ok) throw new Error(JSON.stringify(r.errors));
	return createInquiry(db, r.data, { cfg, brand, settings });
}
const setCreated = (id: string, iso: string) => db.prepare("UPDATE inquiries SET created_at = ? WHERE id = ?").bind(iso, id).run();

beforeEach(() => {
	db = createTestDb().db;
	n = 0;
});

describe("scenario 6 — dashboard, search, filters, follow-ups", () => {
	it("dashboard metrics equal what is in the database", async () => {
		const a = await make();
		const b = await make();
		const c = await make();
		await make();
		await changeStatus(db, b.id, "reviewing", { settings });
		await changeStatus(db, c.id, "lost", { settings, reason: "Price" });
		const m = await crmDashboard(db, { from: future(-1), to: future(0) });
		expect(m.receivedToday).toBe(4);
		expect(m.newCount).toBe(2); // a + d
		expect(m.awaitingPrep).toBe(1);
		expect(m.lost).toBe(1);
		expect(m.openInquiries).toBe(3);
		expect(m.quotesSent).toBe(0);
		expect(m.confirmedValue).toBe(0);
		expect(a.reference).toBe("GCS-" + athensToday().slice(0, 4) + "-00001");
	});

	it("separates received volume by date range", async () => {
		const a = await make();
		await setCreated(a.id, "2020-01-05T10:00:00.000Z");
		await make();
		const recent = await crmDashboard(db, { from: future(-6), to: future(0) });
		expect(recent.receivedRange).toBe(1);
		const old = await crmDashboard(db, { from: "2020-01-01", to: "2020-01-31" });
		expect(old.receivedRange).toBe(1);
	});

	it("searches by reference, name, email, phone and place; filters by status/service", async () => {
		const a = await make({ firstName: "Zelda", lastName: "Fitzgerald", email: "zelda@example.com", service: "port_transfer", pickup: "Piraeus Port" });
		await make({ firstName: "Bob", lastName: "Smith" });
		await changeStatus(db, a.id, "reviewing", { settings });
		const find = async (q: string) => (await listInquiries(db, { q })).rows.map((r) => r.reference);
		expect(await find(a.reference)).toEqual([a.reference]);
		expect(await find("fitzg")).toEqual([a.reference]);
		expect(await find("ZELDA@example")).toEqual([a.reference]);
		expect(await find("6912345678")).toHaveLength(2);
		expect(await find("piraeus")).toEqual([a.reference]);
		expect(await find("%")).toEqual([]);
		expect((await listInquiries(db, { status: "reviewing" })).total).toBe(1);
		expect((await listInquiries(db, { service: "port_transfer" })).total).toBe(1);
		expect((await listInquiries(db, { status: "lost" })).total).toBe(0);
		// SQL-injection attempts are just text
		expect((await listInquiries(db, { q: "'; DROP TABLE inquiries; --" })).total).toBe(0);
		expect((await listInquiries(db, {})).total).toBe(2);
	});

	it("paginates and sorts", async () => {
		for (let i = 0; i < 7; i++) await make();
		const p1 = await listInquiries(db, { pageSize: 5, sort: "reference", dir: "asc", page: 1 });
		const p2 = await listInquiries(db, { pageSize: 5, sort: "reference", dir: "asc", page: 2 });
		expect(p1.total).toBe(7);
		expect(p1.totalPages).toBe(2);
		expect(p1.rows).toHaveLength(5);
		expect(p2.rows).toHaveLength(2);
		expect(p1.rows[0].reference < p1.rows[1].reference).toBe(true);
		expect(new Set([...p1.rows, ...p2.rows].map((r) => r.id)).size).toBe(7);
		const bad = await listInquiries(db, { sort: "id; DROP TABLE x" as never });
		expect(bad.rows.length).toBe(7);
	});

	it("classifies due / overdue / scheduled and excludes closed inquiries", async () => {
		const now = new Date();
		const [a, b, c, d, e] = [await make(), await make(), await make(), await make(), await make()];
		const dayStart = athensDayStart(now);
		const set = (id: string, at: string | null) => db.prepare("UPDATE inquiries SET next_followup_at = ? WHERE id = ?").bind(at, id).run();
		await set(a.id, new Date(new Date(dayStart).getTime() - 3600_000).toISOString()); // overdue (yesterday)
		await set(b.id, new Date(new Date(dayStart).getTime() + 60_000).toISOString()); // today (early)
		await set(c.id, new Date(now.getTime() + 3 * 86400_000).toISOString()); // upcoming
		await set(d.id, new Date(new Date(dayStart).getTime() - 3600_000).toISOString());
		await changeStatus(db, d.id, "cancelled", { settings }); // closed → never appears
		await set(e.id, null);
		const q = await followupQueue(db, now);
		expect(q.overdue.map((r) => r.id)).toEqual([a.id]);
		expect(q.today.map((r) => r.id)).toEqual([b.id]);
		expect(q.upcoming.map((r) => r.id)).toEqual([c.id]);
		expect(q.unscheduled.map((r) => r.id)).toEqual([e.id]);
		expect((await listInquiries(db, { followup: "overdue" }, now)).rows.map((r) => r.id)).toEqual([a.id]);
		const dash = await crmDashboard(db, { from: future(-1), to: future(0) }, now);
		expect(dash.overdue).toBe(1);
		expect(dash.dueToday).toBe(1);
		// the closed one has its reminder cleared by the status change itself
		expect((await db.prepare("SELECT next_followup_at FROM inquiries WHERE id = ?").bind(d.id).first<{ next_followup_at: string | null }>())!.next_followup_at).toBeNull();
	});

	it("follow-up rules follow settings (24h, 72h, repeat) and stop when the customer responds", async () => {
		const sent = new Date("2030-01-01T10:00:00Z");
		expect(afterQuoteSent(sent, settings)).toBe("2030-01-02T10:00:00.000Z");
		expect(afterFollowupDone({ status: "quote_sent", quoteSentAt: sent, doneCount: 1, now: new Date("2030-01-02T11:00:00Z"), settings })).toBe("2030-01-04T10:00:00.000Z");
		expect(afterFollowupDone({ status: "quote_sent", quoteSentAt: sent, doneCount: 2, now: new Date("2030-01-04T11:00:00Z"), settings })).toBeNull(); // repeat off by default
		expect(afterFollowupDone({ status: "quote_sent", quoteSentAt: sent, doneCount: 2, now: new Date("2030-01-04T11:00:00Z"), settings: { ...settings, followupRepeatHours: 48 } })).toBe("2030-01-06T11:00:00.000Z");
		expect(afterFollowupDone({ status: "lost", quoteSentAt: sent, doneCount: 1, now: sent, settings })).toBeNull();
		expect(followupState("2030-01-01T00:00:00Z", "completed", sent, "2030-01-01T00:00:00Z")).toBe("none");
		const { id } = await make();
		await scheduleFollowup(db, id, new Date(Date.now() + 86400_000).toISOString(), null);
		await recordContact(db, id, { note: "they replied", customerResponded: true, settings });
		expect((await db.prepare("SELECT next_followup_at FROM inquiries WHERE id = ?").bind(id).first<{ next_followup_at: string | null }>())!.next_followup_at).toBeNull();
	});

	it("status workflow permits only sensible transitions", () => {
		expect(canTransition("new", "reviewing")).toBe(true);
		expect(canTransition("new", "completed")).toBe(false);
		expect(canTransition("completed", "new")).toBe(false);
		expect(canTransition("lost", "reviewing")).toBe(true);
		expect(canTransition("quote_sent", "quote_sent")).toBe(false);
	});

	it("exports CSV with formula-injection protection and respects filters", async () => {
		await make({ firstName: "=cmd|calc", lastName: "Evil" });
		await make();
		const all = await inquiriesCsv(db, {});
		expect(all.split("\r\n")).toHaveLength(3);
		expect(all).toContain("\"'=cmd|calc Evil\"");
		expect((await inquiriesCsv(db, { q: "Number2" })).split("\r\n")).toHaveLength(2);
	});

	it("reports use sent quotations (not drafts) as the acceptance denominator", async () => {
		const { id } = await make();
		const cust = (await db.prepare("SELECT customer_id c FROM inquiries WHERE id = ?").bind(id).first<{ c: string }>())!.c;
		const ins = (qid: string, status: string, sent: string | null, total: number) =>
			db.prepare("INSERT INTO quotes (id, quote_number, customer_id, inquiry_id, status, sent_at, total, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
				.bind(qid, qid, cust, id, status, sent, total, new Date().toISOString(), new Date().toISOString()).run();
		const now = new Date().toISOString();
		await ins("Q1", "accepted", now, 100);
		await ins("Q2", "sent", now, 200);
		await ins("Q3", "rejected", now, 300);
		await ins("Q4", "draft", null, 400);
		const r = await reports(db, { from: future(-1), to: future(0) });
		expect(r.quotes).toMatchObject({ created: 4, sent: 3, accepted: 1, rejected: 1 });
		expect(Math.round(r.quotes.acceptanceRate!)).toBe(33);
		expect(r.quotes.sentValue).toBe(600);
		expect(r.byService[0]).toMatchObject({ service_type: "airport_transfer", c: 1 });
	});

	it("email activity surfaces failures and blocked sends", async () => {
		await make();
		await processOutbox(db, { transport: async () => ({ ok: false, notConfigured: true, retryable: true, error: "not configured" }), config: cfg });
		const problems = await emailActivity(db, { status: "problem" });
		expect(problems.total).toBe(2);
		const dash = await crmDashboard(db, { from: future(-1), to: future(0) });
		expect(dash.emailQueuedBlocked).toBe(2);
		await processOutbox(db, { transport: async () => ({ ok: false, retryable: false, error: "invalid recipient" }), config: cfg, force: true });
		expect((await crmDashboard(db, { from: future(-1), to: future(0) })).emailFailures).toBe(2);
	});
});
