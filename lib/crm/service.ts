// ============================================================
// Server wiring: D1 + config + hooks (used by actions, routes and cron)
// ============================================================
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { ensureEnv, getMailConfig, type MailConfig } from "@/lib/env";
import { loadCrmSettings, type CrmSettings } from "@/lib/crm/settings";
import { processOutbox, type ProcessOptions, type ProcessResult } from "@/lib/email/outbox";
import { emailDeadHook, quoteSentHook, snapshotFor, pdfFileName } from "@/lib/crm/quotes";
import { buildQuotationPdf } from "@/lib/pdf/quotation";
import type { BrandInfo } from "@/lib/email/templates";

export interface CrmContext {
	db: D1Database;
	cfg: MailConfig;
	settings: CrmSettings;
	brand: BrandInfo;
}

export async function crmContext(): Promise<CrmContext> {
	await ensureEnv();
	const db = await getDb();
	const cfg = getMailConfig();
	const settings = await loadCrmSettings(db);
	return {
		db,
		cfg,
		settings,
		// Customer-facing contact address is the business inbox, not the sender identity.
		brand: { name: settings.companyName, email: settings.companyEmail || cfg.notifyTo, phone: settings.companyPhone || undefined, website: settings.companyWebsite || undefined },
	};
}

/** Send whatever is due now (optionally one row), with PDF + status hooks wired in. */
export async function drainOutbox(ctx: CrmContext, opts: Pick<ProcessOptions, "onlyId" | "limit" | "force"> = {}): Promise<ProcessResult> {
	return processOutbox(ctx.db, {
		...opts,
		config: ctx.cfg,
		hooks: {
			onSent: quoteSentHook(ctx.db, ctx.settings),
			onDead: emailDeadHook(ctx.db),
			buildQuoteAttachment: async (quoteId) => {
				const snap = await snapshotFor(ctx.db, quoteId, ctx.settings);
				if (!snap) throw new Error("Quotation not found for PDF");
				return { filename: pdfFileName(snap), contentType: "application/pdf", content: await buildQuotationPdf(snap) };
			},
		},
	});
}

/** Run work after the response is returned (Cloudflare waitUntil); falls back to fire-and-forget. */
export function inBackground(work: Promise<unknown>): void {
	const safe = work.catch((e) => console.error("background task failed", e));
	try {
		getCloudflareContext().ctx.waitUntil(safe);
	} catch {
		void safe;
	}
}
