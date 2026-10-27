// Resend delivery webhooks (Svix-signed). Distinguishes "provider accepted" from
// "delivered / bounced". Configure in Resend → Webhooks with RESEND_WEBHOOK_SECRET.
import { NextResponse } from "next/server";
import { ensureEnv, getWebhookSecret } from "@/lib/env";
import { verifySvixSignature } from "@/lib/security/svix";
import { getDb } from "@/lib/db";
import { eventStatement } from "@/lib/crm/inquiries";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
	"email.sent": "accepted",
	"email.delivered": "delivered",
	"email.delivery_delayed": "delayed",
	"email.bounced": "bounced",
	"email.complained": "complained",
	"email.failed": "failed",
};

export async function POST(request: Request) {
	await ensureEnv();
	const secret = getWebhookSecret();
	if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });

	const body = await request.text();
	if (body.length > 100_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
	const ok = await verifySvixSignature(secret, { id: request.headers.get("svix-id"), timestamp: request.headers.get("svix-timestamp"), signature: request.headers.get("svix-signature") }, body);
	if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

	let evt: { type?: string; data?: { email_id?: string; bounce?: { message?: string } } };
	try {
		evt = JSON.parse(body);
	} catch {
		return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
	}
	const status = evt.type ? STATUS[evt.type] : undefined;
	const messageId = evt.data?.email_id;
	if (!status || !messageId) return NextResponse.json({ ok: true, ignored: true });

	const db = await getDb();
	const now = new Date().toISOString();
	const row = await db.prepare("SELECT id, inquiry_id, quote_id, to_email, subject, provider_status FROM email_outbox WHERE provider_message_id = ?").bind(messageId)
		.first<{ id: string; inquiry_id: string | null; quote_id: string | null; to_email: string; subject: string; provider_status: string | null }>();
	if (!row) return NextResponse.json({ ok: true, unknown: true });

	// Never let a late "accepted"/"delayed" event overwrite a terminal state.
	const terminal = ["delivered", "bounced", "complained", "failed"];
	if (row.provider_status && terminal.includes(row.provider_status) && !terminal.includes(status)) return NextResponse.json({ ok: true, stale: true });

	await db.prepare("UPDATE email_outbox SET provider_status = ?, provider_status_at = ?, updated_at = ? WHERE id = ?").bind(status, now, now, row.id).run();
	if (["bounced", "complained", "failed"].includes(status) && row.inquiry_id) {
		await eventStatement(db, {
			inquiryId: row.inquiry_id, quoteId: row.quote_id, type: "email_failed",
			message: `Email "${row.subject}" to ${row.to_email} ${status}${evt.data?.bounce?.message ? `: ${evt.data.bounce.message.slice(0, 200)}` : ""}`,
		}, now).run();
	}
	return NextResponse.json({ ok: true });
}
