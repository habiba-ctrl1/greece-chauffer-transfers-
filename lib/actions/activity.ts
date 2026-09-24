import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Record an audit log entry in the activity_logs table.
 */
export async function recordActivity(
	action: string,
	entityType: string,
	entityId?: string | null,
	details?: Record<string, unknown> | null
): Promise<void> {
	try {
		const db = await getDb();
		const user = await getCurrentUser();
		const id = generateId();
		const now = new Date().toISOString();

		await db
			.prepare(
				`INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				id,
				user?.id || null,
				action,
				entityType,
				entityId || null,
				details ? JSON.stringify(details) : null,
				now
			)
			.run();
	} catch (e) {
		console.error("Failed to record activity log:", e);
	}
}
