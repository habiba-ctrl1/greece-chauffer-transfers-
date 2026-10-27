"use client";

import { useState } from "react";
import { updateCompanySettings, type CompanySettingsData } from "@/lib/actions/settings";

interface SettingsFormProps {
	initialSettings: CompanySettingsData;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
	const [formData, setFormData] = useState<CompanySettingsData>(initialSettings);
	const [activeTab, setActiveTab] = useState<"general" | "operations" | "terms" | "email">("general");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "number" ? parseFloat(value) || 0 : value,
		}));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setMessage(null);

		try {
			const { resend_api_key: _k, sender_email: _e, sender_name: _n, ...safe } = formData;
			void _k; void _e; void _n;
			const res = await updateCompanySettings(safe);
			if (res.success) {
				setMessage({ type: "success", text: "Company settings updated successfully." });
			} else {
				setMessage({ type: "error", text: res.error || "Failed to update settings." });
			}
		} catch {
			setMessage({ type: "error", text: "Unexpected error saving settings." });
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			{/* Notifications */}
			{message && (
				<div
					style={{
						padding: "0.875rem 1.25rem",
						borderRadius: "var(--radius-sm)",
						marginBottom: "1.5rem",
						background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
						border: `1px solid ${message.type === "success" ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
						color: message.type === "success" ? "#16a34a" : "#ef4444",
						fontSize: "0.875rem",
						fontWeight: 500,
					}}
				>
					{message.text}
				</div>
			)}

			{/* Navigation Tabs */}
			<div
				style={{
					display: "flex",
					gap: "0.5rem",
					borderBottom: "1px solid var(--border-default)",
					marginBottom: "1.5rem",
				}}
			>
				{[
					{ id: "general", label: "Company Profile" },
					{ id: "operations", label: "Financial Defaults" },
					{ id: "terms", label: "Terms & Policies" },
					{ id: "email", label: "Email Dispatcher" },
				].map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id as typeof activeTab)}
						style={{
							padding: "0.75rem 1.25rem",
							background: "none",
							border: "none",
							borderBottom: activeTab === tab.id ? "2px solid var(--brand-600)" : "2px solid transparent",
							color: activeTab === tab.id ? "var(--brand-600)" : "var(--text-secondary)",
							fontWeight: activeTab === tab.id ? 600 : 500,
							fontSize: "0.875rem",
							cursor: "pointer",
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab 1: General Company Profile */}
			{activeTab === "general" && (
				<div className="card" style={{ marginBottom: "1.5rem" }}>
					<div className="card-header">
						<h3 className="card-title">Corporate Information</h3>
						<p className="card-subtitle">Official branding appearing on customer vouchers, quotations, and emails.</p>
					</div>
					<div className="card-body">
						<div className="form-grid">
							<div className="form-group">
								<label className="form-label">Company Legal / Brand Name</label>
								<input
									type="text"
									name="company_name"
									value={formData.company_name}
									onChange={handleChange}
									className="form-input"
									required
								/>
							</div>

							<div className="form-group">
								<label className="form-label">Official Operations Email</label>
								<input
									type="email"
									name="company_email"
									value={formData.company_email}
									onChange={handleChange}
									className="form-input"
									required
								/>
							</div>

							<div className="form-group">
								<label className="form-label">24/7 Dispatch Phone / Hotline</label>
								<input
									type="text"
									name="company_phone"
									value={formData.company_phone}
									onChange={handleChange}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">Official Website</label>
								<input
									type="url"
									name="company_website"
									value={formData.company_website}
									onChange={handleChange}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">Tax / VAT Number</label>
								<input
									type="text"
									name="company_vat"
									value={formData.company_vat}
									onChange={handleChange}
									className="form-input"
									placeholder="EL999999999"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">GNTO / MHTE License Number</label>
								<input
									type="text"
									name="company_license"
									value={formData.company_license}
									onChange={handleChange}
									className="form-input"
									placeholder="GNTO-MHTE: 0206E0000000"
								/>
							</div>

							<div className="form-group" style={{ gridColumn: "1 / -1" }}>
								<label className="form-label">Headquarters / Office Address</label>
								<input
									type="text"
									name="company_address"
									value={formData.company_address}
									onChange={handleChange}
									className="form-input"
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Tab 2: Financial & Operational Defaults */}
			{activeTab === "operations" && (
				<div className="card" style={{ marginBottom: "1.5rem" }}>
					<div className="card-header">
						<h3 className="card-title">Financial & Quotation Parameters</h3>
						<p className="card-subtitle">Set standard tax rates, currency, and quotation validity windows.</p>
					</div>
					<div className="card-body">
						<div className="form-grid">
							<div className="form-group">
								<label className="form-label">Operating Currency</label>
								<select
									name="default_currency"
									value={formData.default_currency}
									onChange={handleChange}
									className="form-select"
								>
									<option value="EUR">EUR (€) — Euro</option>
									<option value="USD">USD ($) — US Dollar</option>
									<option value="GBP">GBP (£) — British Pound</option>
								</select>
							</div>

							<div className="form-group">
								<label className="form-label">Default Greek VAT / Tax Rate (%)</label>
								<input
									type="number"
									name="tax_rate"
									min="0"
									max="100"
									step="0.5"
									value={formData.tax_rate}
									onChange={handleChange}
									className="form-input"
								/>
								<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem", display: "block" }}>
									Standard Greek passenger transportation VAT is currently 13% or 24%.
								</span>
							</div>

							<div className="form-group">
								<label className="form-label">Standard Quote Validity (Days)</label>
								<input
									type="number"
									name="quote_validity_days"
									min="1"
									max="90"
									value={formData.quote_validity_days}
									onChange={handleChange}
									className="form-input"
								/>
								<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem", display: "block" }}>
									Newly created quotations default to expiration in this many days.
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Tab 3: Terms & Policies */}
			{activeTab === "terms" && (
				<div className="card" style={{ marginBottom: "1.5rem" }}>
					<div className="card-header">
						<h3 className="card-title">Terms, Conditions & Cancellation Policies</h3>
						<p className="card-subtitle">Printed at the bottom of official quotations, reservation vouchers, and invoices.</p>
					</div>
					<div className="card-body">
						<div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
							<div className="form-group">
								<label className="form-label">Booking Terms & Cancellation Policy</label>
								<textarea
									name="booking_terms"
									rows={4}
									value={formData.booking_terms}
									onChange={handleChange}
									className="form-textarea"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">Invoice & Settlement Notes</label>
								<textarea
									name="invoice_terms"
									rows={4}
									value={formData.invoice_terms}
									onChange={handleChange}
									className="form-textarea"
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Tab 4: Email delivery (secrets live in the server environment, never here) */}
			{activeTab === "email" && (
				<div className="card" style={{ marginBottom: "1.5rem" }}>
					<div className="card-header">
						<h3 className="card-title">Email delivery</h3>
						<p className="card-subtitle">Credentials are stored as server secrets, not in this database or the browser.</p>
					</div>
					<div className="card-body" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
						<p>The email provider key, the verified sender address and the inquiry-notification inbox are configured as environment variables (<code>RESEND_API_KEY</code>, <code>EMAIL_FROM_ADDRESS</code>, <code>EMAIL_FROM_NAME</code>, <code>BOOKING_NOTIFICATION_EMAIL</code>). They can&apos;t be viewed or changed here.</p>
						<p style={{ marginTop: "0.75rem" }}>See live status, send a test email, and retry failures in <a href="/admin/emails" style={{ color: "var(--brand-600)", textDecoration: "underline" }}>Email Activity</a>.</p>
					</div>
				</div>
			)}

			{/* Submit Bar */}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={loading}
					style={{ minWidth: "160px" }}
				>
					{loading ? "Saving Settings..." : "Save Settings"}
				</button>
			</div>
		</form>
	);
}
