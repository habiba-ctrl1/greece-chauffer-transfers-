import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "./helpers/d1";
import { validateInquiry, athensToday } from "@/lib/crm/inquiry-input";
import { addNote, changeStatus, createInquiry, getInquiry, recordContact, scheduleFollowup } from "@/lib/crm/inquiries";
import { CRM_DEFAULTS } from "@/lib/crm/settings";
import { processOutbox, retryEmail } from "@/lib/email/outbox";
import type { Transport } from "@/lib/email/transport";
import {
	acceptQuote, createQuoteFromInquiry, createRevision, emailDeadHook, findQuoteByToken, getQuote, quoteSentHook, saveQuoteDraft,
	sendQuotation, snapshotFor, type QuoteInput,
} from "@/lib/crm/quotes";
import { buildQuotationPdf } from "@/lib/pdf/quotation";
import type { MailConfig } from "@/lib/env";

const cfg: MailConfig = { notifyTo: "greecechauffertransfers@gmail.com", fromName: "Greece Chauffeur Service", fromAddress: "bookings@example.test", transport: "resend", resendApiKey: "k", baseUrl: "https://site.test" };
const brand = { name: "Greece Chauffeur Service", email: "greecechauffertransfers@gmail.com" };
const settings = { ...CRM_DEFAULTS, paymentTerms: "50% deposit", cancellationTerms: "48h notice" };

type Sent = { to: string; subject: string; attachments: number };
const future = (days: number) => athensToday(new Date(Date.now() + days * 86400_000));
const raw = (over: Record<string, unknown> = {}) => ({
	firstName: "Anna", lastName: "Papadopoulos", email: "Anna@Example.com", phone: "+44 7700 900123", service: "airport_transfer",
	pickup: "Athens Airport (ATH)", destination: "Hotel Grande Bretagne", date: future(10), time: "14:30", adults: "2", children: "0",
	luggage: "3 suitcases", flight_number: "A3 601", airline: "Aegean", consent: "on", idempotencyKey: "idem-key-0001", sourcePage: "/services/airport-transfers", ...over,
});
const valid = (over = {}) => {
	const r = validateInquiry(raw(over));
	if (!r.ok) throw new Error(JSON.stringify(r.errors));
	return r.data;
};

const okTransport = (sent: Sent[] = []): Transport => async (m) => {
	sent.push({ to: m.toEmail, subject: m.subject, attachments: m.attachments?.length ?? 0 });
	return { ok: true, messageId: `msg_${sent.length}` };
};
const hooks = (db: D1Database) => ({
	onSent: quoteSentHook(db, settings), onDead: emailDeadHook(db),
	buildQuoteAttachment: async (id: string) => {
		const snap = await snapshotFor(db, id, settings);
		return { filename: "q.pdf", contentType: "application/pdf", content: await buildQuotationPdf(snap!) };
	},
});

let db: D1Database;
beforeEach(() => {
	db = createTestDb().db;
});

describe("validation", () => {
	it("accepts a valid inquiry and normalises it", () => {
		const d = valid();
		expect(d.email).toBe("anna@example.com");
		expect(d.phone).toBe("+447700900123");
	});
	it.each([
		["missing email", { email: "" }, "email"],
		["bad email", { email: "not-an-email" }, "email"],
		["no pickup", { pickup: "" }, "pickup"],
		["no destination", { destination: "" }, "destination"],
		["zero passengers", { adults: "0" }, "adults"],
		["too many passengers", { adults: "500" }, "adults"],
		["past date", { date: "2020-01-01" }, "date"],
		["impossible date", { date: "2030-02-31" }, "date"],
		["bad time", { time: "25:99" }, "time"],
		["no country code", { phone: "07700900123" }, "phone"],
		["no consent", { consent: "" }, "consent"],
		["return needs dates", { service: "return_transfer" }, "returnDate"],
		["bad flight number", { flight_number: "<script>" }, "flight_number"],
	])("rejects %s", (_n, over, field) => {
		const r = validateInquiry(raw(over));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors[field]).toBeTruthy();
	});
	it("truncates over-long input and strips control characters", () => {
		const d = valid({ notes: "x".repeat(4000) + "\u0000", pickup: "A".repeat(900) });
		expect(d.notes.length).toBeLessThanOrEqual(2000);
		expect(d.pickup.length).toBeLessThanOrEqual(200);
		expect(d.notes).not.toContain("\u0000");
	});
	it("drops irrelevant conditional fields", () => {
		const d = valid({ service: "hotel_transfer", flight_number: "A3 601", hotel: "Hilton" });
		expect(d.details.flight_number).toBeUndefined();
		expect(d.details.hotel).toBe("Hilton");
	});
});

