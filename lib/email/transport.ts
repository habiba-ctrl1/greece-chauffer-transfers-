// ============================================================
// Email transports
// ============================================================
// "resend"  — Resend REST API (works on Cloudflare Workers, which cannot open SMTP sockets).
// "console" — local development only (EMAIL_TRANSPORT=console). Never a silent production fallback.
import { getMailConfig, type MailConfig } from "@/lib/env";

export interface MailAttachment {
	filename: string;
	content: Uint8Array;
	contentType: string;
}

export interface MailMessage {
	toEmail: string;
	toName?: string | null;
	replyTo?: string | null;
	subject: string;
	html: string;
	text?: string | null;
	attachments?: MailAttachment[];
	/** Stable across retries so the provider can de-duplicate. */
	idempotencyKey: string;
}

export type TransportResult =
	| { ok: true; messageId: string }
	| { ok: false; error: string; retryable: boolean; notConfigured?: boolean };

export type Transport = (msg: MailMessage, cfg: MailConfig) => Promise<TransportResult>;

const toBase64 = (bytes: Uint8Array) => {
	let s = "";
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
	return btoa(s);
};

/** Display names must not be able to break out of the header. */
const safeName = (n: string) => n.replace(/[\r\n"<>]/g, "").trim();

export const resendTransport: Transport = async (msg, cfg) => {
	if (!cfg.resendApiKey || !cfg.fromAddress) {
		return {
			ok: false,
			notConfigured: true,
			retryable: true,
			error: "Email provider is not configured (set RESEND_API_KEY and EMAIL_FROM_ADDRESS).",
		};
	}
	try {
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${cfg.resendApiKey}`,
				"Content-Type": "application/json",
				"Idempotency-Key": msg.idempotencyKey,
			},
			body: JSON.stringify({
				from: `${safeName(cfg.fromName)} <${cfg.fromAddress}>`,
				to: [msg.toName ? `${safeName(msg.toName)} <${msg.toEmail}>` : msg.toEmail],
				reply_to: msg.replyTo || undefined,
				subject: msg.subject,
				html: msg.html,
				text: msg.text || undefined,
				attachments: msg.attachments?.map((a) => ({ filename: a.filename, content: toBase64(a.content) })),
			}),
		});
		if (res.ok) {
			const data = (await res.json().catch(() => ({}))) as { id?: string };
			if (!data.id) return { ok: false, retryable: true, error: "Provider accepted the request but returned no message id." };
			return { ok: true, messageId: data.id };
		}
		const body = (await res.json().catch(() => ({}))) as { message?: string };
		const retryable = res.status === 429 || res.status >= 500;
		return { ok: false, retryable, error: `Provider error ${res.status}: ${body.message ?? "request rejected"}`.slice(0, 500) };
	} catch (e) {
		return { ok: false, retryable: true, error: `Network error: ${(e as Error).message}`.slice(0, 500) };
	}
};

export const consoleTransport: Transport = async (msg) => {
	console.log(`[email:console] to=${msg.toEmail} subject=${msg.subject} attachments=${msg.attachments?.length ?? 0}`);
	return { ok: true, messageId: `console_${Date.now()}` };
};

export function defaultTransport(cfg: MailConfig = getMailConfig()): Transport {
	return cfg.transport === "console" ? consoleTransport : resendTransport;
}
