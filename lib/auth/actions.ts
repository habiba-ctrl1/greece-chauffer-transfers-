// ============================================================
// Auth — Login / Logout Server Actions
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import type { User } from "@/lib/schema";

export interface LoginResult {
	error?: string;
}

/**
 * Authenticate a user with email and password.
 */
export async function loginAction(
	_prevState: LoginResult | null,
	formData: FormData
): Promise<LoginResult> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	if (!email || !password) {
		return { error: "Email and password are required." };
	}

	try {
		const db = await getDb();

		// Brute-force protection: per-account and per-IP, shared across Worker isolates via D1.
		const ip = clientIp(await headers());
		const [byEmail, byIp] = await Promise.all([
			rateLimit(db, `login:email:${email.toLowerCase().trim().slice(0, 254)}`, 8, 900),
			rateLimit(db, `login:ip:${ip}`, 30, 900),
		]);
		if (!byEmail.allowed || !byIp.allowed) {
			return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
		}

		const user = await db
			.prepare("SELECT * FROM users WHERE email = ?")
			.bind(email.toLowerCase().trim())
			.first<User>();

		if (!user) {
			return { error: "Invalid email or password." };
		}

		if (user.status !== "active") {
			return { error: "Your account has been deactivated. Contact an administrator." };
		}

		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return { error: "Invalid email or password." };
		}

		await createSession(user.id);
	} catch (e) {
		console.error("Login error:", e);
		return { error: "An error occurred. Please try again." };
	}

	redirect("/admin/dashboard");
}

/**
 * Log out the current user.
 */
export async function logoutAction(): Promise<void> {
	await destroySession();
	redirect("/login");
}