describe("scenario 1 — new inquiry", () => {
	it("persists inquiry, customer, timeline and both emails atomically", async () => {
		const r = await createInquiry(db, valid(), { cfg, brand, settings });
		expect(r.reference).toMatch(/^GCS-\d{4}-00001$/);
		const inq = await getInquiry(db, r.id);
		expect(inq?.status).toBe("new");
		expect(inq?.next_followup_at).toBeTruthy();
		const mails = (await db.prepare("SELECT category, to_email, reply_to, status FROM email_outbox ORDER BY category").all<{ category: string; to_email: string; reply_to: string; status: string }>()).results;
		expect(mails.map((m) => m.category)).toEqual(["customer_acknowledgment", "owner_new_inquiry"]);
		const owner = mails.find((m) => m.category === "owner_new_inquiry")!;
		expect(owner.to_email).toBe("greecechauffertransfers@gmail.com");
		expect(owner.reply_to).toBe("anna@example.com");
		expect(mails.find((m) => m.category === "customer_acknowledgment")!.to_email).toBe("anna@example.com");
		expect((await db.prepare("SELECT COUNT(*) c FROM inquiry_events WHERE inquiry_id = ?").bind(r.id).first<{ c: number }>())!.c).toBe(1);
	});
	it("is idempotent for a repeated submission", async () => {
		const a = await createInquiry(db, valid(), { cfg, brand, settings });
		const b = await createInquiry(db, valid(), { cfg, brand, settings });
		expect(b.duplicate).toBe(true);
		expect(b.reference).toBe(a.reference);
		expect((await db.prepare("SELECT COUNT(*) c FROM inquiries").first<{ c: number }>())!.c).toBe(1);
		expect((await db.prepare("SELECT COUNT(*) c FROM email_outbox").first<{ c: number }>())!.c).toBe(2);
	});
	it("reuses the customer and issues unique references", async () => {
		const results = [];
		for (const n of [1, 2, 3, 4, 5]) {
			results.push(await createInquiry(db, valid({ idempotencyKey: `idem-key-000${n}`, email: n % 2 ? "a@x.com" : "A@X.com" }), { cfg, brand, settings }));
		}
		expect(new Set(results.map((r) => r.reference)).size).toBe(5);
		expect((await db.prepare("SELECT COUNT(*) c FROM customers").first<{ c: number }>())!.c).toBe(1);
	});
	it("keeps the inquiry when email delivery fails", async () => {
		const r = await createInquiry(db, valid(), { cfg, brand, settings });
		const failing: Transport = async () => ({ ok: false, retryable: true, error: "boom" });
		const res = await processOutbox(db, { transport: failing, config: cfg });
		expect(res.failed).toBe(2);
		expect(await getInquiry(db, r.id)).toBeTruthy();
		const row = await db.prepare("SELECT status, attempts, last_error FROM email_outbox LIMIT 1").first<{ status: string; attempts: number; last_error: string }>();
		expect(row).toMatchObject({ status: "failed", attempts: 1, last_error: "boom" });
	});
	it("never reports success when the provider is not configured", async () => {
		await createInquiry(db, valid(), { cfg, brand, settings });
		const notConf: Transport = async () => ({ ok: false, notConfigured: true, retryable: true, error: "Email provider is not configured" });
		const res = await processOutbox(db, { transport: notConf, config: cfg });
		expect(res.notConfigured).toBe(2);
		const rows = (await db.prepare("SELECT status, attempts FROM email_outbox").all<{ status: string; attempts: number }>()).results;
		expect(rows.every((r) => r.status === "queued" && r.attempts === 0)).toBe(true);
	});
	it("backs off, goes dead after max attempts, and can be retried manually", async () => {
		await createInquiry(db, valid(), { cfg, brand, settings });
		const failing: Transport = async () => ({ ok: false, retryable: true, error: "boom" });
		let t = Date.now();
		for (let i = 0; i < 6; i++) {
			await processOutbox(db, { transport: failing, config: cfg, now: new Date(t) });
			t += 7 * 3600_000;
		}
		const dead = (await db.prepare("SELECT id, status, attempts FROM email_outbox").all<{ id: string; status: string; attempts: number }>()).results;
		expect(dead.every((r) => r.status === "dead" && r.attempts === 5)).toBe(true);
		expect(await retryEmail(db, dead[0].id)).toBe(true);
		const sent: Sent[] = [];
		await processOutbox(db, { transport: okTransport(sent), config: cfg });
		expect(sent).toHaveLength(1);
		// a sent email can never be "retried" into a duplicate
		expect(await retryEmail(db, dead[0].id)).toBe(false);
	});
	it("concurrent workers cannot send the same row twice", async () => {
		await createInquiry(db, valid(), { cfg, brand, settings });
		const sent: Sent[] = [];
		await Promise.all([processOutbox(db, { transport: okTransport(sent), config: cfg }), processOutbox(db, { transport: okTransport(sent), config: cfg })]);
		expect(sent).toHaveLength(2);
	});
});

