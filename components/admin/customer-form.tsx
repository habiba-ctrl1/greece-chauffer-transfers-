"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer, type CustomerFormData } from "@/lib/actions/customers";
import type { Customer, CustomerType } from "@/lib/schema";

interface CustomerFormProps {
	initialData?: Customer;
	onSuccess?: (customer: Customer) => void;
	inline?: boolean;
}

export function CustomerForm({ initialData, onSuccess, inline = false }: CustomerFormProps) {
	const router = useRouter();
	const isEdit = Boolean(initialData);

	const [formData, setFormData] = useState<CustomerFormData>({
		name: initialData?.name || "",
		email: initialData?.email || "",
		phone: initialData?.phone || "",
		customer_type: (initialData?.customer_type as CustomerType) || "individual",
		company_name: initialData?.company_name || "",
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
				const res = await updateCustomer(initialData.id, formData);
				if (!res.success) {
					setError(res.error || "Failed to update customer.");
					setLoading(false);
					return;
				}
				router.push(`/admin/customers/${initialData.id}`);
				router.refresh();
			} else {
				const res = await createCustomer(formData);
				if (!res.success || !res.customer) {
					setError(res.error || "Failed to create customer.");
					setLoading(false);
					return;
				}
				if (onSuccess) {
					onSuccess(res.customer);
				} else {
					router.push(`/admin/customers/${res.customer.id}`);
					router.refresh();
				}
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

			<div style={{ display: "grid", gridTemplateColumns: inline ? "1fr" : "1fr 1fr", gap: "1rem" }}>
				<div className="form-group">
					<label htmlFor="customer-name" className="form-label">
						Full Name <span style={{ color: "var(--status-danger)" }}>*</span>
					</label>
					<input
						id="customer-name"
						type="text"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						placeholder="e.g. Alexander Vance"
						className="form-input"
						disabled={loading}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="customer-type" className="form-label">
						Account Type
					</label>
					<select
						id="customer-type"
						value={formData.customer_type}
						onChange={(e) =>
							setFormData({ ...formData, customer_type: e.target.value as CustomerType })
						}
						className="form-select"
						disabled={loading}
					>
						<option value="individual">Individual VIP</option>
						<option value="corporate">Corporate Account</option>
						<option value="agency">Travel / Tourism Agency</option>
						<option value="other">Other</option>
					</select>
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: inline ? "1fr" : "1fr 1fr", gap: "1rem" }}>
				<div className="form-group">
					<label htmlFor="customer-email" className="form-label">
						Email Address
					</label>
					<input
						id="customer-email"
						type="email"
						value={formData.email || ""}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						placeholder="alexander@example.com"
						className="form-input"
						disabled={loading}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="customer-phone" className="form-label">
						Phone Number (with Country Code)
					</label>
					<input
						id="customer-phone"
						type="tel"
						value={formData.phone || ""}
						onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
						placeholder="+30 691 234 5678"
						className="form-input"
						disabled={loading}
					/>
				</div>
			</div>

			<div className="form-group">
				<label htmlFor="company-name" className="form-label">
					Company / Organization (Optional)
				</label>
				<input
					id="company-name"
					type="text"
					value={formData.company_name || ""}
					onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
					placeholder="e.g. Apex Global Hospitality"
					className="form-input"
					disabled={loading}
				/>
			</div>

			<div className="form-group">
				<label htmlFor="customer-notes" className="form-label">
					Notes & VIP Preferences
				</label>
				<textarea
					id="customer-notes"
					value={formData.notes || ""}
					onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
					placeholder="Special vehicle preferences, beverage requests, language preference..."
					className="form-input"
					rows={3}
					disabled={loading}
				/>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
				{!inline && (
					<button
						type="button"
						onClick={() => router.back()}
						className="btn btn-secondary"
						disabled={loading}
					>
						Cancel
					</button>
				)}
				<button type="submit" className="btn btn-primary" disabled={loading}>
					{loading ? "Saving..." : isEdit ? "Save Changes" : "Save Customer"}
				</button>
			</div>
		</form>
	);
}
