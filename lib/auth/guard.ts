// ============================================================
// Server-side authorization for server actions & route handlers
// ============================================================
// Server Actions are public HTTP endpoints, so every exported admin action must
// call one of these first. Hiding buttons in the UI is NOT authorization.
import { getCurrentUser } from "@/lib/auth/session";
import type { SafeUser } from "@/lib/schema";

export class UnauthorizedError extends Error {
	constructor(message = "Not authorized") {
		super(message);
		this.name = "UnauthorizedError";
	}
}

/** Any active, signed-in staff user. */
export async function requireAdmin(): Promise<SafeUser> {
	const user = await getCurrentUser();
	if (!user) throw new UnauthorizedError("Please sign in.");
	return user;
}

/** Owner-level operations: settings, exports, test emails. */
export async function requireOwner(): Promise<SafeUser> {
	const user = await requireAdmin();
	if (user.role !== "super_admin" && user.role !== "admin") throw new UnauthorizedError("You don't have permission to do that.");
	return user;
}

/** For server-rendered admin pages: data must not be fetched for signed-out visitors. */
export async function requirePageUser(): Promise<SafeUser> {
	const { redirect } = await import("next/navigation");
	const user = await getCurrentUser();
	if (!user) redirect("/login");
	return user as SafeUser;
}

export async function requirePageOwner(): Promise<SafeUser> {
	const { redirect } = await import("next/navigation");
	const user = await requirePageUser();
	if (user.role !== "super_admin" && user.role !== "admin") redirect("/admin/dashboard");
	return user;
}
