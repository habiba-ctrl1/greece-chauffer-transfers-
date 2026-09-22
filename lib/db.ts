import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function checkDatabaseConnection(): Promise<boolean> {
	try {
		const { env } = await getCloudflareContext({ async: true });
		const result = await env.DB.prepare("SELECT 1 as ok").first<{ ok: number }>();
		return result?.ok === 1;
	} catch {
		return false;
	}
}
