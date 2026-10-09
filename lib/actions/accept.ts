// PUBLIC action: customer accepts a quotation through the emailed link.
// The 256-bit token is the credential; only its SHA-256 hash is stored.
// Acceptance records intent only — it does not confirm a booking or take payment.
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { crmContext, inBackground, drainOutbox } from "@/lib/crm/service";
import { acceptQuote, findQuoteByToken, type AcceptOutcome } from "@/lib/crm/quotes";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function acceptQuotationByToken(token: string): Promise<{ outcome: AcceptOutcome | "rate_limited" }> {
	try {
		const ctx = await crmContext();
		const rl = await rateLimit(ctx.db, `accept:${clientIp(await headers())}`, 20, 600).catch(() => ({ allowed: true }));
		if (!rl.allowed) return { outcome: "rate_limited" };
		const q = await findQuoteByToken(ctx.db, String(token ?? ""));
		if (!q) return { outcome: "invalid" };
		const outcome = await acceptQuote(ctx.db, q, "customer_link", { cfg: ctx.cfg, brand: ctx.brand });
		if (outcome === "accepted") {
			inBackground(drainOutbox(ctx, { limit: 5 }));
			revalidatePath("/admin/inquiries");
			if (q.inquiry_id) revalidatePath(`/admin/inquiries/${q.inquiry_id}`);
		}
		return { outcome };
	} catch (e) {
		console.error("acceptQuotationByToken failed", e);
		return { outcome: "invalid" };
	}
}
