// ============================================================
// Company Settings Server Actions
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/actions/activity";
import { revalidatePath } from "next/cache";

export interface CompanySettingsData {
	company_name: string;
	company_email: string;
	company_phone: string;
	company_address: string;
	company_website: string;
	company_vat: string;
	company_license: string;
	default_currency: string;
	tax_rate: number;
	quote_validity_days: number;
	booking_terms: string;
	invoice_terms: string;
	resend_api_key: string;
	sender_email: string;
	sender_name: string;
}

const DEFAULT_SETTINGS: CompanySettingsData = {
	company_name: "Greece Chauffeur Service",
	company_email: "info@greecechauffeur.com",
	company_phone: "+30 210 000 0000",
	company_address: "Leoforos Vasilissis Sofias 10, Athens 106 74, Greece",
	company_website: "https://greecechauffeur.com",
	company_vat: "EL999999999",
	company_license: "GNTO-MHTE: 0206E0000000",
	default_currency: "EUR",
	tax_rate: 24,
	quote_validity_days: 7,
	booking_terms: "All chauffeured services include meet & greet, flight tracking, and bottled water. Cancellations made more than 24 hours prior to scheduled pickup are eligible for full refund.",
	invoice_terms: "Payment terms: Due upon receipt. All bank transfer fees are the responsibility of the client.",
	resend_api_key: "",
	sender_email: "transfers@greecechauffeur.com",
	sender_name: "Greece Chauffeur Service",
};

/**
 * Helper to safely extract a setting value from D1
 */
function parseSettingValue(raw: string | undefined, fallback: unknown): unknown {
	if (raw === undefined || raw === null) return fallback;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
}

/**
 * Fetch all company settings with defaults fallback.
 */
export async function getCompanySettings(): Promise<CompanySettingsData> {
	try {
		const db = await getDb();
		const rows = await db
			.prepare("SELECT key, value FROM company_settings")
			.all<{ key: string; value: string }>();

		const settingsMap: Record<string, string> = {};
		for (const row of rows.results || []) {
			settingsMap[row.key] = row.value;
		}

		return {
			company_name: String(parseSettingValue(settingsMap.company_name, DEFAULT_SETTINGS.company_name)),
			company_email: String(parseSettingValue(settingsMap.company_email, DEFAULT_SETTINGS.company_email)),
			company_phone: String(parseSettingValue(settingsMap.company_phone, DEFAULT_SETTINGS.company_phone)),
			company_address: String(parseSettingValue(settingsMap.company_address, DEFAULT_SETTINGS.company_address)),
			company_website: String(parseSettingValue(settingsMap.company_website, DEFAULT_SETTINGS.company_website)),
			company_vat: String(parseSettingValue(settingsMap.company_vat, DEFAULT_SETTINGS.company_vat)),
			company_license: String(parseSettingValue(settingsMap.company_license, DEFAULT_SETTINGS.company_license)),
			default_currency: String(parseSettingValue(settingsMap.default_currency, DEFAULT_SETTINGS.default_currency)),
			tax_rate: Number(parseSettingValue(settingsMap.tax_rate, DEFAULT_SETTINGS.tax_rate)) || 0,
			quote_validity_days: Number(parseSettingValue(settingsMap.quote_validity_days, DEFAULT_SETTINGS.quote_validity_days)) || 7,
			booking_terms: String(parseSettingValue(settingsMap.booking_terms, DEFAULT_SETTINGS.booking_terms)),
			invoice_terms: String(parseSettingValue(settingsMap.invoice_terms, DEFAULT_SETTINGS.invoice_terms)),
			resend_api_key: String(parseSettingValue(settingsMap.resend_api_key, DEFAULT_SETTINGS.resend_api_key)),
			sender_email: String(parseSettingValue(settingsMap.sender_email, DEFAULT_SETTINGS.sender_email)),
			sender_name: String(parseSettingValue(settingsMap.sender_name, DEFAULT_SETTINGS.sender_name)),
		};
	} catch (e) {
		console.error("Error reading company settings:", e);
		return DEFAULT_SETTINGS;
	}
}

/**
 * Save or update company settings.
 */
export async function updateCompanySettings(
	data: Partial<CompanySettingsData>
): Promise<{ success: boolean; error?: string }> {
	try {
		const db = await getDb();
		const currentUser = await getCurrentUser();
		const now = new Date().toISOString();

		const entries = Object.entries(data);

		for (const [key, val] of entries) {
			const jsonValue = JSON.stringify(val);
			await db
				.prepare(
					`INSERT INTO company_settings (key, value, updated_at, updated_by)
					 VALUES (?, ?, ?, ?)
					 ON CONFLICT(key) DO UPDATE SET
					 	value = excluded.value,
					 	updated_at = excluded.updated_at,
					 	updated_by = excluded.updated_by`
				)
				.bind(key, jsonValue, now, currentUser?.id || null)
				.run();
		}

		await recordActivity(
			"settings.updated",
			"company_settings",
			null,
			{ message: `Updated company settings: ${entries.map(([k]) => k).join(", ")}` }
		);

		revalidatePath("/admin/settings");
		revalidatePath("/admin/quotes");
		revalidatePath("/admin/bookings");

		return { success: true };
	} catch (e) {
		console.error("Error updating company settings:", e);
		return { success: false, error: (e as Error).message || "Failed to update settings" };
	}
}
