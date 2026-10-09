import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { inquiriesCsv, type InquiryFilters } from "@/lib/crm/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const user = await getCurrentUser();
	if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
	}
	const sp = new URL(request.url).searchParams;
	const f: InquiryFilters = {
		q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, service: sp.get("service") ?? undefined,
		followup: (sp.get("followup") as InquiryFilters["followup"]) ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined,
	};
	const csv = await inquiriesCsv(await getDb(), f);
	return new Response(`﻿${csv}`, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
			"Cache-Control": "private, no-store",
		},
	});
}
