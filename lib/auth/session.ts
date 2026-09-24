// ============================================================
// Auth — Session Management
// ============================================================

import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { SafeUser, User } from "@/lib/schema";
import { cookies } from "next/headers";

const SESSION_COOKIE = "gcs_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a new session for a user and set the session cookie.
 */
export async function createSession(userId: string): Promise<string> {
	const db = await getDb();
	const sessionId = generateId();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

	await db
		.prepare(
			"INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
		)
		.bind(sessionId, userId, expiresAt)
		.run();

	// Set cookie
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE, sessionId, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_DURATION_MS / 1000,
	});

	return sessionId;
}

/**
 * Get the current authenticated user from the session cookie.
 * Returns null if not authenticated or session expired.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
	try {
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get(SESSION_COOKIE);
		if (!sessionCookie?.value) return null;

		const db = await getDb();
		const row = await db
			.prepare(
				`SELECT u.id, u.email, u.name, u.role, u.status
				 FROM sessions s
				 JOIN users u ON u.id = s.user_id
				 WHERE s.id = ? AND s.expires_at > datetime('now') AND u.status = 'active'`
			)
			.bind(sessionCookie.value)
			.first<SafeUser>();

		return row || null;
	} catch {
		return null;
	}
}

/**
 * Destroy the current session (logout).
 */
export async function destroySession(): Promise<void> {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get(SESSION_COOKIE);

	if (sessionCookie?.value) {
		const db = await getDb();
		await db
			.prepare("DELETE FROM sessions WHERE id = ?")
			.bind(sessionCookie.value)
			.run();
	}

	cookieStore.delete(SESSION_COOKIE);
}

/**
 * Clean up expired sessions (call periodically).
 */
export async function cleanExpiredSessions(): Promise<void> {
	const db = await getDb();
	await db
		.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')")
		.run();
}
