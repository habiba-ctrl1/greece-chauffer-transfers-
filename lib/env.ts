// ============================================================
// Server-side configuration (secrets + business email routing)
// ============================================================
// Everything here is read on the server only. Secrets live in the Cloudflare
// secret store (`wrangler secret put ...`) — never in the repo or the browser.

const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

export function isValidEmail(v: string): boolean {
	return v.length <= 254 && EMAIL_RE.test(v);
}

/** Worker bindings/secrets (wrangler secrets, .dev.vars) live on the Cloudflare env object; process.env is the fallback (tests, Node). */
let injected: Record<string, unknown> = {};

export function injectEnv(env: unknown): void {
	if (env && typeof env === "object") injected = env as Record<string, unknown>;
}

/** Call once per request before reading config (crmContext/getDb already do). */
export async function ensureEnv(): Promise<void> {
	try {
		const { getCloudflareContext } = await import("@opennextjs/cloudflare");
		injectEnv((await getCloudflareContext({ async: true })).env);
	} catch {
		/* not running on Workers (tests) — process.env is used */
	}
}

const read = (k: string): string | undefined => {
	const iv = injected[k];
	const v = typeof iv === "string" ? iv : process.env[k];
	return v && v.trim() ? v.trim() : undefined;
};

/** Business inbox that receives new-inquiry alerts. */
export const DEFAULT_BOOKING_NOTIFICATION_EMAIL = "greecechauffertransfers@gmail.com";

export interface MailConfig {
	/** Where internal booking notifications go. */
	notifyTo: string;
	/** Optional extra recipient for operational alerts (failures, follow-up digest). */
	opsAlertTo?: string;
	fromName: string;
	/** Authenticated sender; must be on a domain verified with the provider. */
	fromAddress?: string;
	transport: "resend" | "console";
	resendApiKey?: string;
	/** Absolute site URL used in admin links and customer acceptance links. */
	baseUrl: string;
}

export function getMailConfig(): MailConfig {
	const notify = read("BOOKING_NOTIFICATION_EMAIL");
	const ops = read("OPS_ALERT_EMAIL");
	const from = read("EMAIL_FROM_ADDRESS");
	return {
		notifyTo: notify && isValidEmail(notify) ? notify : DEFAULT_BOOKING_NOTIFICATION_EMAIL,
		opsAlertTo: ops && isValidEmail(ops) ? ops : undefined,
		fromName: read("EMAIL_FROM_NAME") ?? "Greece Chauffeur Service",
		fromAddress: from && isValidEmail(from) ? from : undefined,
		transport: read("EMAIL_TRANSPORT") === "console" ? "console" : "resend",
		resendApiKey: read("RESEND_API_KEY"),
		baseUrl: (read("APP_BASE_URL") ?? read("NEXT_PUBLIC_SITE_URL") ?? "https://greecechaufferservice.com").replace(/\/$/, ""),
	};
}

/** True when a real send could succeed (credentials + sender present). */
export function isMailConfigured(c: MailConfig = getMailConfig()): boolean {
	if (c.transport === "console") return true;
	return Boolean(c.resendApiKey && c.fromAddress);
}

export const getCronSecret = () => read("CRON_SECRET");
export const getWebhookSecret = () => read("RESEND_WEBHOOK_SECRET");
