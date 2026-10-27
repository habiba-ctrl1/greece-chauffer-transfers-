// Authenticated quotation PDF. Sent versions render from their frozen snapshot, so
// this is always exactly what the customer received. Never publicly reachable.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { crmContext } from "@/lib/crm/service";
import { snapshotFor, pdfFileName } from "@/lib/crm/quotes";
import { buildQuotationPdf } from "@/lib/pdf/quotation";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
	const { id } = await params;
	if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
	const ctx = await crmContext();
	const snap = await snapshotFor(ctx.db, id, ctx.settings);
	if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });
	const pdf = await buildQuotationPdf(snap);
	return new Response(pdf as unknown as BodyInit, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="${pdfFileName(snap).replace(/[^A-Za-z0-9._-]/g, "_")}"`,
			"Cache-Control": "private, no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
}
