"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	createQuote,
	updateQuote,
	type CreateQuoteInput,
	type CreateQuoteItemInput,
} from "@/lib/actions/quotes";
import { searchCustomers } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";
import type { Customer, QuoteWithDetails, TripType, VehicleCategory } from "@/lib/schema";

interface QuoteFormProps {
	initialData?: QuoteWithDetails;
	preselectedCustomer?: Customer | null;
}

export function QuoteForm({
	initialData,
	preselectedCustomer,
}: QuoteFormProps) {
	const router = useRouter();
	const isEdit = Boolean(initialData);

	// Customer state
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
		preselectedCustomer ||
			(initialData
				? {
						id: initialData.customer_id,
						name: initialData.customer_name,
						email: initialData.customer_email,
						phone: initialData.customer_phone,
						customer_type: "individual",
						company_name: initialData.customer_company || null,
						notes: null,
						created_at: "",
						updated_at: "",
				  }
				: null)
	);

	const [customerSearch, setCustomerSearch] = useState("");
	const [customerResults, setCustomerResults] = useState<Customer[]>([]);
	const [searching, setSearching] = useState(false);
	const [showInlineCreate, setShowInlineCreate] = useState(false);

	// Line items state
	const defaultItems: CreateQuoteItemInput[] = initialData?.items && initialData.items.length > 0
		? initialData.items.map((i) => ({
				description: i.description,
				quantity: i.quantity,
				unit_price: i.unit_price,
		  }))
		: [
				{
					description: "Executive Chauffeur Transfer",
					quantity: 1,
					unit_price: 120,
				},
		  ];

	const [items, setItems] = useState<CreateQuoteItemInput[]>(defaultItems);
	const [discountAmount, setDiscountAmount] = useState<number>(initialData?.discount_amount || 0);
	const [taxAmount, setTaxAmount] = useState<number>(initialData?.tax_amount || 0);

	// Calculate totals
	const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
	const calculatedTotal = Math.max(0, Number((subtotal - (discountAmount || 0) + (taxAmount || 0)).toFixed(2)));

	// Form fields
	const [formData, setFormData] = useState({
		pickup_location: initialData?.pickup_location || "",
		dropoff_location: initialData?.dropoff_location || "",
		pickup_date: initialData?.pickup_date || new Date().toISOString().split("T")[0],
		pickup_time: initialData?.pickup_time || "10:00",
		return_date: initialData?.return_date || "",
		return_time: initialData?.return_time || "",
		trip_type: (initialData?.trip_type as TripType) || "airport_transfer",
		vehicle_category: initialData?.vehicle_category || "sedan",
		passenger_count: initialData?.passenger_count || 1,
		luggage_info: initialData?.luggage_info || "",
		flight_number: initialData?.flight_number || "",
		airline: initialData?.airline || "",
		additional_stops: initialData?.additional_stops || "",
		special_requests: initialData?.special_requests || "",
		notes: initialData?.notes || "",
		internal_notes: initialData?.internal_notes || "",
		valid_until:
			initialData?.valid_until ||
			new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Customer search
	async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
		const val = e.target.value;
		setCustomerSearch(val);
		if (val.trim().length >= 2) {
			setSearching(true);
			try {
				const res = await searchCustomers(val.trim());
				setCustomerResults(res);
			} catch {
				setCustomerResults([]);
			} finally {
				setSearching(false);
			}
		} else {
			setCustomerResults([]);
		}
	}

	function handleSelectCustomer(c: Customer) {
		setSelectedCustomer(c);
		setCustomerSearch("");
		setCustomerResults([]);
	}

	function handleCustomerCreated(newCustomer: Customer) {
		setSelectedCustomer(newCustomer);
		setShowInlineCreate(false);
	}

	// Line items handlers
	function handleAddItem() {
		setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
	}

	function handleRemoveItem(index: number) {
		if (items.length <= 1) return;
		setItems(items.filter((_, i) => i !== index));
	}

	function handleItemChange(index: number, field: keyof CreateQuoteItemInput, value: string | number) {
		const updated = [...items];
		updated[index] = {
			...updated[index],
			[field]: field === "description" ? value : Number(value) || 0,
		};
		setItems(updated);
	}

	// Submit handler
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedCustomer) {
			setError("Please select or create a customer for this quote.");
			window.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		if (items.some((item) => !item.description.trim())) {
			setError("All line items must have a description.");
			return;
		}

		setLoading(true);
		setError(null);

		const payload: CreateQuoteInput = {
			customer_id: selectedCustomer.id,
			status: initialData?.status || "draft",
			pickup_location: formData.pickup_location,
			dropoff_location: formData.dropoff_location,
			pickup_date: formData.pickup_date,
			pickup_time: formData.pickup_time,
			return_date: formData.return_date || undefined,
			return_time: formData.return_time || undefined,
			trip_type: formData.trip_type,
			vehicle_category: formData.vehicle_category,
			passenger_count: Number(formData.passenger_count),
			luggage_info: formData.luggage_info,
			flight_number: formData.flight_number,
			airline: formData.airline,
			additional_stops: formData.additional_stops,
			special_requests: formData.special_requests,
			subtotal: Number(subtotal.toFixed(2)),
			discount_amount: Number(discountAmount || 0),
			tax_amount: Number(taxAmount || 0),
			total: calculatedTotal,
			notes: formData.notes,
			internal_notes: formData.internal_notes,
			valid_until: formData.valid_until,
			items,
		};

		try {
			if (isEdit && initialData) {
				const res = await updateQuote(initialData.id, payload);
				if (!res.success) {
					setError(res.error || "Failed to update quote.");
					setLoading(false);
				} else {
					router.push(`/admin/quotes/${initialData.id}`);
				}
			} else {
				const res = await createQuote(payload);
				if (!res.success || !res.quote) {
					setError(res.error || "Failed to create quote.");
					setLoading(false);
				} else {
					router.push(`/admin/quotes/${res.quote.id}`);
				}
			}
		} catch (err) {
			setError((err as Error).message || "An unexpected error occurred.");
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="admin-form">
			{error && (
				<div className="alert alert-danger" style={{ marginBottom: "1.5rem", padding: "0.875rem 1rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>
					{error}
				</div>
			)}

			{/* 1. Customer Section */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header">
					<h3 className="card-title">1. Client / Passenger Selection</h3>
					<p className="card-subtitle">Select an existing customer or create a new client profile inline.</p>
				</div>
				<div className="card-body">
					{selectedCustomer ? (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "1rem",
								borderRadius: "8px",
								background: "rgba(255, 255, 255, 0.03)",
								border: "1px solid var(--border-color)",
							}}
						>
							<div>
								<div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>
									{selectedCustomer.name}
									{selectedCustomer.company_name && (
										<span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
											({selectedCustomer.company_name})
										</span>
									)}
								</div>
								<div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "flex", gap: "1rem" }}>
									{selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
									{selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
								</div>
							</div>
							<button
								type="button"
								className="btn btn-secondary btn-sm"
								onClick={() => setSelectedCustomer(null)}
								disabled={loading}
							>
								Change Client
							</button>
						</div>
					) : showInlineCreate ? (
						<div>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
								<h4 style={{ margin: 0, fontSize: "0.9375rem" }}>Create New Customer</h4>
								<button
									type="button"
									className="btn btn-secondary btn-sm"
									onClick={() => setShowInlineCreate(false)}
								>
									Back to Search
								</button>
							</div>
							<CustomerForm onSuccess={handleCustomerCreated} />
						</div>
					) : (
						<div>
							<div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
								<div style={{ flex: 1, position: "relative" }}>
									<input
										type="text"
										className="form-input"
										placeholder="Search client by name, email, or phone..."
										value={customerSearch}
										onChange={handleSearch}
									/>
									{searching && (
										<span style={{ position: "absolute", right: "12px", top: "10px", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
											Searching...
										</span>
									)}
								</div>
								<button
									type="button"
									className="btn btn-secondary"
									onClick={() => setShowInlineCreate(true)}
								>
									+ New Client
								</button>
							</div>

							{customerResults.length > 0 && (
								<div
									style={{
										maxHeight: "220px",
										overflowY: "auto",
										border: "1px solid var(--border-color)",
										borderRadius: "6px",
										background: "var(--bg-surface)",
									}}
								>
									{customerResults.map((c) => (
										<div
											key={c.id}
											onClick={() => handleSelectCustomer(c)}
											style={{
												padding: "0.75rem 1rem",
												cursor: "pointer",
												borderBottom: "1px solid var(--border-color)",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
											className="table-row-hover"
										>
											<div>
												<div style={{ fontWeight: 500 }}>{c.name}</div>
												<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
													{c.email || "No email"} · {c.phone || "No phone"}
												</div>
											</div>
											<span className="badge badge-info" style={{ fontSize: "0.6875rem" }}>
												{c.customer_type}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* 2. Route & Transfer Itinerary */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header">
					<h3 className="card-title">2. Route & Transfer Itinerary</h3>
					<p className="card-subtitle">Specify pickup/dropoff points, flight tracker, and trip dates.</p>
				</div>
				<div className="card-body">
					<div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
						<div className="form-group">
							<label className="form-label">Service Type</label>
							<select
								className="form-select"
								value={formData.trip_type}
								onChange={(e) => setFormData({ ...formData, trip_type: e.target.value as TripType })}
							>
								<option value="airport_transfer">Airport Transfer</option>
								<option value="one_way">Point-to-Point (One Way)</option>
								<option value="round_trip">Round Trip</option>
								<option value="hourly">Hourly / As Directed</option>
								<option value="intercity">Intercity / Island Transfer</option>
							</select>
						</div>

						<div className="form-group">
							<label className="form-label">Vehicle Category</label>
							<select
								className="form-select"
								value={formData.vehicle_category}
								onChange={(e) => setFormData({ ...formData, vehicle_category: e.target.value as VehicleCategory })}
							>
								<option value="sedan">Executive Sedan (Mercedes E-Class or similar)</option>
								<option value="luxury">Luxury First Class (Mercedes S-Class)</option>
								<option value="suv">Luxury SUV (Range Rover, BMW X7)</option>
								<option value="van">Executive Van (Mercedes V-Class, 7 Pax)</option>
								<option value="minibus">Luxury Minibus (Mercedes Sprinter, 16 Pax)</option>
							</select>
						</div>

						<div className="form-group">
							<label className="form-label">Passengers</label>
							<input
								type="number"
								min="1"
								max="50"
								className="form-input"
								value={formData.passenger_count}
								onChange={(e) => setFormData({ ...formData, passenger_count: parseInt(e.target.value) || 1 })}
							/>
						</div>

						<div className="form-group">
							<label className="form-label">Luggage Count / Specs</label>
							<input
								type="text"
								className="form-input"
								placeholder="e.g. 3 Large Bags + 2 Carry-ons"
								value={formData.luggage_info}
								onChange={(e) => setFormData({ ...formData, luggage_info: e.target.value })}
							/>
						</div>
					</div>

					{/* Pickup & Dropoff Addresses */}
					<div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
						<div className="form-group">
							<label className="form-label">Pickup Address / Location *</label>
							<input
								type="text"
								required
								className="form-input"
								placeholder="e.g. Athens International Airport (ATH) or Hotel Grande Bretagne"
								value={formData.pickup_location}
								onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
							/>
						</div>

						<div className="form-group">
							<label className="form-label">Dropoff Address / Location *</label>
							<input
								type="text"
								required
								className="form-input"
								placeholder="e.g. Four Seasons Astir Palace, Vouliagmeni"
								value={formData.dropoff_location}
								onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
							/>
						</div>
					</div>

					{/* Date & Time */}
					<div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
						<div className="form-group">
							<label className="form-label">Pickup Date *</label>
							<input
								type="date"
								required
								className="form-input"
								value={formData.pickup_date}
								onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
							/>
						</div>

						<div className="form-group">
							<label className="form-label">Pickup Time *</label>
							<input
								type="time"
								required
								className="form-input"
								value={formData.pickup_time}
								onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
							/>
						</div>

						{formData.trip_type === "round_trip" && (
							<>
								<div className="form-group">
									<label className="form-label">Return Date</label>
									<input
										type="date"
										className="form-input"
										value={formData.return_date}
										onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Return Time</label>
									<input
										type="time"
										className="form-input"
										value={formData.return_time}
										onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
									/>
								</div>
							</>
						)}
					</div>

					{/* Flight Tracking Info */}
					<div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label className="form-label">Flight Number (Optional)</label>
							<input
								type="text"
								className="form-input"
								placeholder="e.g. EK105 or LH1750"
								value={formData.flight_number}
								onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
							/>
						</div>

						<div className="form-group">
							<label className="form-label">Airline (Optional)</label>
							<input
								type="text"
								className="form-input"
								placeholder="e.g. Emirates, Lufthansa"
								value={formData.airline}
								onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* 3. Itemized Pricing Calculator */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div>
						<h3 className="card-title" style={{ margin: 0 }}>3. Itemized Quote Pricing</h3>
						<p className="card-subtitle" style={{ margin: "0.25rem 0 0" }}>
							Break down transfer rates, waiting time, meet & greet, or extra services.
						</p>
					</div>
					<button
						type="button"
						className="btn btn-secondary btn-sm"
						onClick={handleAddItem}
					>
						+ Add Line Item
					</button>
				</div>
				<div className="card-body">
					<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
						{items.map((item, index) => {
							const itemTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);

							return (
								<div
									key={index}
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 90px 120px 110px 40px",
										gap: "0.75rem",
										alignItems: "center",
										padding: "0.5rem",
										borderRadius: "6px",
										background: "rgba(255, 255, 255, 0.02)",
										border: "1px solid var(--border-color)",
									}}
								>
									<div>
										<input
											type="text"
											required
											className="form-input"
											placeholder="Service description (e.g. Airport Transfer, Meet & Greet)"
											value={item.description}
											onChange={(e) => handleItemChange(index, "description", e.target.value)}
										/>
									</div>
									<div>
										<input
											type="number"
											min="1"
											className="form-input"
											placeholder="Qty"
											value={item.quantity}
											onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
										/>
									</div>
									<div>
										<div style={{ position: "relative" }}>
											<span style={{ position: "absolute", left: "10px", top: "9px", color: "var(--text-muted)", fontSize: "0.875rem" }}>€</span>
											<input
												type="number"
												step="0.01"
												min="0"
												className="form-input"
												style={{ paddingLeft: "1.75rem" }}
												placeholder="Price"
												value={item.unit_price}
												onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
											/>
										</div>
									</div>
									<div style={{ fontWeight: 600, textAlign: "right", color: "var(--text-primary)" }}>
										€{itemTotal.toFixed(2)}
									</div>
									<div>
										<button
											type="button"
											className="btn btn-secondary btn-sm"
											onClick={() => handleRemoveItem(index)}
											disabled={items.length <= 1}
											style={{ padding: "0.375rem 0.5rem", color: "#ef4444" }}
											title="Remove line"
										>
											✕
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Totals Summary Panel */}
					<div
						style={{
							maxWidth: "360px",
							marginLeft: "auto",
							padding: "1.25rem",
							borderRadius: "8px",
							background: "rgba(255, 255, 255, 0.03)",
							border: "1px solid var(--border-color)",
						}}
					>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9375rem" }}>
							<span style={{ color: "var(--text-muted)" }}>Subtotal:</span>
							<span style={{ fontWeight: 600 }}>€{subtotal.toFixed(2)}</span>
						</div>

						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
							<span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Discount (€):</span>
							<input
								type="number"
								step="0.01"
								min="0"
								style={{ width: "100px", textAlign: "right" }}
								className="form-input form-input-sm"
								value={discountAmount}
								onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
							/>
						</div>

						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
							<span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Tax / VAT (€):</span>
							<input
								type="number"
								step="0.01"
								min="0"
								style={{ width: "100px", textAlign: "right" }}
								className="form-input form-input-sm"
								value={taxAmount}
								onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
							/>
						</div>

						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								paddingTop: "0.75rem",
								borderTop: "1px solid var(--border-color)",
								fontSize: "1.125rem",
								fontWeight: 700,
								color: "var(--accent)",
							}}
						>
							<span>Total:</span>
							<span>€{calculatedTotal.toFixed(2)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* 4. Validity & Operational Notes */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header">
					<h3 className="card-title">4. Validity & Notes</h3>
					<p className="card-subtitle">Set quote expiration date and terms.</p>
				</div>
				<div className="card-body">
					<div className="form-group" style={{ maxWidth: "260px", marginBottom: "1rem" }}>
						<label className="form-label">Quote Valid Until</label>
						<input
							type="date"
							className="form-input"
							value={formData.valid_until}
							onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
						/>
					</div>

					<div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label className="form-label">Client Notes (Visible on quote PDF / Email)</label>
							<textarea
								rows={3}
								className="form-textarea"
								placeholder="e.g. Includes 60 mins flight delay wait time and complimentary bottled water."
								value={formData.notes}
								onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
							/>
						</div>

						<div className="form-group">
							<label className="form-label">Internal Dispatch Notes (Admin only)</label>
							<textarea
								rows={3}
								className="form-textarea"
								placeholder="e.g. Client requested English-speaking chauffeur with black Mercedes V-Class."
								value={formData.internal_notes}
								onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Actions Footer */}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => router.back()}
					disabled={loading}
				>
					Cancel
				</button>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={loading}
					style={{ minWidth: "160px" }}
				>
					{loading ? "Saving Quote..." : isEdit ? "Update Quote" : "Create Quote"}
				</button>
			</div>
		</form>
	);
}
