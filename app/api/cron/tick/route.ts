// Scheduled maintenance: retry emails, expire quotations, owner follow-up digest.
// Protected by CRON_SECRET (Authorization: Bearer ...). Idempotent — safe to call as often as you like.
import { NextResponse } from "next/server";
import { ensureEnv, getCronSecret } from "@/lib/env";
import { safeEqual } from "@/lib/security/crypto";
import { crmContext, drainOutbox } from "@/lib/crm/service";
import { expireQuotes } from "@/lib/crm/quotes";
import { athensDayStart } from "@/lib/crm/queries";
import { athensToday } from "@/lib/crm/inquiry-input";
import { FOLLOWUP_ELIGIBLE } from "@/lib/crm/status";
import { enqueueEmail } from "@/lib/email/outbox";
import { followUpDigestEmail } from "@/lib/email/templates";
import { pruneRateLimits } from "@/lib/security/rate-limit";
import { cleanExpiredSessions } from "@/lib/auth/session";
import { isMailConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	await ensureEnv();
	const secret = getCronSecret();
	if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
	const auth = request.headers.get("authorization") ?? "";
	if (!safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const now = new Date();
	const ctx = await crmContext();
	const out: Record<string, unknown> = {};

	out.expiredQuotes = await expireQuotes(ctx.db, now);

	// Owner digest (twice a day at most; deduped by key so repeated ticks never duplicate it).
	const dayEnd = athensDayStart(now, 1);
	const due = await ctx.db
		.prepare(
			`SELECT i.id, i.reference, i.status, i.next_followup_at, c.name FROM inquiries i JOIN customers c ON c.id = i.customer_id
			 WHERE i.archived_at IS NULL AND i.status IN (${FOLLOWUP_ELIGIBLE.map((s) => `'${s}'`).join(",")}) AND i.next_followup_at < ? ORDER BY i.next_followup_at LIMIT 25`
		)
		.bind(dayEnd)
		.all<{ id: string; reference: string; status: string; next_followup_at: string; name: string }>();
	const failed = (await ctx.db.prepare("SELECT COUNT(*) c FROM email_outbox WHERE status IN ('failed','dead')").first<{ c: number }>())?.c ?? 0;
	const items = due.results ?? [];
	if (items.length || failed) {
		const athensHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Athens", hour: "2-digit", hour12: false }).format(now));
		const mail = followUpDigestEmail(
			ctx.brand,
			items.map((i) => ({ reference: i.reference, customer: i.name, status: i.status.replace(/_/g, " "), due: i.next_followup_at.slice(0, 10), url: `${ctx.cfg.baseUrl}/admin/inquiries/${i.id}` })),
			failed,
			`${ctx.cfg.baseUrl}/admin/followups`
		);
		const key = `followup-digest:${athensToday(now)}:${athensHour >= 14 ? "pm" : "am"}`;
		await enqueueEmail(ctx.db, { category: "owner_followup_digest", to: ctx.cfg.notifyTo, subject: mail.subject, html: mail.html, text: mail.text, dedupeKey: key });
		if (ctx.cfg.opsAlertTo && ctx.cfg.opsAlertTo !== ctx.cfg.notifyTo) {
			await enqueueEmail(ctx.db, { category: "owner_followup_digest", to: ctx.cfg.opsAlertTo, subject: mail.subject, html: mail.html, text: mail.text, dedupeKey: `${key}:ops` });
		}
	}

	out.mailConfigured = isMailConfigured(ctx.cfg);
	out.outbox = out.mailConfigured ? await drainOutbox(ctx, { limit: 25 }) : "skipped: email not configured";

	await pruneRateLimits(ctx.db).catch(() => undefined);
	await cleanExpiredSessions().catch(() => undefined);
	return NextResponse.json({ ok: true, ...out });
}
