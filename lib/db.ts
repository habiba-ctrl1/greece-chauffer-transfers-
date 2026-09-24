import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Get the D1 database instance from Cloudflare context.
 * Use this in all server actions and API routes.
 */
export async function getDb(): Promise<D1Database> {
	const { env } = await getCloudflareContext({ async: true });
	return env.DB;
}

/**
 * Health check — verifies D1 connectivity.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
	try {
		const db = await getDb();
		const result = await db.prepare("SELECT 1 as ok").first<{ ok: number }>();
		return result?.ok === 1;
	} catch {
		return false;
	}
}
