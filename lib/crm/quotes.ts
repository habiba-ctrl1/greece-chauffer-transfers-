// ============================================================
// Quotation lifecycle: draft → frozen snapshot → sent → accepted
// ============================================================
// A quotation that has been sent is never edited in place: material changes
// create a new version. What the customer received is the frozen
// `snapshot_json`, from which the PDF is regenerated deterministically.
import { generateId } from "@/lib/utils";
import { athensToday, SERVICE_LABELS, type ServiceType } from "@/lib/crm/inquiry-input";
import { computeTotals, MoneyError, centsToAmount, formatMoney, type DiscountType, type LineInput } from "@/lib/crm/money";
import { afterQuoteSent } from "@/lib/crm/followups";
import { eventStatement, getInquiry, type ActionResult } from "@/lib/crm/inquiries";
import type { CrmSettings } from "@/lib/crm/settings";
import { cancelPendingForQuote, enqueueStatement, type OutboxRow } from "@/lib/email/outbox";
import { ownerQuoteAcceptedEmail, quotationEmail, type BrandInfo } from "@/lib/email/templates";
import { generateToken, sha256Hex } from "@/lib/security/crypto";
import type { MailConfig } from "@/lib/env";

export interface QuoteRow {
	id: string;
	quote_number: string;
	customer_id: string;
	inquiry_id: string | null;
	status: string;
	version: number;
	root_quote_id: string | null;
	superseded_by_id: string | null;
	pickup_location: string | null;
	dropoff_location: string | null;
	pickup_date: string | null;
	pickup_time: string | null;
	return_date: string | null;
	return_time: string | null;
	vehicle_category: string | null;
	passenger_count: number | null;
	luggage_info: string | null;
	flight_number: string | null;
	currency: string;
	journey_description: string | null;
	inclusions: string | null;
	exclusions: string | null;
	payment_terms: string | null;
	cancellation_terms: string | null;
	subtotal: number;
	discount_amount: number;
	discount_type: DiscountType | null;
	discount_value: number | null;
	fees_amount: number;
	tax_amount: number;
	tax_percent: number;
	total: number;
	notes: string | null;
	internal_notes: string | null;
	valid_until: string | null;
	snapshot_json: string | null;
	sent_at: string | null;
	accepted_at: string | null;
	accepted_via: string | null;
	rejected_at: string | null;
	accept_token_hash: string | null;
	accept_token_expires_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface QuoteSnapshot {
	quoteNumber: string;
	version: number;
	issuedAt: string;
	validUntil: string;
	currency: string;
	customer: { name: string; email: string; phone: string | null };
	inquiryReference: string | null;
	service: string;
	journey: {
		pickup: string; destination: string; date: string; time: string;
		returnDate: string; returnTime: string; passengers: string; luggage: string; flight: string; description: string;
	};
	vehicle: string;
	items: { description: string; quantity: number; unitPriceCents: number; totalCents: number }[];
	totals: { subtotalCents: number; discountCents: number; feesCents: number; taxCents: number; totalCents: number };
	discount: { type: DiscountType | null; value: number | null };
	taxPercent: number;
	inclusions: string;
	exclusions: string;
	paymentTerms: string;
	cancellationTerms: string;
	customerNotes: string;
	company: { name: string; email: string; phone: string; address: string; website: string; vat: string };
}

export interface QuoteInput {
	journeyDescription: string;
	vehicleCategory: string;
	passengerCount: number;
	luggageInfo: string;
	pickup: string;
	destination: string;
	date: string;
	time: string;
	returnDate: string;
	returnTime: string;
	flightNumber: string;
	currency: string;
	items: LineInput[];
	discountType: DiscountType | null;
	discountValue: string | number | null;
	feesAmount: string | number | null;
	taxPercent: string | number | null;
	inclusions: string;
	exclusions: string;
	paymentTerms: string;
	cancellationTerms: string;
	notes: string;
	internalNotes: string;
	validUntil: string;
}

export const getQuote = (db: D1Database, id: string) => db.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first<QuoteRow>();

// ── Numbering ───────────────────────────────────────────────

/** Atomic quotation numbers, continuing after any pre-existing GCS-Q-YYYY-NNNN rows. */
export async function nextQuoteNumber(db: D1Database, now: Date = new Date()): Promise<string> {
	const year = Number(athensToday(now).slice(0, 4));
	const row = await db
		.prepare(
			`INSERT INTO counters (name, year, value)
			 SELECT 'quote', ?, COALESCE(MAX(CAST(substr(quote_number, 10, 4) AS INTEGER)), 0) + 1 FROM quotes WHERE quote_number LIKE ?
			 ON CONFLICT(name, year) DO UPDATE SET value = value + 1 RETURNING value`
		)
		.bind(year, `GCS-Q-${year}-%`)
		.first<{ value: number }>();
	return `GCS-Q-${year}-${String(row!.value).padStart(4, "0")}`;
}

// ── Create / edit ───────────────────────────────────────────

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());

