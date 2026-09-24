import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById, getActiveDrivers, getAvailableVehicles } from "@/lib/actions/bookings";
import { getInvoiceByBookingId } from "@/lib/actions/invoices";
import { BookingStatusActions } from "@/components/admin/booking-status-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_BADGES,
	PAYMENT_STATUS_LABELS,
	PAYMENT_STATUS_BADGES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Booking Details — Greece Chauffeur Service",
};

interface BookingDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
	const { id } = await params;
	const result = await getBookingById(id);

	if (!result) {
		notFound();
	}

	const { booking, history } = result;

	const [drivers, vehicles, linkedInvoice] = await Promise.all([
		getActiveDrivers(),
		getAvailableVehicles(),
		getInvoiceByBookingId(id),
	]);

	// Check if a quote is linked to this booking
	const quoteId = booking.quote_id;
	const quoteNumber = booking.quote_number ?? null;

	return (
		<div>
			{/* Breadcrumb */}
			<div style={{ marginBottom: "0.75rem" }}>
				<Link href="/admin/bookings" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
					← Back to Booking Dispatch
				</Link>
			</div>

			{/* Page Header */}
			<div className="page-header">
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
						<h1>{booking.booking_number}</h1>
						<span className={`badge ${BOOKING_STATUS_BADGES[booking.status] || "badge-neutral"}`} style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}>
							{BOOKING_STATUS_LABELS[booking.status] || booking.status}
						</span>
						<span className={`badge ${PAYMENT_STATUS_BADGES[booking.payment_status] || "badge-neutral"}`}>
							{PAYMENT_STATUS_LABELS[booking.payment_status] || booking.payment_status}
						</span>
					</div>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						Created on {formatDate(booking.created_at)} via {booking.booking_source}
					</p>
				</div>
				<div className="page-header-actions">
					<Link
						href={`/admin/bookings/${booking.id}/print`}
						target="_blank"
						className="btn btn-secondary"
						style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<polyline points="6 9 6 2 18 2 18 9"></polyline>
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
							<rect x="6" y="14" width="12" height="8"></rect>
						</svg>
						Print Voucher / PDF
					</Link>
					<Link href={`/admin/bookings/${booking.id}/edit`} className="btn btn-secondary">
						Edit Booking
					</Link>
					<Link href={`/admin/bookings/new?customer_id=${booking.customer_id}`} className="btn btn-primary">
						+ Book Return / Next Trip
					</Link>
				</div>
			</div>

			{/* Two Column Layout */}
			<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", alignItems: "start" }}>
				{/* Left Column: Itinerary, Passenger, Financials */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
					{/* Route & Schedule Card */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Transfer Route & Itinerary</h2>
							<span className="badge badge-neutral">{booking.trip_type?.replace("_", " ")}</span>
						</div>
						<div className="card-body">
							{/* Pickup / Dropoff highlight */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "1rem",
									padding: "1rem",
									background: "var(--bg-page)",
									borderRadius: "var(--radius-sm)",
									marginBottom: "1.25rem",
								}}
							>
								<div style={{ display: "flex", gap: "0.75rem" }}>
									<div style={{ color: "var(--brand-600)", fontWeight: 700, fontSize: "1.125rem" }}>🟢</div>
									<div>
										<div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}>
											Pickup Location
										</div>
										<div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
											{booking.pickup_location}
										</div>
										<div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
											📅 <strong>{booking.pickup_date}</strong> at <strong>{booking.pickup_time}</strong>
										</div>
									</div>
								</div>

								{booking.additional_stops && (
									<div style={{ display: "flex", gap: "0.75rem", paddingLeft: "0.25rem" }}>
										<div style={{ color: "var(--status-warning)", fontWeight: 700 }}>🟡</div>
										<div>
											<div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}>
												Intermediate Stop
											</div>
											<div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
												{booking.additional_stops}
											</div>
										</div>
									</div>
								)}

								<div style={{ display: "flex", gap: "0.75rem" }}>
									<div style={{ color: "var(--status-danger)", fontWeight: 700, fontSize: "1.125rem" }}>🔴</div>
									<div>
										<div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}>
											Destination
										</div>
										<div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
											{booking.dropoff_location}
										</div>
									</div>
								</div>
							</div>

							{/* Flight details */}
							{(booking.flight_number || booking.airline) && (
								<div
									style={{
										padding: "0.875rem 1rem",
										border: "1px solid var(--brand-100)",
										background: "var(--brand-50)",
										borderRadius: "var(--radius-sm)",
										marginBottom: "1.25rem",
										display: "flex",
										alignItems: "center",
										gap: "1rem",
									}}
								>
									<span style={{ fontSize: "1.5rem" }}>✈️</span>
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--brand-700)", fontWeight: 600, textTransform: "uppercase" }}>
											Flight Tracking Details
										</div>
										<div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--brand-900)" }}>
											{booking.airline || "Airline"} {booking.flight_number || "—"} ({booking.flight_type || "Arrival"})
										</div>
									</div>
								</div>
							)}

							{/* Passenger info */}
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
								<div>
									<div className="form-label">Passengers</div>
									<div style={{ fontWeight: 600 }}>{booking.passenger_count} Passenger{booking.passenger_count === 1 ? "" : "s"}</div>
								</div>
								<div>
									<div className="form-label">Luggage Details</div>
									<div>{booking.luggage_info || <span style={{ color: "var(--text-tertiary)" }}>Standard luggage</span>}</div>
								</div>
							</div>

							{booking.special_requests && (
								<div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-default)" }}>
									<div className="form-label">Special Requests / Child Seats</div>
									<div style={{ fontSize: "0.875rem" }}>{booking.special_requests}</div>
								</div>
							)}
						</div>
					</div>

					{/* Customer Details Card */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Client Information</h2>
							<Link href={`/admin/customers/${booking.customer_id}`} style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
								View Client Profile →
							</Link>
						</div>
						<div className="card-body">
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
								<div>
									<div className="form-label">Customer Name</div>
									<div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{booking.customer_name}</div>
								</div>
								<div>
									<div className="form-label">Phone Contact</div>
									{booking.customer_phone ? (
										<a href={`tel:${booking.customer_phone}`} style={{ color: "var(--brand-600)", fontWeight: 600 }}>
											📞 {booking.customer_phone}
										</a>
									) : (
										<span style={{ color: "var(--text-tertiary)" }}>No phone</span>
									)}
								</div>
								<div>
									<div className="form-label">Email Address</div>
									{booking.customer_email ? (
										<a href={`mailto:${booking.customer_email}`} style={{ color: "var(--brand-600)" }}>
											✉️ {booking.customer_email}
										</a>
									) : (
										<span style={{ color: "var(--text-tertiary)" }}>No email</span>
									)}
								</div>
								<div>
									<div className="form-label">Client ID</div>
									<div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
										{booking.customer_id}
									</div>
								</div>
							</div>

							{booking.customer_notes && (
								<div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-default)" }}>
									<div className="form-label">Voucher / Confirmation Notes</div>
									<div style={{ fontSize: "0.875rem" }}>{booking.customer_notes}</div>
								</div>
							)}
						</div>
					</div>

					{/* Financial Summary Card */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Pricing & Financial Settlement</h2>
							<span className={`badge ${PAYMENT_STATUS_BADGES[booking.payment_status] || "badge-neutral"}`}>
								{PAYMENT_STATUS_LABELS[booking.payment_status] || booking.payment_status}
							</span>
						</div>
						<div className="card-body">
							<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
								<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
									<span style={{ color: "var(--text-secondary)" }}>Base Fare:</span>
									<span>{formatCurrency(booking.price)}</span>
								</div>
								{booking.discount_amount > 0 && (
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--status-danger)" }}>
										<span>Discount Applied:</span>
										<span>-{formatCurrency(booking.discount_amount)}</span>
									</div>
								)}
								{booking.tax_amount > 0 && (
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
										<span style={{ color: "var(--text-secondary)" }}>VAT / Tax:</span>
										<span>+{formatCurrency(booking.tax_amount)}</span>
									</div>
								)}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: "1.125rem",
										fontWeight: 700,
										paddingTop: "0.75rem",
										marginTop: "0.5rem",
										borderTop: "1px solid var(--border-default)",
										color: "var(--text-primary)",
									}}
								>
									<span>Total Amount:</span>
									<span>{formatCurrency(booking.total)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column: Status Operations, Assignment, and History Timeline */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
					{/* Status Transitions & Assignment Component */}
					<BookingStatusActions
						bookingId={booking.id}
						currentStatus={booking.status}
						currentDriverId={booking.driver_id}
						currentVehicleId={booking.vehicle_id}
						drivers={drivers}
						vehicles={vehicles}
						quoteId={quoteId || null}
						quoteNumber={quoteNumber || null}
						customerEmail={booking.customer_email || null}
						invoiceId={linkedInvoice?.id || null}
						invoiceNumber={linkedInvoice?.invoice_number || null}
					/>

					{/* Status History Audit Timeline */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Dispatch Status Timeline ({history.length})</h2>
						</div>
						<div className="card-body">
							{history.length === 0 ? (
								<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
									No status changes logged.
								</div>
							) : (
								<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
									{history.map((h, idx) => (
											<div
												key={h.id || idx}
												style={{
													display: "flex",
													gap: "0.75rem",
													position: "relative",
													paddingBottom: idx === history.length - 1 ? 0 : "0.75rem",
													borderBottom: idx === history.length - 1 ? "none" : "1px solid var(--border-default)",
												}}
											>
												<div
													style={{
														width: "10px",
														height: "10px",
														borderRadius: "50%",
														background: "var(--brand-600)",
														marginTop: "0.375rem",
														flexShrink: 0,
													}}
												/>
												<div style={{ flex: 1 }}>
													<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
														<span className={`badge ${BOOKING_STATUS_BADGES[h.to_status] || "badge-neutral"}`} style={{ fontSize: "0.625rem" }}>
															{BOOKING_STATUS_LABELS[h.to_status] || h.to_status}
														</span>
														{h.from_status && (
															<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
																from {BOOKING_STATUS_LABELS[h.from_status] || h.from_status}
															</span>
														)}
													</div>
													{h.notes && (
														<div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
															{h.notes}
														</div>
													)}
													<div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
														{formatDate(h.created_at)}
													</div>
												</div>
											</div>
										)
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
