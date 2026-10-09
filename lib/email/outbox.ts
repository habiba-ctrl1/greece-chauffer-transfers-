// ============================================================
// Durable email outbox
// ============================================================
// Emails are written to `email_outbox` first (in the same batch as the record
// that caused them), then sent. A failure never loses the record: the row
// stays queued/failed, is retried with back-off, and is visible in the admin.
import { generateId } from "@/lib/utils";
import { getMailConfig, type MailConfig } from "@/lib/env";
import { defaultTransport, type MailAttachment, type Transport } from "@/lib/email/transport";

export type EmailCategory =
	| "owner_new_inquiry"
	| "customer_acknowledgment"
	| "quotation"
	| "booking_confirmation"
	| "customer_followup"
	| "owner_quote_accepted"
	| "owner_followup_digest"
	| "test";

export interface EnqueueInput {
	category: EmailCategory;
	to: string;
	toName?: string | null;
	replyTo?: string | null;
	subject: string;
	html: string;
	text?: string | null;
	/** Generate this quotation's PDF at send time and attach it. */
	attachQuoteId?: string | null;
	inquiryId?: string | null;
	quoteId?: string | null;
	bookingId?: string | null;
	/** UNIQUE: re-enqueueing the same key is a no-op (double-click protection). */
	dedupeKey?: string | null;
	maxAttempts?: number;
}

export interface OutboxRow {
	id: string;
	category: EmailCategory;
	to_email: string;
	to_name: string | null;
	reply_to: string | null;
	subject: string;
	html: string;
	text_body: string | null;
	attach_quote_id: string | null;
	inquiry_id: string | null;
	quote_id: string | null;
	booking_id: string | null;
	status: "queued" | "sending" | "sent" | "failed" | "dead" | "cancelled";
	attempts: number;
	max_attempts: number;
	next_attempt_at: string;
	last_error: string | null;
	provider_message_id: string | null;
	provider_status: string | null;
	sent_at: string | null;
	created_at: string;
}

/** Prepared INSERT so callers can include it in a db.batch() with their own writes. */
export function enqueueStatement(db: D1Database, input: EnqueueInput, nowIso: string = new Date().toISOString()) {
	return db
		.prepare(
			`INSERT OR IGNORE INTO email_outbox (
				id, category, dedupe_key, to_email, to_name, reply_to, subject, html, text_body,
				attach_quote_id, inquiry_id, quote_id, booking_id, status, attempts, max_attempts,
				next_attempt_at, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?, ?, ?)`
		)
		.bind(
			generateId(), input.category, input.dedupeKey ?? null, input.to, input.toName ?? null, input.replyTo ?? null,
			input.subject, input.html, input.text ?? null, input.attachQuoteId ?? null, input.inquiryId ?? null,
			input.quoteId ?? null, input.bookingId ?? null, input.maxAttempts ?? 5, nowIso, nowIso, nowIso
		);
}

export async function enqueueEmail(db: D1Database, input: EnqueueInput): Promise<string | null> {
	await enqueueStatement(db, input).run();
	if (!input.dedupeKey) return null;
	const row = await db.prepare("SELECT id FROM email_outbox WHERE dedupe_key = ?").bind(input.dedupeKey).first<{ id: string }>();
	return row?.id ?? null;
}

export interface OutboxHooks {
	/** Build the attachment for a quotation email (PDF from the frozen snapshot). */
	buildQuoteAttachment?: (quoteId: string) => Promise<MailAttachment>;
	/** Called once, after the provider accepted the message. */
	onSent?: (row: OutboxRow) => Promise<void>;
	/** Called when a message reaches a terminal failure ('dead'). */
	onDead?: (row: OutboxRow) => Promise<void>;
}

export interface ProcessOptions {
	limit?: number;
	/** Only process this row (used for immediate user-triggered sends). */
	onlyId?: string;
	/** Ignore back-off schedules (an admin explicitly asked to send now). */
	force?: boolean;
	transport?: Transport;
	config?: MailConfig;
	hooks?: OutboxHooks;
	now?: Date;
}

export interface ProcessResult {
	attempted: number;
	sent: number;
	failed: number;
	notConfigured: number;
}

const LOCK_MS = 5 * 60 * 1000;
/** 5m, 10m, 20m, 40m … capped at 6h. */
export const backoffMs = (attempt: number) => Math.min(6 * 3600_000, 5 * 60_000 * 2 ** Math.max(0, attempt - 1));