export function validateQuoteInput(input: QuoteInput, now: Date = new Date()): { ok: true } | { ok: false; error: string } {
	try {
		computeTotals({ items: input.items, discountType: input.discountType, discountValue: input.discountValue, feesAmount: input.feesAmount, taxPercent: input.taxPercent });
	} catch (e) {
		if (e instanceof MoneyError) return { ok: false, error: e.message };
		throw e;
	}
	if (!/^[A-Z]{3}$/.test(input.currency)) return { ok: false, error: "Currency must be a 3-letter code such as EUR." };
	if (!isDate(input.validUntil)) return { ok: false, error: "Choose a valid 'valid until' date." };
	if (input.validUntil < athensToday(now)) return { ok: false, error: "The validity date can't be in the past." };
	if (!Number.isInteger(input.passengerCount) || input.passengerCount < 1 || input.passengerCount > 60) return { ok: false, error: "Passengers must be between 1 and 60." };
	for (const [k, max] of [["journeyDescription", 2000], ["inclusions", 2000], ["exclusions", 2000], ["paymentTerms", 2000], ["cancellationTerms", 2000], ["notes", 2000], ["internalNotes", 4000]] as const) {
		if (String(input[k] ?? "").length > max) return { ok: false, error: `${k} is too long (max ${max} characters).` };
	}
	return { ok: true };
}

export function defaultQuoteInput(inq: {
	pickup_location: string; destination: string | null; pickup_date: string; pickup_time: string | null; return_date: string | null;
	return_time: string | null; adults: number; children: number; luggage: string | null; vehicle_preference: string | null; service_type: string;
	details: Record<string, string>;
}, s: CrmSettings, now: Date = new Date()): QuoteInput {
	const valid = new Date(now.getTime() + s.quoteValidityDays * 86400_000);
	const label = SERVICE_LABELS[inq.service_type as ServiceType] ?? inq.service_type;
	return {
		journeyDescription: `${label}: ${inq.pickup_location}${inq.destination ? ` → ${inq.destination}` : ""}`,
		vehicleCategory: inq.vehicle_preference ?? "",
		passengerCount: inq.adults + inq.children,
		luggageInfo: inq.luggage ?? "",
		pickup: inq.pickup_location,
		destination: inq.destination ?? "",
		date: inq.pickup_date,
		time: inq.pickup_time ?? "",
		returnDate: inq.return_date ?? "",
		returnTime: inq.return_time ?? "",
		flightNumber: inq.details.flight_number ?? "",
		currency: s.defaultCurrency,
		items: [{ description: label, quantity: 1, unitPrice: "" }],
		discountType: null,
		discountValue: null,
		feesAmount: null,
		taxPercent: s.taxPercent || null,
		inclusions: s.inclusions,
		exclusions: s.exclusions,
		paymentTerms: s.paymentTerms,
		cancellationTerms: s.cancellationTerms,
		notes: "",
		internalNotes: "",
		validUntil: athensToday(valid),
	};
}

