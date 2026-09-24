"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDriver, updateDriver, type DriverFormData } from "@/lib/actions/drivers";
import { DRIVER_STATUSES, DRIVER_STATUS_LABELS } from "@/lib/constants";
import type { Driver, DriverStatus } from "@/lib/schema";

interface DriverFormProps {
	initialData?: Driver;
}

export function DriverForm({ initialData }: DriverFormProps) {
	const router = useRouter();
	const isEdit = Boolean(initialData);

	const [formData, setFormData] = useState<DriverFormData>({
		name: initialData?.name || "",
		email: initialData?.email || "",
		phone: initialData?.phone || "",
		address: initialData?.address || "",
		license_number: initialData?.license_number || "",
		license_expiry: initialData?.license_expiry || "",
		status: (initialData?.status as DriverStatus) || "pending",
		driver_type: initialData?.driver_type || "company",
		emergency_contact_name: initialData?.emergency_contact_name || "",
		emergency_contact_phone: initialData?.emergency_contact_phone || "",
		notes: initialData?.notes || "",
	});

	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (isEdit && initialData) {
				const res = await updateDriver(initialData.id, formData);
				if (!res.success) {
					setError(res.error || "Failed to update driver.");
					setLoading(false);
					return;
				}
				router.push(`/admin/drivers/${initialData.id}`);
				router.refresh();
			} else {
				const res = await createDriver(formData);
				if (!res.success || !res.driver) {
					setError(res.error || "Failed to add driver.");
					setLoading(false);
					return;
				}
				router.push(`/admin/drivers/${res.driver.id}`);
				router.refresh();
			}
		} catch {
			setError("An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
			{error && (
				<div className="login-error" role="alert">
					{error}
				</div>
			)}

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
				<div className="form-group">
					<label htmlFor="driver-name" className="form-label">
						Full Name <span style={{ color: "var(--status-danger)" }}>*</span>
					</label>
					<input
						id="driver-name"
						type="text"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						placeholder="e.g. Nikos Papadopoulos"
						className="form-input"
						disabled={loading}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="driver-status" className="form-label">
						Status
					</label>
					<select
						id="driver-status"
						value={formData.status}
						onChange={(e) => setFormData({ ...formData, status: e.target.value as DriverStatus })}
						className="form-select"
						disabled={loading}
					>
						{DRIVER_STATUSES.map((s) => (
							<option key={s} value={s}>
								{DRIVER_STATUS_LABELS[s]}
							</option>
						))}
					</select>
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
				<div className="form-group">
					<label htmlFor="driver-phone" className="form-label">
						Phone Number <span style={{ color: "var(--status-danger)" }}>*</span>
					</label>
					<input
						id="driver-phone"
						type="tel"
						required
						value={formData.phone || ""}
						onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
						placeholder="+30 691 234 5678"
						className="form-input"
						disabled={loading}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="driver-email" className="form-label">
						Email Address
					</label>
					<input
						id="driver-email"
						type="email"
						value={formData.email || ""}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						placeholder="driver@example.com"
						className="form-input"
						disabled={loading}
					/>
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
				<div className="form-group">
					<label htmlFor="driver-license-number" className="form-label">
						License Number
					</label>
					<input
						id="driver-license-number"
						type="text"
						value={formData.license_number || ""}
						onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
						placeholder="e.g. GR-123456789"
						className="form-input"
						disabled={loading}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="driver-license-expiry" className="form-label">
						License Expiry Date
					</label>
					<input
						id="driver-license-expiry"
						type="date"
						value={formData.license_expiry || ""}
						onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
						className="form-input"
						disabled={loading}
					/>
				</div>
			</div>

			<div className="form-group">
				<label htmlFor="driver-type" className="form-label">
					Driver Type
				</label>
				<select
					id="driver-type"
					value={formData.driver_type}
					onChange={(e) =>
						setFormData({ ...formData, driver_type: e.target.value as "company" | "partner" })
					}
					className="form-select"
					disabled={loading}
					style={{ maxWidth: "260px" }}
				>
					<option value="company">Company Driver</option>
					<option value="partner">Partner / Freelance Driver</option>
				</select>
			</div>

			<div className="form-group">
				<label htmlFor="driver-address" className="form-label">
					Address
				</label>
				<input
					id="driver-address"
					type="text"
					value={formData.address || ""}
					onChange={(e) => setFormData({ ...formData, address: e.target.value })}
					placeholder="e.g. 14 Ermou Street, Athens"
					className="form-input"
					disabled={loading}
				/>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
				<div className="form-group">
					<label htmlFor="driver-emergency-name" className="form-label">
						Emergency Contact Name
					</label>
					<input
						id="driver-emergency-name"
						type="text"
						value={formData.emergency_contact_name || ""}
						onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
						className="form-input"
						disabled={loading}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="driver-emergency-phone" className="form-label">
						Emergency Contact Phone
					</label>
					<input
						id="driver-emergency-phone"
						type="tel"
						value={formData.emergency_contact_phone || ""}
						onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
						className="form-input"
						disabled={loading}
					/>
				</div>
			</div>

			<div className="form-group">
				<label htmlFor="driver-notes" className="form-label">
					Notes
				</label>
				<textarea
					id="driver-notes"
					value={formData.notes || ""}
					onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
					placeholder="Languages spoken, vehicle preferences, availability notes..."
					className="form-input"
					rows={3}
					disabled={loading}
				/>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
				<button
					type="button"
					onClick={() => router.back()}
					className="btn btn-secondary"
					disabled={loading}
				>
					Cancel
				</button>
				<button type="submit" className="btn btn-primary" disabled={loading}>
					{loading ? "Saving..." : isEdit ? "Save Changes" : "Add Driver"}
				</button>
			</div>
		</form>
	);
}