export async function processOutbox(db: D1Database, opts: ProcessOptions = {}): Promise<ProcessResult> {
	const cfg = opts.config ?? getMailConfig();
	const transport = opts.transport ?? defaultTransport(cfg);
	const now = opts.now ?? new Date();
	const nowIso = now.toISOString();
	const result: ProcessResult = { attempted: 0, sent: 0, failed: 0, notConfigured: 0 };

	const where = opts.onlyId ? "id = ?" : "1=1";
	const due = await db
		.prepare(
			`SELECT * FROM email_outbox
			 WHERE ${where} AND status IN ('queued','failed','sending') AND (? OR next_attempt_at <= ?) AND attempts < max_attempts
			   AND (locked_until IS NULL OR locked_until < ?)
			 ORDER BY next_attempt_at ASC LIMIT ?`
		)
		.bind(...(opts.onlyId ? [opts.onlyId] : []), opts.force || opts.onlyId ? 1 : 0, nowIso, nowIso, opts.limit ?? 20)
		.all<OutboxRow>();

	for (const row of due.results ?? []) {
		// Claim the row: only one worker can flip it into 'sending'.
		const claim = await db
			.prepare(
				`UPDATE email_outbox SET status = 'sending', attempts = attempts + 1, locked_until = ?, updated_at = ?
				 WHERE id = ? AND status IN ('queued','failed','sending') AND (locked_until IS NULL OR locked_until < ?)`
			)
			.bind(new Date(now.getTime() + LOCK_MS).toISOString(), nowIso, row.id, nowIso)
			.run();
		if (!claim.meta.changes) continue;
		result.attempted++;
		const attempt = row.attempts + 1;

		let outcome;
		try {
			const attachments: MailAttachment[] = [];
			if (row.attach_quote_id) {
				if (!opts.hooks?.buildQuoteAttachment) throw new Error("No PDF builder available");
				attachments.push(await opts.hooks.buildQuoteAttachment(row.attach_quote_id));
			}
			outcome = await transport(
				{
					toEmail: row.to_email, toName: row.to_name, replyTo: row.reply_to, subject: row.subject,
					html: row.html, text: row.text_body, attachments, idempotencyKey: row.id,
				},
				cfg
			);
		} catch (e) {
			outcome = { ok: false as const, retryable: true, error: `Send error: ${(e as Error).message}`.slice(0, 500) };
		}

		if (outcome.ok) {
			await db
				.prepare(
					`UPDATE email_outbox SET status = 'sent', provider_message_id = ?, provider_status = 'accepted', sent_at = ?, last_error = NULL,
					 locked_until = NULL, updated_at = ? WHERE id = ?`
				)
				.bind(outcome.messageId, nowIso, nowIso, row.id)
				.run();
			result.sent++;
			try {
				await opts.hooks?.onSent?.({ ...row, status: "sent", attempts: attempt, provider_message_id: outcome.messageId, sent_at: nowIso });
			} catch (e) {
				console.error("outbox onSent hook failed", e);
			}
		} else if (outcome.notConfigured) {
			// Not the message's fault: don't burn an attempt, keep it queued.
			await db
				.prepare(
					`UPDATE email_outbox SET status = 'queued', attempts = attempts - 1, last_error = ?, locked_until = NULL,
					 next_attempt_at = ?, updated_at = ? WHERE id = ?`
				)
				.bind(outcome.error, new Date(now.getTime() + 15 * 60_000).toISOString(), nowIso, row.id)
				.run();
			result.notConfigured++;
		} else {
			const dead = !outcome.retryable || attempt >= row.max_attempts;
			await db
				.prepare(
					`UPDATE email_outbox SET status = ?, last_error = ?, locked_until = NULL, next_attempt_at = ?, updated_at = ? WHERE id = ?`
				)
				.bind(dead ? "dead" : "failed", outcome.error, new Date(now.getTime() + backoffMs(attempt)).toISOString(), nowIso, row.id)
				.run();
			result.failed++;
			if (dead) {
				try {
					await opts.hooks?.onDead?.({ ...row, status: "dead", attempts: attempt, last_error: outcome.error });
				} catch (e) {
					console.error("outbox onDead hook failed", e);
				}
			}
		}
	}
	return result;
}

/** Manual retry: only for rows that did not succeed. Never re-sends a 'sent' email. */
export async function retryEmail(db: D1Database, id: string, now: Date = new Date()): Promise<boolean> {
	const nowIso = now.toISOString();
	const r = await db
		.prepare(
			`UPDATE email_outbox SET status = 'queued', attempts = 0, next_attempt_at = ?, locked_until = NULL, updated_at = ?
			 WHERE id = ? AND status IN ('failed','dead','queued')`
		)
		.bind(nowIso, nowIso, id)
		.run();
	return r.meta.changes > 0;
}

export async function cancelPendingForQuote(db: D1Database, quoteId: string): Promise<void> {
	await db
		.prepare(`UPDATE email_outbox SET status = 'cancelled', updated_at = ? WHERE quote_id = ? AND category = 'quotation' AND status IN ('queued','failed','dead')`)
		.bind(new Date().toISOString(), quoteId)
		.run();
}
