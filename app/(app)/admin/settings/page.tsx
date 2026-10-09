import { getCompanySettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { CrmSettingsForm } from "@/components/admin/crm/crm-settings-form";
import { requirePageOwner } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { loadCrmSettings } from "@/lib/crm/settings";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Company Settings — Greece Chauffeur Service",
};

export default async function SettingsPage() {
	await requirePageOwner();
	const [settings, crm] = await Promise.all([getCompanySettings(), getDb().then(loadCrmSettings)]);

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>System & Company Settings</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
						Company profile, financial defaults, follow-up reminders and quotation terms. Email credentials are server secrets and are not editable here.
					</p>
				</div>
			</div>

			<SettingsForm initialSettings={settings} />
			<CrmSettingsForm initial={crm} />
		</div>
	);
}