describe("status workflow + follow-ups", () => {
	it("validates transitions, requires a lost reason, logs every change", async () => {
		const { id } = await createInquiry(db, valid(), { cfg, brand, settings });
		expect((await changeStatus(db, id, "completed", { settings })).ok).toBe(false);
		expect((await changeStatus(db, id, "lost", { settings })).ok).toBe(false);
		expect((await changeStatus(db, id, "reviewing", { settings })).ok).toBe(true);
		expect((await changeStatus(db, id, "lost", { settings, reason: "Went elsewhere" })).ok).toBe(true);
		expect(await getInquiry(db, id)).toMatchObject({ status: "lost", lost_reason: "Went elsewhere", next_followup_at: null });
		expect((await scheduleFollowup(db, id, new Date().toISOString(), null)).ok).toBe(false);
		expect((await changeStatus(db, id, "reviewing", { settings })).ok).toBe(true);
		expect((await getInquiry(db, id))!.next_followup_at).toBeTruthy();
		const n = (await db.prepare("SELECT COUNT(*) c FROM inquiry_events WHERE type = 'status_changed'").first<{ c: number }>())!.c;
		expect(n).toBe(3);
	});
	it("records notes and contact, replanning reminders", async () => {
		const { id } = await createInquiry(db, valid(), { cfg, brand, settings });
		expect((await addNote(db, id, "Called, no answer")).ok).toBe(true);
		await recordContact(db, id, { note: "replied by email", customerResponded: true, settings });
		expect((await getInquiry(db, id))!.next_followup_at).toBeNull();
		const when = new Date(Date.now() + 86400_000).toISOString();
		await scheduleFollowup(db, id, when, "call back");
		expect((await getInquiry(db, id))!.next_followup_at).toBe(when);
	});
});

const price = (inq: QuoteInput, unit = "120"): QuoteInput => ({ ...inq, items: [{ description: "Airport transfer — Mercedes V-Class", quantity: 1, unitPrice: unit }] });

async function draftFor(inquiryId: string) {
	const c = await createQuoteFromInquiry(db, inquiryId, null, { settings });
	expect(c.ok).toBe(true);
	const q = (await getQuote(db, c.quoteId!))!;
	const input: QuoteInput = {
		journeyDescription: q.journey_description ?? "", vehicleCategory: "Mercedes V-Class", passengerCount: 2, luggageInfo: q.luggage_info ?? "",
		pickup: q.pickup_location ?? "", destination: q.dropoff_location ?? "", date: q.pickup_date ?? "", time: q.pickup_time ?? "", returnDate: "", returnTime: "",
		flightNumber: q.flight_number ?? "", currency: "EUR", items: [], discountType: null, discountValue: null, feesAmount: null, taxPercent: null,
		inclusions: "Meet & greet", exclusions: "Tips", paymentTerms: q.payment_terms ?? "", cancellationTerms: q.cancellation_terms ?? "", notes: "", internalNotes: "", validUntil: future(7),
	};
	return { id: c.quoteId!, input: price(input) };
}