async function writeQuoteBody(db: D1Database, quoteId: string, input: QuoteInput, nowIso: string, extra: D1PreparedStatement[] = []) {
	const t = computeTotals({ items: input.items, discountType: input.discountType, discountValue: input.discountValue, feesAmount: input.feesAmount, taxPercent: input.taxPercent });
	const stmts: D1PreparedStatement[] = [
		db.prepare(
			`UPDATE quotes SET journey_description = ?, vehicle_category = ?, passenger_count = ?, luggage_info = ?, pickup_location = ?, dropoff_location = ?,
			 pickup_date = ?, pickup_time = ?, return_date = ?, return_time = ?, flight_number = ?, currency = ?, subtotal = ?, discount_amount = ?, discount_type = ?,
			 discount_value = ?, fees_amount = ?, tax_percent = ?, tax_amount = ?, total = ?, inclusions = ?, exclusions = ?, payment_terms = ?, cancellation_terms = ?,
			 notes = ?, internal_notes = ?, valid_until = ?, snapshot_json = NULL, accept_token_hash = NULL, accept_token_expires_at = NULL, updated_at = ? WHERE id = ?`
		).bind(
			input.journeyDescription.trim() || null, input.vehicleCategory.trim() || null, input.passengerCount, input.luggageInfo.trim() || null,
			input.pickup.trim() || null, input.destination.trim() || null, input.date || null, input.time || null, input.returnDate || null, input.returnTime || null,
			input.flightNumber.trim() || null, input.currency, centsToAmount(t.subtotalCents), centsToAmount(t.discountCents), input.discountType,
			input.discountType ? Number(input.discountValue) : null, centsToAmount(t.feesCents), Number(input.taxPercent ?? 0) || 0, centsToAmount(t.taxCents),
			centsToAmount(t.totalCents), input.inclusions.trim() || null, input.exclusions.trim() || null, input.paymentTerms.trim() || null,
			input.cancellationTerms.trim() || null, input.notes.trim() || null, input.internalNotes.trim() || null, input.validUntil, nowIso, quoteId
		),
		db.prepare("DELETE FROM quote_items WHERE quote_id = ?").bind(quoteId),
		...t.lines.map((l, i) =>
			db.prepare("INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)")
				.bind(generateId(), quoteId, l.description.slice(0, 300), l.quantity, centsToAmount(l.unitPriceCents), centsToAmount(l.totalCents), i)
		),
		...extra,
	];
	await db.batch(stmts);
	return t;
}

export async function createQuoteFromInquiry(
	db: D1Database,
	inquiryId: string,
	input: QuoteInput | null,
	ctx: { settings: CrmSettings; actorId?: string | null; now?: Date }
): Promise<ActionResult & { quoteId?: string }> {
	const now = ctx.now ?? new Date();
	const inq = await getInquiry(db, inquiryId);
	if (!inq) return { ok: false, error: "Inquiry not found." };
	if (["lost", "cancelled", "completed"].includes(inq.status)) return { ok: false, error: "This inquiry is closed. Reopen it before quoting." };
	const existing = await db.prepare("SELECT id FROM quotes WHERE inquiry_id = ? ORDER BY version DESC LIMIT 1").bind(inquiryId).first<{ id: string }>();
	if (existing) return createRevision(db, existing.id, { actorId: ctx.actorId, now });

	const nowIso = now.toISOString();
	const id = generateId();
	const number = await nextQuoteNumber(db, now);
	const details = inq.details_json ? (JSON.parse(inq.details_json) as Record<string, string>) : {};
	const base = input ?? defaultQuoteInput({ ...inq, details }, ctx.settings, now);
	const quoteNumber = number;

	await db.batch([
		db.prepare(
			`INSERT INTO quotes (id, quote_number, customer_id, inquiry_id, status, version, root_quote_id, trip_type, subtotal, total, valid_until, created_by, created_at, updated_at)
			 VALUES (?, ?, ?, ?, 'draft', ?, ?, 'one_way', 0, 0, ?, ?, ?, ?)`
		).bind(id, quoteNumber, inq.customer_id, inquiryId, 1, id, base.validUntil, ctx.actorId ?? null, nowIso, nowIso),
		eventStatement(db, { inquiryId, quoteId: id, type: "quote_created", message: `Quotation ${quoteNumber} draft created`, actorId: ctx.actorId }, nowIso),
		...(["new", "reviewing", "awaiting_info"].includes(inq.status)
			? [
				db.prepare("UPDATE inquiries SET status = 'preparing_quote', updated_at = ? WHERE id = ?").bind(nowIso, inquiryId),
				eventStatement(db, { inquiryId, type: "status_changed", message: `Status changed from ${inq.status} to preparing_quote`, meta: { from: inq.status, to: "preparing_quote" }, actorId: ctx.actorId }, nowIso),
			]
			: []),
	]);
	// Items need a unit price; a brand-new draft stays at 0 until the owner prices it.
	await db.prepare("INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, sort_order) VALUES (?, ?, ?, 1, 0, 0, 0)")
		.bind(generateId(), id, base.items[0]?.description || "Chauffeur service").run();
	await db.prepare(
		`UPDATE quotes SET journey_description = ?, vehicle_category = ?, passenger_count = ?, luggage_info = ?, pickup_location = ?, dropoff_location = ?, pickup_date = ?, pickup_time = ?,
		 return_date = ?, return_time = ?, flight_number = ?, currency = ?, inclusions = ?, exclusions = ?, payment_terms = ?, cancellation_terms = ?, tax_percent = ? WHERE id = ?`
	).bind(
		base.journeyDescription || null, base.vehicleCategory || null, base.passengerCount, base.luggageInfo || null, base.pickup || null, base.destination || null, base.date || null,
		base.time || null, base.returnDate || null, base.returnTime || null, base.flightNumber || null, base.currency, base.inclusions || null, base.exclusions || null,
		base.paymentTerms || null, base.cancellationTerms || null, Number(base.taxPercent ?? 0) || 0, id
	).run();
	return { ok: true, quoteId: id };
}

