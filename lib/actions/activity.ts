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

export interface ActivityFeedItem {
	id: string;
	action: string;
	entity_type: string;
	entity_id: string | null;
	/** Human-readable summary: details.message when the writer supplied one, else a generic fallback. */
	message: string;
	actor_name: string | null;
	created_at: string;
}

/**
 * Where an activity row's entity actually lives, for the dashboard feed's
 * "open it" link. Returns null for entity types with no detail page
 * (e.g. company_settings) rather than guessing a route.
 */
export function activityEntityHref(entityType: string, entityId: string | null): string | null {
	if (!entityId) return null;
	switch (entityType) {
		case "booking":
			return `/admin/bookings/${entityId}`;
		case "quote":
			return `/admin/quotes/${entityId}`;
		case "invoice":
			return `/admin/invoices/${entityId}`;
		case "driver":
			return `/admin/drivers/${entityId}`;
		case "customer":
			return `/admin/customers/${entityId}`;
		default:
			return null;
	}
}

/**
 * Recent activity for the dashboard feed, with the acting user's name
 * joined in and a human-readable message resolved from the stored
 * details JSON. Action/entity naming isn't fully consistent across
 * modules (some write {message}, older ones write raw field dumps), so
 * this falls back to a generated summary rather than failing to render.
 */
export async function getRecentActivityFeed(limit = 8): Promise<ActivityFeedItem[]> {
	try {
		const db = await getDb();
		const { results } = await db
			.prepare(
				`SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.name as actor_name
				 FROM activity_logs a
				 LEFT JOIN users u ON u.id = a.user_id
				 ORDER BY a.created_at DESC
				 LIMIT ?`
			)
			.bind(limit)
			.all<{
				id: string;
				action: string;
				entity_type: string;
				entity_id: string | null;
				details: string | null;
				created_at: string;
				actor_name: string | null;
			}>();

		return (results || []).map((row) => {
			let message: string | null = null;
			if (row.details) {
				try {
					const parsed = JSON.parse(row.details);
					if (parsed && typeof parsed.message === "string") {
						message = parsed.message;
					}
				} catch {
					// stored details wasn't JSON — fall through to the generic summary
				}
			}
			if (!message) {
				const readableAction = row.action.replace(/[._]/g, " ");
				message = `${readableAction} — ${row.entity_type}${row.entity_id ? " #" + row.entity_id.slice(-6) : ""}`;
			}

			return {
				id: row.id,
				action: row.action,
				entity_type: row.entity_type,
				entity_id: row.entity_id,
				message,
				actor_name: row.actor_name,
				created_at: row.created_at,
			};
		});
	} catch (e) {
		console.error("Error in getRecentActivityFeed:", e);
		return [];
	}
}
