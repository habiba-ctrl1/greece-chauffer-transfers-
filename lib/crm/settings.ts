// ============================================================
// CRM settings (stored in company_settings key/value rows)
// ============================================================
// Business commitments (reminder intervals, terms) are configuration, not
// hardcoded promises. Terms default to EMPTY: nothing is invented.

export interface CrmSettings {
	/** Hours after an inquiry arrives until the first "needs a quotation" reminder. */
	followupNewHours: number;
	/** Hours after a quotation is sent for the first suggested follow-up. */
	followupQuote1Hours: number;
	/** Hours after sending for the second suggested follow-up. */
	followupQuote2Hours: number;
	/** Repeat interval after that; 0 = stop reminding. */
	followupRepeatHours: number;
	quoteValidityDays: number;
	defaultCurrency: string;
	/** Explicit tax %, applied only if the owner sets it. 0 = no tax line. */
	taxPercent: number;
	paymentTerms: string;
	cancellationTerms: string;
	inclusions: string;
	exclusions: string;
	companyName: string;
	companyEmail: string;
	companyPhone: string;
	companyAddress: string;
	companyWebsite: string;
	companyVat: string;
}

export const CRM_DEFAULTS: CrmSettings = {
	followupNewHours: 4,
	followupQuote1Hours: 24,
	followupQuote2Hours: 72,
	followupRepeatHours: 0,
	quoteValidityDays: 7,
	defaultCurrency: "EUR",
	taxPercent: 0,
	paymentTerms: "",
	cancellationTerms: "",
	inclusions: "",
	exclusions: "",
	companyName: "Greece Chauffeur Service",
	companyEmail: "greecechauffertransfers@gmail.com",
	companyPhone: "",
	companyAddress: "",
	companyWebsite: "https://greecechaufferservice.com",
	companyVat: "",
};

/** key in company_settings → CrmSettings field */
export const CRM_SETTING_KEYS: Record<keyof CrmSettings, string> = {
	followupNewHours: "followup_new_hours",
	followupQuote1Hours: "followup_quote_1_hours",
	followupQuote2Hours: "followup_quote_2_hours",
	followupRepeatHours: "followup_repeat_hours",
	quoteValidityDays: "quote_validity_days",
	defaultCurrency: "default_currency",
	taxPercent: "quote_tax_percent",
	paymentTerms: "quote_payment_terms",
	cancellationTerms: "quote_cancellation_terms",
	inclusions: "quote_inclusions",
	exclusions: "quote_exclusions",
	companyName: "company_name",
	companyEmail: "company_email",
	companyPhone: "company_phone",
	companyAddress: "company_address",
	companyWebsite: "company_website",
	companyVat: "company_vat",
};

const parse = (raw: string | undefined): unknown => {
	if (raw === undefined) return undefined;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
};

export async function loadCrmSettings(db: D1Database): Promise<CrmSettings> {
	const rows = await db.prepare("SELECT key, value FROM company_settings").all<{ key: string; value: string }>();
	const map = new Map((rows.results ?? []).map((r) => [r.key, r.value]));
	const out = { ...CRM_DEFAULTS } as Record<string, string | number>;
	for (const [field, key] of Object.entries(CRM_SETTING_KEYS)) {
		const v = parse(map.get(key));
		const def = (CRM_DEFAULTS as unknown as Record<string, string | number>)[field];
		if (v === undefined || v === null || v === "") continue;
		if (typeof def === "number") {
			const n = Number(v);
			if (Number.isFinite(n) && n >= 0) out[field] = n;
		} else out[field] = String(v);
	}
	// Placeholder data seeded by the original schema must never reach customers.
	if (/example|greecechauffeur\.com$/i.test(String(out.companyEmail))) out.companyEmail = CRM_DEFAULTS.companyEmail;
	if (/^\+30 210 000/.test(String(out.companyPhone))) out.companyPhone = "";
	if (/EL999999999/.test(String(out.companyVat))) out.companyVat = "";
	if (/Leoforos Vasilissis Sofias 10/.test(String(out.companyAddress))) out.companyAddress = "";
	return out as unknown as CrmSettings;
}

export async function saveCrmSettings(db: D1Database, patch: Partial<CrmSettings>): Promise<void> {
	const stmts = Object.entries(patch).map(([field, value]) =>
		db
			.prepare(
				`INSERT INTO company_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
				 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
			)
			.bind(CRM_SETTING_KEYS[field as keyof CrmSettings], JSON.stringify(value))
	);
	if (stmts.length) await db.batch(stmts);
}
