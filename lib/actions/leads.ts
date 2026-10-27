// ============================================================
// Public booking inquiries (website → operations)
// ============================================================
// PUBLIC server action: no auth by design, so it validates strictly,
// rate-limits, and only ever INSERTS. The success message is returned only
// after the inquiry is durably saved; email delivery happens afterwards from
// the outbox and can never lose the inquiry.
"use server";

import { headers } from "next/headers";
import { validateInquiry } from "@/lib/crm/inquiry-input";
import { createInquiry } from "@/lib/crm/inquiries";
import { crmContext, drainOutbox, inBackground } from "@/lib/crm/service";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export interface InquiryResult {
	ok: boolean;
	reference?: string;
	error?: string;
	fieldErrors?: Record<string, string>;
}

export async function submitInquiry(formData: FormData): Promise<InquiryResult> {
	const raw: Record<string, unknown> = {};
	formData.forEach((v, k) => {
		if (typeof v === "string") raw[k] = v;
	});

	// Honeypot: real visitors never fill this. Pretend success, store nothing.
	if (String(raw.company_website ?? "").trim()) return { ok: true, reference: "GCS-RECEIVED" };

	const parsed = validateInquiry(raw);
	if (!parsed.ok) return { ok: false, error: parsed.message, fieldErrors: parsed.errors };

	try {
		const ctx = await crmContext();

		const ip = clientIp(await headers());
		const [byIp, byEmail] = await Promise.all([
			rateLimit(ctx.db, `inquiry:ip:${ip}`, 8, 600).catch(() => ({ allowed: true, remaining: 1 })),
			rateLimit(ctx.db, `inquiry:email:${parsed.data.email}`, 5, 3600).catch(() => ({ allowed: true, remaining: 1 })),
		]);
		if (!byIp.allowed || !byEmail.allowed) {
			return { ok: false, error: "We've received several requests from you recently. Please wait a few minutes, or contact us by email." };
		}

		const res = await createInquiry(ctx.db, parsed.data, { cfg: ctx.cfg, brand: ctx.brand, settings: ctx.settings });
		if (!res.duplicate) inBackground(drainOutbox(ctx, { limit: 10 }));
		return { ok: true, reference: res.reference };
	} catch (e) {
		console.error("submitInquiry failed:", e);
		return { ok: false, error: "We couldn't save your request just now. Please try again, or email us directly." };
	}
}
