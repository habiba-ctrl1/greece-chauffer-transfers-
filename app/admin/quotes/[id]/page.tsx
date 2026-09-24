import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteById } from "@/lib/actions/quotes";
import { getEmailLogs } from "@/lib/actions/emails";
import { QuoteStatusActions } from "@/components/admin/quote-status-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_BADGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Quote Details — Greece Chauffeur Service",
};

interface QuoteDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
	const { id } = await params;
	const [quote, emailLogsResult] = await Promise.all([
		getQuoteById(id),
		getEmailLogs({ related_type: "quote", related_id: id, limit: 5 }),
	]);

	if (!quote) {
		notFound();
	}

	return (
		<div>
			{/* Breadcrumb */}
			<div style={{ marginBottom: "0.75rem" }}>
				<Link href="/admin/quotes" style={{ color: "var(--accent)", fontSize: "0.8125rem" }}>
					← Back to Quotes & Inquiries
				</Link>
			</div>

			{/* Page Header */}
			<div className="page-header">
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
						<h1>{quote.quote_number}</h1>
						<span
							className={`badge ${QUOTE_STATUS_BADGES[quote.status] || "badge-neutral"}`}
							style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}
						>
							{QUOTE_STATUS_LABELS[quote.status] || quote.status}
						</span>
						{quote.converted_booking_id && (
							<span className="badge badge-success" style={{ fontSize: "0.8125rem" }}>
								✓ Converted to Booking
							</span>
						)}
					</div>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						Created on {formatDate(quote.created_at)}
					</p>
				</div>
				<div className="page-header-actions">
					<Link
						href={`/admin/quotes/${quote.id}/print`}
						target="_blank"
						className="btn btn-secondary"
						style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<polyline points="6 9 6 2 18 2 18 9"></polyline>
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
							<rect x="6" y="14" width="12" height="8"></rect>
						</svg>
						Print / PDF
					</Link>
					<Link href={`/admin/quotes/${quote.id}/edit`} className="btn btn-secondary">
						Edit Quote
					</Link>
					<Link href={`/admin/quotes/new?customer_id=${quote.customer_id}`} className="btn btn-secondary">
						+ Another Quote
					</Link>
				</div>
			</div>

			{/* Status Lifecycle & Conversion Component */}
			<QuoteStatusActions
				quoteId={quote.id}
				quoteNumber={quote.quote_number}
				currentStatus={quote.status}
				customerEmail={quote.customer_email}
				convertedBookingId={quote.converted_booking_id}
				convertedBookingNumber={quote.converted_booking_number}
			/>

			{/* Conversion Alert Banner */}
			{quote.converted_booking_id && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "1rem 1.25rem",
						borderRadius: "8px",
						background: "rgba(34, 197, 94, 0.08)",
						border: "1px solid rgba(34, 197, 94, 0.25)",
						marginBottom: "1.5rem",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
						<div
							style={{
								width: "32px",
								height: "32px",
								borderRadius: "50%",
								background: "rgba(34, 197, 94, 0.2)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#22c55e",
							}}
						>
							✓
						</div>
						<div>
							<div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
								This quotation was converted into live Booking {quote.converted_booking_number}
							</div>
							<div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
								All route, passenger, and pricing specs are active in dispatch operations.
							</div>
						</div>
					</div>
					<Link href={`/admin/bookings/${quote.converted_booking_id}`} className="btn btn-primary btn-sm">
						Open Booking Dispatch →
					</Link>
				</div>
			)}

			{/* Two Column Layout */}
			<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", alignItems: "start" }}>
				{/* Left Column: Itinerary, Line Items, Notes */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
					{/* Route & Schedule Card */}
					<div className="card">
						<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<h2 className="card-title">Transfer Route & Itinerary</h2>
							<span className="badge badge-neutral" style={{ textTransform: "capitalize" }}>
								{quote.trip_type?.replace("_", " ") || "One Way"}
							</span>
						</div>
						<div className="card-body">
							{/* Pickup & Dropoff Visual Track */}
							<div style={{ position: "relative", paddingLeft: "2rem", marginBottom: "1.5rem" }}>
								<div
									style={{
										position: "absolute",
										left: "7px",
										top: "10px",
										bottom: "10px",
										width: "2px",
										background: "var(--border-color)",
									}}
								/>
								{/* Pickup Node */}
								<div style={{ position: "relative", marginBottom: "1.25rem" }}>
									<div
										style={{
											position: "absolute",
											left: "-2rem",
											top: "3px",
											width: "16px",
											height: "16px",
											borderRadius: "50%",
											background: "#22c55e",
											border: "3px solid var(--bg-surface)",
										}}
									/>
									<div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
										Pickup Location
									</div>
									<div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
										{quote.pickup_location || "Not specified"}
									</div>
									<div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
										📅 {quote.pickup_date ? formatDate(quote.pickup_date) : "Date TBD"} at ⏰ {quote.pickup_time || "Time TBD"}
									</div>
								</div>

								{/* Dropoff Node */}
								<div style={{ position: "relative" }}>
									<div
										style={{
											position: "absolute",
											left: "-2rem",
											top: "3px",
											width: "16px",
											height: "16px",
											borderRadius: "50%",
											background: "#ef4444",
											border: "3px solid var(--bg-surface)",
										}}
									/>
									<div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
										Dropoff Location
									</div>
									<div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
										{quote.dropoff_location || "Not specified"}
									</div>
								</div>
							</div>

							{/* Round Trip Return Details if applicable */}
							{quote.trip_type === "round_trip" && (quote.return_date || quote.return_time) && (
								<div
									style={{
										padding: "0.75rem 1rem",
										borderRadius: "6px",
										background: "rgba(255, 255, 255, 0.02)",
										border: "1px solid var(--border-color)",
										marginBottom: "1rem",
									}}
								>
									<span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Return Trip: </span>
									<span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
										{quote.return_date ? formatDate(quote.return_date) : ""} at {quote.return_time || ""}
									</span>
								</div>
							)}

							{/* Flight Info & Vehicle Info */}
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
									gap: "1rem",
									paddingTop: "1rem",
									borderTop: "1px solid var(--border-color)",
								}}
							>
								<div>
									<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Vehicle Class</div>
									<div style={{ fontWeight: 600, textTransform: "capitalize" }}>
										{quote.vehicle_category || "Sedan"}
									</div>
								</div>
								<div>
									<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Passengers</div>
									<div style={{ fontWeight: 600 }}>{quote.passenger_count} Pax</div>
								</div>
								{quote.luggage_info && (
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Luggage</div>
										<div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{quote.luggage_info}</div>
									</div>
								)}
								{quote.flight_number && (
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Flight Tracker</div>
										<div style={{ fontWeight: 600, color: "var(--accent)" }}>
											✈️ {quote.flight_number} {quote.airline ? `(${quote.airline})` : ""}
										</div>
									</div>
								)}
							</div>

							{quote.additional_stops && (
								<div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
									<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Additional En-Route Stops</div>
									<div style={{ fontSize: "0.875rem", marginTop: "2px" }}>{quote.additional_stops}</div>
								</div>
							)}
						</div>
					</div>

					{/* Itemized Line Items & Financials Card */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Itemized Pricing Breakdown</h2>
						</div>
						<div className="card-body" style={{ padding: 0 }}>
							<div className="table-container">
								<table className="admin-table">
									<thead>
										<tr>
											<th>Line Item Description</th>
											<th style={{ textAlign: "center", width: "80px" }}>Qty</th>
											<th style={{ textAlign: "right", width: "120px" }}>Unit Price</th>
											<th style={{ textAlign: "right", width: "120px" }}>Total</th>
										</tr>
									</thead>
									<tbody>
										{quote.items && quote.items.length > 0 ? (
											quote.items.map((item, idx) => (
												<tr key={idx}>
													<td style={{ fontWeight: 500 }}>{item.description}</td>
													<td style={{ textAlign: "center" }}>{item.quantity}</td>
													<td style={{ textAlign: "right" }}>{formatCurrency(item.unit_price)}</td>
													<td style={{ textAlign: "right", fontWeight: 600 }}>
														{formatCurrency(item.total)}
													</td>
												</tr>
											))
										) : (
											<tr>
												<td style={{ fontWeight: 500 }}>Chauffeur Transfer Service</td>
												<td style={{ textAlign: "center" }}>1</td>
												<td style={{ textAlign: "right" }}>{formatCurrency(quote.subtotal || quote.total)}</td>
												<td style={{ textAlign: "right", fontWeight: 600 }}>
													{formatCurrency(quote.subtotal || quote.total)}
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>

							{/* Financial Totals */}
							<div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border-color)" }}>
								<div style={{ maxWidth: "320px", marginLeft: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
										<span style={{ color: "var(--text-muted)" }}>Subtotal:</span>
										<span style={{ fontWeight: 600 }}>{formatCurrency(quote.subtotal || quote.total)}</span>
									</div>
									{quote.discount_amount > 0 && (
										<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#22c55e" }}>
											<span>Discount:</span>
											<span>-{formatCurrency(quote.discount_amount)}</span>
										</div>
									)}
									{quote.tax_amount > 0 && (
										<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
											<span style={{ color: "var(--text-muted)" }}>Tax / VAT:</span>
											<span>+{formatCurrency(quote.tax_amount)}</span>
										</div>
									)}
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											fontSize: "1.125rem",
											fontWeight: 700,
											color: "var(--accent)",
											paddingTop: "0.5rem",
											borderTop: "1px solid var(--border-color)",
										}}
									>
										<span>Total Quote:</span>
										<span>{formatCurrency(quote.total)}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Notes & Special Requests */}
					{(quote.notes || quote.internal_notes || quote.special_requests) && (
						<div className="card">
							<div className="card-header">
								<h2 className="card-title">Instructions & Notes</h2>
							</div>
							<div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
								{quote.special_requests && (
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
											Special Requests
										</div>
										<p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{quote.special_requests}</p>
									</div>
								)}

								{quote.notes && (
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
											Client Visible Notes
										</div>
										<p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{quote.notes}</p>
									</div>
								)}

								{quote.internal_notes && (
									<div style={{ padding: "0.75rem", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)", border: "1px dashed var(--border-color)" }}>
										<div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
											🔒 Internal Dispatcher Notes
										</div>
										<p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{quote.internal_notes}</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Right Column: Customer & Validity Info */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
					{/* Customer Card */}
					<div className="card">
						<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<h3 className="card-title">Client Information</h3>
							<Link href={`/admin/customers/${quote.customer_id}`} style={{ fontSize: "0.8125rem", color: "var(--accent)" }}>
								View Profile →
							</Link>
						</div>
						<div className="card-body">
							<div style={{ fontWeight: 600, fontSize: "1.0625rem", color: "var(--text-primary)" }}>
								{quote.customer_name}
							</div>
							{quote.customer_company && (
								<div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
									🏢 {quote.customer_company}
								</div>
							)}

							<div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
								{quote.customer_email && (
									<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
										<span style={{ color: "var(--text-muted)" }}>✉️</span>
										<a href={`mailto:${quote.customer_email}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
											{quote.customer_email}
										</a>
									</div>
								)}

								{quote.customer_phone && (
									<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
										<span style={{ color: "var(--text-muted)" }}>📞</span>
										<a href={`tel:${quote.customer_phone}`} style={{ color: "var(--text-primary)" }}>
											{quote.customer_phone}
										</a>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Validity & Metadata Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Quote Meta & Validity</h3>
						</div>
						<div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "var(--text-muted)" }}>Status:</span>
								<span className={`badge ${QUOTE_STATUS_BADGES[quote.status] || "badge-neutral"}`}>
									{QUOTE_STATUS_LABELS[quote.status] || quote.status}
								</span>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "var(--text-muted)" }}>Valid Until:</span>
								<span style={{ fontWeight: 600 }}>
									{quote.valid_until ? formatDate(quote.valid_until) : "No Expiry"}
								</span>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "var(--text-muted)" }}>Created On:</span>
								<span>{formatDate(quote.created_at)}</span>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<span style={{ color: "var(--text-muted)" }}>Last Updated:</span>
								<span>{formatDate(quote.updated_at)}</span>
							</div>
						</div>
					</div>

					{/* Email Dispatch History Card */}
					<div className="card">
						<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<h3 className="card-title">Email History</h3>
							<Link href="/admin/emails?related_type=quote" style={{ fontSize: "0.75rem", color: "var(--brand-600)" }}>
								View Outbox
							</Link>
						</div>
						<div className="card-body" style={{ padding: 0 }}>
							{emailLogsResult.logs.length === 0 ? (
								<div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
									No emails dispatched yet. Click &quot;Email to Client&quot; to send this proposal.
								</div>
							) : (
								<div style={{ display: "flex", flexDirection: "column" }}>
									{emailLogsResult.logs.map((log) => (
										<div
											key={log.id}
											style={{
												padding: "0.75rem 1rem",
												borderBottom: "1px solid var(--border-default)",
												fontSize: "0.8125rem",
											}}
										>
											<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
												<span
													className={`badge ${
														log.status === "sent" ? "badge-success" : "badge-danger"
													}`}
													style={{ fontSize: "0.6875rem", padding: "0.15rem 0.4rem" }}
												>
													{log.status.toUpperCase()}
												</span>
												<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													{formatDate(log.sent_at || log.created_at)}
												</span>
											</div>
											<div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
												{log.recipient_email}
											</div>
											<div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", marginTop: "0.125rem" }}>
												{log.subject}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