/** Save an editable (draft) quotation. Invalidates any frozen snapshot / pending send. */
export async function saveQuoteDraft(db: D1Database, quoteId: string, input: QuoteInput, ctx: { actorId?: string | null; now?: Date }): Promise<ActionResult> {
	const q = await getQuote(db, quoteId);
	if (!q) return { ok: false, error: "Quotation not found." };
	if (q.status !== "draft") return { ok: false, error: "This quotation has been sent and can't be edited. Create a new version instead." };
	const v = validateQuoteInput(input, ctx.now);
	if (!v.ok) return v;
	const nowIso = (ctx.now ?? new Date()).toISOString();
	await cancelPendingForQuote(db, quoteId);
	await writeQuoteBody(db, quoteId, input, nowIso, q.inquiry_id ? [eventStatement(db, { inquiryId: q.inquiry_id, quoteId, type: "quote_edited", message: `Quotation ${q.quote_number} draft saved`, actorId: ctx.actorId }, nowIso)] : []);
	return { ok: true };
}

/** New editable version copied from any earlier quotation of the same inquiry. */
export async function createRevision(db: D1Database, fromQuoteId: string, ctx: { actorId?: string | null; now?: Date }): Promise<ActionResult & { quoteId?: string }> {
	const q = await getQuote(db, fromQuoteId);
	if (!q) return { ok: false, error: "Quotation not found." };
	if (!q.inquiry_id) return { ok: false, error: "Only quotations linked to an inquiry can be versioned." };
	const open = await db.prepare("SELECT id FROM quotes WHERE inquiry_id = ? AND status = 'draft' LIMIT 1").bind(q.inquiry_id).first<{ id: string }>();
	if (open) return { ok: true, quoteId: open.id };

	const now = ctx.now ?? new Date();
	const nowIso = now.toISOString();
	const id = generateId();
	const maxV = await db.prepare("SELECT COALESCE(MAX(version), 0) AS v FROM quotes WHERE inquiry_id = ?").bind(q.inquiry_id).first<{ v: number }>();
	const version = (maxV?.v ?? 0) + 1;
	const root = q.root_quote_id ?? q.id;
	const rootRow = await getQuote(db, root);
	const number = `${(rootRow ?? q).quote_number.replace(/-V\d+$/, "")}-V${version}`;
	await db.batch([
		db.prepare(
			`INSERT INTO quotes (id, quote_number, customer_id, inquiry_id, status, version, root_quote_id, trip_type, vehicle_category, vehicle_id, passenger_count, luggage_info,
			  flight_number, pickup_location, dropoff_location, pickup_date, pickup_time, return_date, return_time, currency, journey_description, inclusions, exclusions,
			  payment_terms, cancellation_terms, subtotal, discount_amount, discount_type, discount_value, fees_amount, tax_amount, tax_percent, total, notes, internal_notes,
			  valid_until, created_by, created_at, updated_at)
			 SELECT ?, ?, customer_id, inquiry_id, 'draft', ?, ?, trip_type, vehicle_category, vehicle_id, passenger_count, luggage_info,
			  flight_number, pickup_location, dropoff_location, pickup_date, pickup_time, return_date, return_time, currency, journey_description, inclusions, exclusions,
			  payment_terms, cancellation_terms, subtotal, discount_amount, discount_type, discount_value, fees_amount, tax_amount, tax_percent, total, notes, internal_notes,
			  valid_until, ?, ?, ? FROM quotes WHERE id = ?`
		).bind(id, number, version, root, ctx.actorId ?? null, nowIso, nowIso, fromQuoteId),
		db.prepare(
			`INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, sort_order)
			 SELECT lower(hex(randomblob(12))), ?, description, quantity, unit_price, total, sort_order FROM quote_items WHERE quote_id = ?`
		).bind(id, fromQuoteId),
		eventStatement(db, { inquiryId: q.inquiry_id, quoteId: id, type: "quote_revised", message: `New version ${number} created from ${q.quote_number}`, actorId: ctx.actorId }, nowIso),
	]);
	return { ok: true, quoteId: id };
}

