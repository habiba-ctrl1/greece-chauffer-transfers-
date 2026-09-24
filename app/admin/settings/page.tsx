import { getCompanySettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Company Settings — Greece Chauffeur Service",
};

export default async function SettingsPage() {
	const settings = await getCompanySettings();

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>System & Company Settings</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
						Configure company profile, financial defaults, operational policies, and email delivery.
					</p>
				</div>
			</div>

			<SettingsForm initialSettings={settings} />
		</div>
	);
}
