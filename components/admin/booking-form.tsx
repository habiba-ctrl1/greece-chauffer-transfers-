"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	createBooking,
	updateBooking,
	type CreateBookingData,
} from "@/lib/actions/bookings";
import { searchCustomers } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";
import type { Customer, Driver, Vehicle, BookingWithDetails, TripType, VehicleCategory } from "@/lib/schema";

interface BookingFormProps {
	initialData?: BookingWithDetails;
	preselectedCustomer?: Customer | null;
	drivers?: Driver[];
	vehicles?: Vehicle[];
}

export function BookingForm({
	initialData,
	preselectedCustomer,
	drivers = [],
	vehicles = [],
}: BookingFormProps) {
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
						company_name: null,
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

	// Booking form state
	const [formData, setFormData] = useState<CreateBookingData>({
		customer_id: selectedCustomer?.id || "",
		pickup_location: initialData?.pickup_location || "",
		dropoff_location: initialData?.dropoff_location || "",
		pickup_date: initialData?.pickup_date || new Date().toISOString().split("T")[0],
		pickup_time: initialData?.pickup_time || "10:00",
		return_date: initialData?.return_date || "",
		return_time: initialData?.return_time || "",
		trip_type: (initialData?.trip_type as TripType) || "airport_transfer",
		vehicle_category: initialData?.vehicle_category || "sedan",
		vehicle_id: initialData?.vehicle_id || "",
		driver_id: initialData?.driver_id || "",
		passenger_count: initialData?.passenger_count || 1,
		luggage_info: initialData?.luggage_info || "",
		flight_number: initialData?.flight_number || "",
		airline: initialData?.airline || "",
		flight_type: initialData?.flight_type || "arrival",
		additional_stops: initialData?.additional_stops || "",
		waiting_requirements: initialData?.waiting_requirements || "",
		special_requests: initialData?.special_requests || "",
		price: initialData?.price || 0,
		discount_amount: initialData?.discount_amount || 0,
		tax_amount: initialData?.tax_amount || 0,
		total: initialData?.total || 0,
		customer_notes: initialData?.customer_notes || "",
		internal_notes: initialData?.internal_notes || "",
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Autocomplete search
	async function handleSearch(term: string) {
		setCustomerSearch(term);
		if (term.trim().length < 2) {
			setCustomerResults([]);
			return;
		}
		setSearching(true);
		try {
			const res = await searchCustomers(term);
			setCustomerResults(res);
		} finally {
			setSearching(false);
		}
	}

	function handleSelectCustomer(c: Customer) {
		setSelectedCustomer(c);
		setFormData((prev) => ({ ...prev, customer_id: c.id }));
		setCustomerSearch("");
		setCustomerResults([]);
		setShowInlineCreate(false);
	}

	function handlePriceChange(field: "price" | "discount_amount" | "tax_amount", val: number) {
		setFormData((prev) => {
			const updated = { ...prev, [field]: val };
			const price = field === "price" ? val : (updated.price || 0);
			const discount = field === "discount_amount" ? val : (updated.discount_amount || 0);
			const tax = field === "tax_amount" ? val : (updated.tax_amount || 0);
			updated.total = Math.max(0, price - discount + tax);
			return updated;
		});
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!formData.customer_id) {
			setError("Please select or create a customer first.");
			return;
		}

		setLoading(true);

		try {
			if (isEdit && initialData) {
				const res = await updateBooking(initialData.id, formData);
				if (!res.success) {
					setError(res.error || "Failed to update booking.");
					setLoading(false);
					return;
				}
				router.push(`/admin/bookings/${initialData.id}`);
				router.refresh();
			} else {
				const res = await createBooking(formData);
				if (!res.success || !res.bookingId) {
					setError(res.error || "Failed to create booking.");
					setLoading(false);
					return;
				}
				router.push(`/admin/bookings/${res.bookingId}`);
				router.refresh();
			}
		} catch {
			setError("An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
			{error && (
				<div className="login-error" role="alert">
					{error}
				</div>
			)}

			{/* 1. Customer Section */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">1. Customer & Passenger Details</h2>
				</div>
				<div className="card-body">
					{selectedCustomer ? (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "1rem",
								background: "var(--brand-50)",
								border: "1px solid var(--brand-200)",
								borderRadius: "var(--radius-sm)",
							}}
						>
							<div>
								<div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--brand-900)" }}>
									{selectedCustomer.name}
								</div>
								<div style={{ fontSize: "0.8125rem", color: "var(--brand-700)", marginTop: "0.25rem" }}>
									{selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
									{selectedCustomer.email && <span style={{ marginLeft: "1rem" }}>✉️ {selectedCustomer.email}</span>}
								</div>
							</div>
							{!isEdit && (
								<button
									type="button"
									onClick={() => {
										setSelectedCustomer(null);
										setFormData((prev) => ({ ...prev, customer_id: "" }));
									}}
									className="btn btn-sm btn-secondary"
								>
									Change Customer
								</button>
							)}
						</div>
					) : (
						<div>
							{!showInlineCreate ? (
								<div>
									<div className="form-group" style={{ position: "relative" }}>
										<label htmlFor="customer-search-input" className="form-label">
											Search Existing Customer <span style={{ color: "var(--status-danger)" }}>*</span>
										</label>
										<input
											id="customer-search-input"
											type="text"
											value={customerSearch}
											onChange={(e) => handleSearch(e.target.value)}
											placeholder="Search by name, phone (+30...), or email..."
											className="form-input"
											autoComplete="off"
										/>

										{searching && (
											<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
												Searching directory...
											</div>
										)}

										{customerResults.length > 0 && (
											<div
												style={{
													position: "absolute",
													top: "100%",
													left: 0,
													right: 0,
													background: "var(--bg-surface)",
													border: "1px solid var(--border-strong)",
													borderRadius: "var(--radius-sm)",
													boxShadow: "var(--shadow-md)",
													zIndex: 20,
													marginTop: "4px",
													maxHeight: "220px",
													overflowY: "auto",
												}}
											>
												{customerResults.map((c) => (
													<div
														key={c.id}
														onClick={() => handleSelectCustomer(c)}
														style={{
															padding: "0.75rem 1rem",
															borderBottom: "1px solid var(--border-default)",
															cursor: "pointer",
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
														}}
														onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
														onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
													>
														<div>
															<div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</div>
															<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
																{c.phone || "No phone"} • {c.email || "No email"}
															</div>
														</div>
														<span className="badge badge-neutral">{c.customer_type}</span>
													</div>
												))}
											</div>
										)}
									</div>

									<div style={{ marginTop: "1rem", textAlign: "center" }}>
										<span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
											Customer not found?{" "}
										</span>
										<button
											type="button"
											onClick={() => setShowInlineCreate(true)}
											className="btn btn-sm btn-secondary"
											style={{ marginLeft: "0.5rem" }}
										>
											+ Create New Customer Inline
										</button>
									</div>
								</div>
							) : (
								<div
									style={{
										padding: "1rem",
										border: "1px dashed var(--brand-300)",
										borderRadius: "var(--radius-md)",
										background: "var(--bg-page)",
									}}
								>
									<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
										<h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Create New Customer</h3>
										<button
											type="button"
											onClick={() => setShowInlineCreate(false)}
											className="btn btn-sm btn-ghost"
										>
											Cancel & Search
										</button>
									</div>
									<CustomerForm
										inline
										onSuccess={(created) => handleSelectCustomer(created)}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* 2. Route & Schedule */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">2. Trip Itinerary & Schedule</h2>
				</div>
				<div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label htmlFor="trip-type-select" className="form-label">
								Transfer Service Type
							</label>
							<select
								id="trip-type-select"
								value={formData.trip_type}
								onChange={(e) => setFormData({ ...formData, trip_type: e.target.value as TripType })}
								className="form-select"
							>
								<option value="airport_transfer">Airport Transfer (Meet & Greet)</option>
								<option value="one_way">One Way Transfer</option>
								<option value="round_trip">Round Trip</option>
								<option value="hourly">By The Hour / As Directed</option>
								<option value="intercity">Intercity Long Distance</option>
							</select>
						</div>

						<div className="form-group">
							<label htmlFor="passenger-count-input" className="form-label">
								Passengers & Luggage
							</label>
							<div style={{ display: "flex", gap: "0.5rem" }}>
								<input
									id="passenger-count-input"
									type="number"
									min="1"
									max="60"
									value={formData.passenger_count || 1}
									onChange={(e) =>
										setFormData({ ...formData, passenger_count: parseInt(e.target.value, 10) || 1 })
									}
									className="form-input"
									placeholder="Passengers"
									style={{ flex: 1 }}
								/>
								<input
									type="text"
									value={formData.luggage_info || ""}
									onChange={(e) => setFormData({ ...formData, luggage_info: e.target.value })}
									className="form-input"
									placeholder="e.g. 3 Large Bags"
									style={{ flex: 2 }}
								/>
							</div>
						</div>
					</div>

					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label htmlFor="pickup-date-input" className="form-label">
								Pickup Date <span style={{ color: "var(--status-danger)" }}>*</span>
							</label>
							<input
								id="pickup-date-input"
								type="date"
								required
								value={formData.pickup_date}
								onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="pickup-time-input" className="form-label">
								Pickup Time <span style={{ color: "var(--status-danger)" }}>*</span>
							</label>
							<input
								id="pickup-time-input"
								type="time"
								required
								value={formData.pickup_time}
								onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
								className="form-input"
							/>
						</div>
					</div>

					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label htmlFor="pickup-location-input" className="form-label">
								Pickup Location / Airport / Hotel <span style={{ color: "var(--status-danger)" }}>*</span>
							</label>
							<input
								id="pickup-location-input"
								type="text"
								required
								value={formData.pickup_location}
								onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
								placeholder="e.g. Athens International Airport (ATH)"
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="dropoff-location-input" className="form-label">
								Drop-off Destination <span style={{ color: "var(--status-danger)" }}>*</span>
							</label>
							<input
								id="dropoff-location-input"
								type="text"
								required
								value={formData.dropoff_location}
								onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
								placeholder="e.g. Hotel Grande Bretagne, Syntagma"
								className="form-input"
							/>
						</div>
					</div>

					{/* Return Details for Round Trip */}
					{formData.trip_type === "round_trip" && (
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem", background: "var(--bg-page)", borderRadius: "var(--radius-sm)" }}>
							<div className="form-group">
								<label htmlFor="return-date-input" className="form-label">
									Return Date
								</label>
								<input
									id="return-date-input"
									type="date"
									value={formData.return_date || ""}
									onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
									className="form-input"
								/>
							</div>
							<div className="form-group">
								<label htmlFor="return-time-input" className="form-label">
									Return Time
								</label>
								<input
									id="return-time-input"
									type="time"
									value={formData.return_time || ""}
									onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
									className="form-input"
								/>
							</div>
						</div>
					)}

					{/* Flight Tracking Details */}
					<div
						style={{
							padding: "1rem",
							background: "var(--bg-page)",
							borderRadius: "var(--radius-sm)",
							display: "grid",
							gridTemplateColumns: "1fr 1fr 1fr",
							gap: "1rem",
						}}
					>
						<div className="form-group">
							<label htmlFor="airline-input" className="form-label">
								Airline
							</label>
							<input
								id="airline-input"
								type="text"
								value={formData.airline || ""}
								onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
								placeholder="e.g. Aegean Airlines / Emirates"
								className="form-input"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="flight-number-input" className="form-label">
								Flight Number
							</label>
							<input
								id="flight-number-input"
								type="text"
								value={formData.flight_number || ""}
								onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
								placeholder="e.g. A3 611"
								className="form-input"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="flight-type-select" className="form-label">
								Flight Type
							</label>
							<select
								id="flight-type-select"
								value={formData.flight_type || "arrival"}
								onChange={(e) =>
									setFormData({ ...formData, flight_type: e.target.value as "arrival" | "departure" })
								}
								className="form-select"
							>
								<option value="arrival">Arrival (Meet at Gates with Nameboard)</option>
								<option value="departure">Departure (Curbside Drop-off)</option>
							</select>
						</div>
					</div>

					<div className="form-group">
						<label htmlFor="additional-stops-input" className="form-label">
							Intermediate Stops & Waypoints (Optional)
						</label>
						<input
							id="additional-stops-input"
							type="text"
							value={formData.additional_stops || ""}
							onChange={(e) => setFormData({ ...formData, additional_stops: e.target.value })}
							placeholder="e.g. Stop 1: Port of Piraeus (Gate E1)"
							className="form-input"
						/>
					</div>
				</div>
			</div>

			{/* 3. Fleet & Chauffeur Assignment */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">3. Vehicle & Chauffeur Assignment</h2>
				</div>
				<div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
					<div className="form-group">
						<label htmlFor="vehicle-category-select" className="form-label">
							Vehicle Class
						</label>
						<select
							id="vehicle-category-select"
							value={formData.vehicle_category || "sedan"}
							onChange={(e) => setFormData({ ...formData, vehicle_category: e.target.value as VehicleCategory })}
							className="form-select"
						>
							<option value="sedan">Executive Sedan (Mercedes E-Class)</option>
							<option value="luxury">First Class (Mercedes S-Class)</option>
							<option value="van">Luxury Van (Mercedes V-Class)</option>
							<option value="suv">Premium SUV</option>
							<option value="minibus">Executive Minibus (Sprinter)</option>
						</select>
					</div>

					<div className="form-group">
						<label htmlFor="assigned-vehicle-select" className="form-label">
							Specific Vehicle (Optional)
						</label>
						<select
							id="assigned-vehicle-select"
							value={formData.vehicle_id || ""}
							onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value || null })}
							className="form-select"
						>
							<option value="">Auto-Assign Later</option>
							{vehicles.map((v) => (
								<option key={v.id} value={v.id}>
									{v.make} {v.model} ({v.registration || "No Reg"})
								</option>
							))}
						</select>
					</div>

					<div className="form-group">
						<label htmlFor="assigned-driver-select" className="form-label">
							Assigned Chauffeur (Optional)
						</label>
						<select
							id="assigned-driver-select"
							value={formData.driver_id || ""}
							onChange={(e) => setFormData({ ...formData, driver_id: e.target.value || null })}
							className="form-select"
						>
							<option value="">Dispatch / Assign Later</option>
							{drivers.map((d) => (
								<option key={d.id} value={d.id}>
									{d.name} ({d.phone || "No phone"})
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* 4. Financials & Notes */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">4. Pricing & Operational Notes</h2>
				</div>
				<div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label htmlFor="price-input" className="form-label">
								Base Fare (€)
							</label>
							<input
								id="price-input"
								type="number"
								step="0.01"
								min="0"
								value={formData.price || 0}
								onChange={(e) => handlePriceChange("price", parseFloat(e.target.value) || 0)}
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="discount-input" className="form-label">
								Discount (€)
							</label>
							<input
								id="discount-input"
								type="number"
								step="0.01"
								min="0"
								value={formData.discount_amount || 0}
								onChange={(e) => handlePriceChange("discount_amount", parseFloat(e.target.value) || 0)}
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="tax-input" className="form-label">
								Tax / VAT (€)
							</label>
							<input
								id="tax-input"
								type="number"
								step="0.01"
								min="0"
								value={formData.tax_amount || 0}
								onChange={(e) => handlePriceChange("tax_amount", parseFloat(e.target.value) || 0)}
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="total-amount-display" className="form-label">
								Total Amount (€)
							</label>
							<input
								id="total-amount-display"
								type="number"
								step="0.01"
								value={formData.total || 0}
								readOnly
								className="form-input"
								style={{ fontWeight: 700, background: "var(--bg-page)" }}
							/>
						</div>
					</div>

					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
						<div className="form-group">
							<label htmlFor="customer-notes-input" className="form-label">
								Customer-Facing Notes
							</label>
							<textarea
								id="customer-notes-input"
								value={formData.customer_notes || ""}
								onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
								placeholder="Printed on confirmation voucher (e.g. driver will hold sign with passenger name)..."
								className="form-input"
								rows={2}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="internal-notes-input" className="form-label">
								Internal Dispatch Notes (Admin Only)
							</label>
							<textarea
								id="internal-notes-input"
								value={formData.internal_notes || ""}
								onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
								placeholder="Gate instructions, VIP security details, billing instructions..."
								className="form-input"
								rows={2}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Submit Actions */}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginBottom: "2rem" }}>
				<button
					type="button"
					onClick={() => router.back()}
					className="btn btn-secondary"
					disabled={loading}
				>
					Cancel
				</button>
				<button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
					{loading ? "Saving Booking..." : isEdit ? "Update Booking" : "Confirm & Create Booking"}
				</button>
			</div>
		</form>
	);
}