// ── Snapshot ────────────────────────────────────────────────

export async function buildSnapshot(db: D1Database, q: QuoteRow, settings: CrmSettings): Promise<QuoteSnapshot> {
	const cust = await db.prepare("SELECT name, email, phone FROM customers WHERE id = ?").bind(q.customer_id).first<{ name: string; email: string | null; phone: string | null }>();
	const inq = q.inquiry_id ? await getInquiry(db, q.inquiry_id) : null;
	const items = await db.prepare("SELECT description, quantity, unit_price, total FROM quote_items WHERE quote_id = ? ORDER BY sort_order").bind(q.id).all<{ description: string; quantity: number; unit_price: number; total: number }>();
	const lines = (items.results ?? []).map((i) => ({ description: i.description, quantity: i.quantity, unitPriceCents: Math.round(i.unit_price * 100), totalCents: Math.round(i.total * 100) }));
	const t = computeTotals({
		items: lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: (l.unitPriceCents / 100).toFixed(2) })),
		discountType: q.discount_type, discountValue: q.discount_type ? (q.discount_value ?? q.discount_amount) : null,
		feesAmount: q.fees_amount, taxPercent: q.tax_percent,
	});
	return {
		quoteNumber: q.quote_number, version: q.version, issuedAt: (q.sent_at ?? new Date().toISOString()).slice(0, 10), validUntil: q.valid_until ?? "",
		currency: q.currency || "EUR",
		customer: { name: cust?.name ?? "", email: cust?.email ?? "", phone: cust?.phone ?? null },
		inquiryReference: inq?.reference ?? null,
		service: inq ? (SERVICE_LABELS[inq.service_type as ServiceType] ?? inq.service_type) : "Chauffeur service",
		journey: {
			pickup: q.pickup_location ?? "", destination: q.dropoff_location ?? "", date: q.pickup_date ?? "", time: q.pickup_time ?? "",
			returnDate: q.return_date ?? "", returnTime: q.return_time ?? "", passengers: q.passenger_count ? String(q.passenger_count) : "",
			luggage: q.luggage_info ?? "", flight: q.flight_number ?? "", description: q.journey_description ?? "",
		},
		vehicle: q.vehicle_category ?? "",
		items: t.lines,
		totals: { subtotalCents: t.subtotalCents, discountCents: t.discountCents, feesCents: t.feesCents, taxCents: t.taxCents, totalCents: t.totalCents },
		discount: { type: q.discount_type, value: q.discount_value },
		taxPercent: q.tax_percent,
		inclusions: q.inclusions ?? "", exclusions: q.exclusions ?? "", paymentTerms: q.payment_terms ?? "", cancellationTerms: q.cancellation_terms ?? "",
		customerNotes: q.notes ?? "",
		company: { name: settings.companyName, email: settings.companyEmail, phone: settings.companyPhone, address: settings.companyAddress, website: settings.companyWebsite, vat: settings.companyVat },
	};
}

/** Snapshot to render: the frozen one if the quotation was prepared for sending, else a live preview. */
export async function snapshotFor(db: D1Database, quoteId: string, settings: CrmSettings): Promise<QuoteSnapshot | null> {
	const q = await getQuote(db, quoteId);
	if (!q) return null;
	if (q.snapshot_json) return JSON.parse(q.snapshot_json) as QuoteSnapshot;
	return buildSnapshot(db, q, settings);
}

