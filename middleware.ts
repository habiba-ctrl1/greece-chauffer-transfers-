// ============================================================
// Next.js Middleware — Route Protection
// ============================================================
// Cloudflare Workers + @opennextjs/cloudflare has limited middleware
// support. We use a lightweight check here and do the full DB session
// validation in the admin layout's server component.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Protect all /admin routes — check for session cookie
	if (pathname.startsWith("/admin")) {
		const sessionCookie = request.cookies.get("gcs_session");

		if (!sessionCookie?.value) {
			const loginUrl = new URL("/login", request.url);
			loginUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(loginUrl);
		}
	}

	// Redirect /admin to /admin/dashboard
	if (pathname === "/admin") {
		return NextResponse.redirect(
			new URL("/admin/dashboard", request.url)
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