describe("scenarios 3-5 — quotation, email, acceptance", () => {
	it("prefills from the inquiry, calculates, saves a draft and renders a PDF", async () => {
		const { id: inquiryId } = await createInquiry(db, valid(), { cfg, brand, settings });
		const { id, input } = await draftFor(inquiryId);
		const q0 = (await getQuote(db, id))!;
		expect(q0).toMatchObject({ pickup_location: "Athens Airport (ATH)", dropoff_location: "Hotel Grande Bretagne", status: "draft", version: 1 });
		expect((await getInquiry(db, inquiryId))!.status).toBe("preparing_quote");
		expect((await saveQuoteDraft(db, id, { ...input, discountType: "percentage", discountValue: "10", feesAmount: "5" }, {})).ok).toBe(true);
		expect(await getQuote(db, id)).toMatchObject({ subtotal: 120, discount_amount: 12, fees_amount: 5, total: 113 });
		expect((await saveQuoteDraft(db, id, price(input, "-1"), {})).ok).toBe(false);
		const snap = (await snapshotFor(db, id, settings))!;
		const pdf = await buildQuotationPdf(snap);
		expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
		expect(pdf.length).toBeGreaterThan(2000);
	});

	it("handles very long content and Greek text in the PDF without throwing", async () => {
		const { id: inquiryId } = await createInquiry(db, valid({ pickup: "Αεροδρόμιο Ελευθέριος Βενιζέλος" }), { cfg, brand, settings });
		const { id, input } = await draftFor(inquiryId);
		const items = Array.from({ length: 40 }, (_, i) => ({ description: `Line ${i} ${"very long description ".repeat(12)} ΕΛΛΑΔΑ 🚗`, quantity: 1, unitPrice: "10" }));
		expect((await saveQuoteDraft(db, id, { ...input, items, notes: "x".repeat(1900), paymentTerms: "p ".repeat(900) }, {})).ok).toBe(true);
		const pdf = await buildQuotationPdf((await snapshotFor(db, id, settings))!);
		expect(pdf.length).toBeGreaterThan(5000);
	});

	it("sends once with the PDF, marks sent only after provider acceptance, schedules follow-up", async () => {
		const { id: inquiryId } = await createInquiry(db, valid(), { cfg, brand, settings });
		await processOutbox(db, { transport: okTransport(), config: cfg });
		const { id, input } = await draftFor(inquiryId);
		await saveQuoteDraft(db, id, input, {});

		const s1 = await sendQuotation(db, id, { cfg, brand, settings });
		const s2 = await sendQuotation(db, id, { cfg, brand, settings });
		expect(s1.ok && s2.ok).toBe(true);
		expect(s2.outboxId).toBe(s1.outboxId);
		expect((await getQuote(db, id))!.status).toBe("draft"); // not "sent" until the provider accepts

		const sent: Sent[] = [];
		const failing: Transport = async () => ({ ok: false, retryable: true, error: "provider down" });
		await processOutbox(db, { onlyId: s1.outboxId, transport: failing, config: cfg, hooks: hooks(db) });
		expect((await getQuote(db, id))!.status).toBe("draft");
		await retryEmail(db, s1.outboxId!);
		await processOutbox(db, { onlyId: s1.outboxId, transport: okTransport(sent), config: cfg, hooks: hooks(db) });
		expect(sent).toEqual([{ to: "anna@example.com", subject: expect.stringContaining("Quotation"), attachments: 1 }]);
		const q = (await getQuote(db, id))!;
		expect(q.status).toBe("sent");
		expect(q.sent_at).toBeTruthy();
		const inq = (await getInquiry(db, inquiryId))!;
		expect(inq.status).toBe("quote_sent");
		expect(inq.next_followup_at).toBeTruthy();
		expect((await saveQuoteDraft(db, id, input, {})).ok).toBe(false);
		expect((await sendQuotation(db, id, { cfg, brand, settings })).outboxId).toBe(s1.outboxId);
		expect((await db.prepare("SELECT COUNT(*) c FROM email_outbox WHERE category = 'quotation'").first<{ c: number }>())!.c).toBe(1);
	});

	it("versions: revising a sent quote keeps the old one; sending v2 supersedes v1", async () => {
		const { id: inquiryId } = await createInquiry(db, valid(), { cfg, brand, settings });
		const { id, input } = await draftFor(inquiryId);
		await saveQuoteDraft(db, id, input, {});
		const s = await sendQuotation(db, id, { cfg, brand, settings });
		await processOutbox(db, { onlyId: s.outboxId, transport: okTransport(), config: cfg, hooks: hooks(db) });
		const frozenBefore = (await getQuote(db, id))!.snapshot_json;

		const rev = await createRevision(db, id, {});
		expect(rev.ok).toBe(true);
		const v2 = (await getQuote(db, rev.quoteId!))!;
		expect(v2).toMatchObject({ version: 2, status: "draft" });
		expect(v2.quote_number).toMatch(/-V2$/);
		await saveQuoteDraft(db, v2.id, price(input, "150"), {});
		expect((await getQuote(db, id))!.snapshot_json).toBe(frozenBefore);
		expect((await getQuote(db, id))!.total).toBe(120);

		const s2 = await sendQuotation(db, v2.id, { cfg, brand, settings });
		await processOutbox(db, { onlyId: s2.outboxId, transport: okTransport(), config: cfg, hooks: hooks(db) });
		const old = (await getQuote(db, id))!;
		expect(old.superseded_by_id).toBe(v2.id);
		expect(old.accept_token_hash).toBeNull();
		expect((await getQuote(db, v2.id))!.status).toBe("sent");
	});

	it("customer acceptance via secure link is idempotent and does not confirm the booking", async () => {
		const { id: inquiryId } = await createInquiry(db, valid(), { cfg, brand, settings });
		const { id, input } = await draftFor(inquiryId);
		await saveQuoteDraft(db, id, input, {});
		let token = "";
		const capture: Transport = async (m) => {
			token = /quote\/accept\/([A-Za-z0-9_-]+)/.exec(m.html)?.[1] ?? "";
			return { ok: true, messageId: "m1" };
		};
		const s = await sendQuotation(db, id, { cfg, brand, settings });
		await processOutbox(db, { onlyId: s.outboxId, transport: capture, config: cfg, hooks: hooks(db) });
		expect(token.length).toBeGreaterThanOrEqual(32);
		expect((await getQuote(db, id))!.accept_token_hash).not.toContain(token); // only a hash is stored
		expect(await findQuoteByToken(db, "x".repeat(43))).toBeNull();

		const q = await findQuoteByToken(db, token);
		expect(q?.id).toBe(id);
		expect(await acceptQuote(db, q!, "customer_link", { cfg, brand })).toBe("accepted");
		expect(await acceptQuote(db, (await getQuote(db, id))!, "customer_link", { cfg, brand })).toBe("already_accepted");
		expect((await getInquiry(db, inquiryId))!.status).toBe("accepted");
		expect((await db.prepare("SELECT COUNT(*) c FROM bookings").first<{ c: number }>())!.c).toBe(0);
		expect((await db.prepare("SELECT COUNT(*) c FROM email_outbox WHERE category = 'owner_quote_accepted'").first<{ c: number }>())!.c).toBe(1);
	});

	it("expired links are refused", async () => {
		const { id: inquiryId } = await createInquiry(db, valid(), { cfg, brand, settings });
		const { id, input } = await draftFor(inquiryId);
		await saveQuoteDraft(db, id, input, {});
		const s = await sendQuotation(db, id, { cfg, brand, settings });
		await processOutbox(db, { onlyId: s.outboxId, transport: okTransport(), config: cfg, hooks: hooks(db) });
		const q = (await getQuote(db, id))!;
		expect(await acceptQuote(db, q, "customer_link", { cfg, brand, now: new Date(Date.now() + 30 * 86400_000) })).toBe("expired");
	});

	it("one quotation can create at most one booking (database-enforced)", async () => {
		const { id: inquiryId } = await createInquiry(db, valid(), { cfg, brand, settings });
		const { id } = await draftFor(inquiryId);
		const q = (await getQuote(db, id))!;
		const ins = (n: string) => db.prepare("INSERT INTO bookings (id, booking_number, quote_id, customer_id) VALUES (?, ?, ?, ?)").bind(n, n, id, q.customer_id).run();
		await ins("B1");
		await expect(ins("B2")).rejects.toThrow();
	});
});