// ── Send ────────────────────────────────────────────────────

export interface SendCtx {
	cfg: MailConfig;
	brand: BrandInfo;
	settings: CrmSettings;
	actorId?: string | null;
	now?: Date;
}

export const pdfFileName = (s: { quoteNumber: string }) => `Quotation-${s.quoteNumber}.pdf`;

export function journeySummary(s: QuoteSnapshot): string {
	const when = [s.journey.date, s.journey.time].filter(Boolean).join(" ");
	return [s.journey.pickup + (s.journey.destination ? ` → ${s.journey.destination}` : ""), when].filter(Boolean).join(" · ");
}

/**
 * Freeze the quotation and queue the email with the PDF attached. Idempotent:
 * clicking twice returns the same outbox row and never queues a second email.
 */
export async function sendQuotation(db: D1Database, quoteId: string, ctx: SendCtx): Promise<ActionResult & { outboxId?: string }> {
	const now = ctx.now ?? new Date();
	const nowIso = now.toISOString();
	const q = await getQuote(db, quoteId);
	if (!q) return { ok: false, error: "Quotation not found." };

	const dedupeKey = `quote-send:${q.id}`;
	const prior = await db.prepare("SELECT id, status FROM email_outbox WHERE dedupe_key = ?").bind(dedupeKey).first<{ id: string; status: string }>();
	if (prior && prior.status !== "cancelled") return { ok: true, outboxId: prior.id };
	if (q.status !== "draft") return { ok: false, error: "Only draft quotations can be sent. Create a new version to change a sent quotation." };

	const cust = await db.prepare("SELECT name, email FROM customers WHERE id = ?").bind(q.customer_id).first<{ name: string; email: string | null }>();
	if (!cust?.email) return { ok: false, error: "The customer has no email address on file." };
	if (!(q.total > 0)) return { ok: false, error: "Add pricing before sending: the total is 0." };
	if (!q.valid_until || q.valid_until < athensToday(now)) return { ok: false, error: "The quotation has expired — set a new valid-until date." };
	const inq = q.inquiry_id ? await getInquiry(db, q.inquiry_id) : null;
	if (q.inquiry_id && (!inq || ["lost", "cancelled", "completed"].includes(inq.status))) return { ok: false, error: "The inquiry is closed." };

	// Re-validate stored data (never trust drafts blindly).
	const snap = await buildSnapshot(db, q, ctx.settings);
	snap.issuedAt = athensToday(now);
	snap.company.email = ctx.brand.email;

	const token = generateToken();
	const tokenHash = await sha256Hex(token);
	const expires = new Date(`${q.valid_until}T23:59:59Z`).toISOString();
	const email = quotationEmail(ctx.brand, {
		customerName: cust.name, quoteNumber: q.quote_number, version: q.version, journeySummary: journeySummary(snap),
		totalFormatted: formatMoney(snap.totals.totalCents, snap.currency), validUntil: snap.validUntil, acceptUrl: `${ctx.cfg.baseUrl}/quote/accept/${token}`,
		pdfName: pdfFileName(snap),
	});

	await db.batch([
		db.prepare("UPDATE quotes SET snapshot_json = ?, accept_token_hash = ?, accept_token_expires_at = ?, updated_at = ? WHERE id = ? AND status = 'draft'")
			.bind(JSON.stringify(snap), tokenHash, expires, nowIso, q.id),
		db.prepare("DELETE FROM email_outbox WHERE dedupe_key = ? AND status = 'cancelled'").bind(dedupeKey),
		enqueueStatement(db, {
			category: "quotation", to: cust.email, toName: cust.name, replyTo: ctx.brand.email, subject: email.subject, html: email.html, text: email.text,
			attachQuoteId: q.id, inquiryId: q.inquiry_id, quoteId: q.id, dedupeKey,
		}, nowIso),
		...(q.inquiry_id ? [eventStatement(db, { inquiryId: q.inquiry_id, quoteId: q.id, type: "email_queued", message: `Quotation ${q.quote_number} queued for ${cust.email}`, actorId: ctx.actorId }, nowIso)] : []),
	]);
	const row = await db.prepare("SELECT id FROM email_outbox WHERE dedupe_key = ?").bind(dedupeKey).first<{ id: string }>();
	return { ok: true, outboxId: row?.id };
}

