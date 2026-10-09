// Fixed-window rate limiter backed by D1 (works across Worker isolates).

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
}

export async function rateLimit(
	db: D1Database,
	key: string,
	limit: number,
	windowSeconds: number,
	nowMs: number = Date.now()
): Promise<RateLimitResult> {
	const windowStart = Math.floor(nowMs / 1000 / windowSeconds) * windowSeconds;
	const row = await db
		.prepare(
			`INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
			 ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
			 RETURNING count`
		)
		.bind(key, windowStart)
		.first<{ count: number }>();
	const count = row?.count ?? 1;
	return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function pruneRateLimits(db: D1Database, nowMs: number = Date.now()): Promise<void> {
	await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(Math.floor(nowMs / 1000) - 86400).run();
}

/** Best-effort client IP from Cloudflare / proxy headers. */
export function clientIp(h: Headers): string {
	return h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
