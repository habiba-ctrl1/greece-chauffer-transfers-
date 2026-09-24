// ============================================================
// Auth — Login / Logout Server Actions
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
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