/** Outbox hooks: what happens once the provider accepts / permanently rejects an email. */
export function quoteSentHook(db: D1Database, settings: CrmSettings) {
	return async (row: OutboxRow) => {
		const nowIso = row.sent_at ?? new Date().toISOString();
		if (row.inquiry_id) {
			await eventStatement(db, { inquiryId: row.inquiry_id, quoteId: row.quote_id, type: "email_sent", message: `Email "${row.subject}" accepted by the mail provider for ${row.to_email}` }, nowIso).run();
		}
		if (row.category !== "quotation" || !row.quote_id) return;
		const q = await getQuote(db, row.quote_id);
		if (!q || q.status !== "draft") return;
		const inq = row.inquiry_id ? await getInquiry(db, row.inquiry_id) : null;
		const stmts: D1PreparedStatement[] = [
			db.prepare("UPDATE quotes SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ? AND status = 'draft'").bind(nowIso, nowIso, q.id),
			...(row.inquiry_id ? [eventStatement(db, { inquiryId: row.inquiry_id, quoteId: q.id, type: "quote_sent", message: `Quotation ${q.quote_number} sent to ${row.to_email}` }, nowIso)] : []),
		];
		// An older, still-open version is superseded by the one now sent.
		const prev = !row.inquiry_id ? { results: [] as { id: string }[] } : await db.prepare("SELECT id FROM quotes WHERE inquiry_id = ? AND id != ? AND status IN ('sent','viewed') AND superseded_by_id IS NULL AND version < ?").bind(row.inquiry_id, q.id, q.version).all<{ id: string }>();
		for (const p of prev.results ?? []) {
			stmts.push(db.prepare("UPDATE quotes SET status = 'cancelled', superseded_by_id = ?, accept_token_hash = NULL, updated_at = ? WHERE id = ?").bind(q.id, nowIso, p.id));
		}
		if (inq && ["new", "reviewing", "awaiting_info", "preparing_quote", "quote_sent", "accepted"].includes(inq.status)) {
			stmts.push(
				db.prepare("UPDATE inquiries SET status = 'quote_sent', last_contact_at = ?, next_followup_at = ?, followup_note = NULL, updated_at = ? WHERE id = ?")
					.bind(nowIso, afterQuoteSent(new Date(nowIso), settings), nowIso, inq.id)
			);
			if (inq.status !== "quote_sent") stmts.push(eventStatement(db, { inquiryId: inq.id, type: "status_changed", message: `Status changed from ${inq.status} to quote_sent`, meta: { from: inq.status, to: "quote_sent" } }, nowIso));
		}
		await db.batch(stmts);
	};
}

export function emailDeadHook(db: D1Database) {
	return async (row: OutboxRow) => {
		if (!row.inquiry_id) return;
		await eventStatement(db, {
			inquiryId: row.inquiry_id, quoteId: row.quote_id, type: row.category === "quotation" ? "quote_send_failed" : "email_failed",
			message: `Email "${row.subject}" to ${row.to_email} failed: ${row.last_error ?? "unknown error"}`,
		}).run();
	};
}

// ── Acceptance ──────────────────────────────────────────────

export type AcceptOutcome = "accepted" | "already_accepted" | "invalid" | "expired" | "not_current";

export async function acceptQuote(
	db: D1Database,
	q: QuoteRow,
	via: "customer_link" | "manual",
	ctx: { cfg: MailConfig; brand: BrandInfo; actorId?: string | null; now?: Date }
): Promise<AcceptOutcome> {
	const now = ctx.now ?? new Date();
	const nowIso = now.toISOString();
	if (q.status === "accepted") return "already_accepted";
	if (q.superseded_by_id || q.status === "cancelled") return "not_current";
	if (q.status !== "sent" && q.status !== "viewed") return "invalid";
	if (via === "customer_link" && ((q.valid_until && q.valid_until < athensToday(now)) || (q.accept_token_expires_at && q.accept_token_expires_at < nowIso))) return "expired";

	// Compare-and-set: only one concurrent accept wins.
	const res = await db.prepare("UPDATE quotes SET status = 'accepted', accepted_at = ?, accepted_via = ?, updated_at = ? WHERE id = ? AND status IN ('sent','viewed')").bind(nowIso, via, nowIso, q.id).run();
	if (!res.meta.changes) return "already_accepted";

	if (q.inquiry_id) {
		const inq = await getInquiry(db, q.inquiry_id);
		const cust = await db.prepare("SELECT name FROM customers WHERE id = ?").bind(q.customer_id).first<{ name: string }>();
		const stmts: D1PreparedStatement[] = [
			eventStatement(db, { inquiryId: q.inquiry_id, quoteId: q.id, type: "quote_accepted", message: `Quotation ${q.quote_number} (v${q.version}) accepted ${via === "manual" ? "(recorded by owner)" : "by the customer via link"}`, actorId: ctx.actorId }, nowIso),
			db.prepare("UPDATE inquiries SET next_followup_at = NULL, last_contact_at = ?, updated_at = ? WHERE id = ?").bind(nowIso, nowIso, q.inquiry_id),
		];
		if (inq && ["quote_sent", "preparing_quote", "reviewing", "awaiting_info", "new"].includes(inq.status)) {
			stmts.push(db.prepare("UPDATE inquiries SET status = 'accepted' WHERE id = ?").bind(q.inquiry_id));
			stmts.push(eventStatement(db, { inquiryId: q.inquiry_id, type: "status_changed", message: `Status changed from ${inq.status} to accepted`, meta: { from: inq.status, to: "accepted" } }, nowIso));
		}
		if (via === "customer_link" && inq) {
			const mail = ownerQuoteAcceptedEmail(ctx.brand, inq.reference, q.quote_number, cust?.name ?? "The customer", `${ctx.cfg.baseUrl}/admin/inquiries/${inq.id}`);
			stmts.push(enqueueStatement(db, { category: "owner_quote_accepted", to: ctx.cfg.notifyTo, subject: mail.subject, html: mail.html, text: mail.text, inquiryId: inq.id, quoteId: q.id, dedupeKey: `quote-accepted:${q.id}` }, nowIso));
		}
		await db.batch(stmts);
	}
	return "accepted";
}

export async function findQuoteByToken(db: D1Database, token: string): Promise<QuoteRow | null> {
	if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null;
	const hash = await sha256Hex(token);
	return db.prepare("SELECT * FROM quotes WHERE accept_token_hash = ?").bind(hash).first<QuoteRow>();
}

export async function rejectQuote(db: D1Database, quoteId: string, reason: string, actorId?: string | null): Promise<ActionResult> {
	const q = await getQuote(db, quoteId);
	if (!q) return { ok: false, error: "Quotation not found." };
	if (!["sent", "viewed"].includes(q.status)) return { ok: false, error: "Only a sent quotation can be marked as rejected." };
	const nowIso = new Date().toISOString();
	await db.batch([
		db.prepare("UPDATE quotes SET status = 'rejected', rejected_at = ?, accept_token_hash = NULL, updated_at = ? WHERE id = ? AND status IN ('sent','viewed')").bind(nowIso, nowIso, quoteId),
		...(q.inquiry_id ? [eventStatement(db, { inquiryId: q.inquiry_id, quoteId, type: "quote_rejected", message: `Quotation ${q.quote_number} rejected${reason ? `: ${reason.slice(0, 200)}` : ""}`, actorId }, nowIso)] : []),
	]);
	return { ok: true };
}

/** Mark sent quotations past their validity date as expired and clear their links. */
export async function expireQuotes(db: D1Database, now: Date = new Date()): Promise<number> {
	const today = athensToday(now);
	const due = await db.prepare("SELECT id, inquiry_id, quote_number FROM quotes WHERE status IN ('sent','viewed') AND superseded_by_id IS NULL AND valid_until < ?").bind(today).all<{ id: string; inquiry_id: string | null; quote_number: string }>();
	const nowIso = now.toISOString();
	for (const r of due.results ?? []) {
		await db.batch([
			db.prepare("UPDATE quotes SET status = 'expired', accept_token_hash = NULL, updated_at = ? WHERE id = ? AND status IN ('sent','viewed')").bind(nowIso, r.id),
			...(r.inquiry_id ? [eventStatement(db, { inquiryId: r.inquiry_id, quoteId: r.id, type: "quote_expired", message: `Quotation ${r.quote_number} expired` }, nowIso)] : []),
		]);
	}
	return due.results?.length ?? 0;
}
