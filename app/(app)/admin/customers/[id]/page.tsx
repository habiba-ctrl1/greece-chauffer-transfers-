import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/actions/customers";
import { getBookings } from "@/lib/actions/bookings";
import { getQuotes } from "@/lib/actions/quotes";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_BADGES,
	PAYMENT_STATUS_LABELS,
	PAYMENT_STATUS_BADGES,
	QUOTE_STATUS_LABELS,
	QUOTE_STATUS_BADGES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Customer Profile — Greece Chauffeur Service",
};

interface CustomerDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
	const { id } = await params;
	const customer = await getCustomerById(id);

	if (!customer) {
		notFound();
	}

	const [{ bookings }, { quotes }] = await Promise.all([
		getBookings({ customer_id: id, limit: 50 }),
		getQuotes({ customer_id: id, limit: 50 }),
	]);

	return (
		<div>
			{/* Breadcrumb & Navigation */}
			<div style={{ marginBottom: "0.75rem" }}>
				<Link href="/admin/customers" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
					← Back to Customer Directory
				</Link>
			</div>

			{/* Page Header */}
			<div className="page-header">
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
						<h1>{customer.name}</h1>
						<span
							className={`badge ${
								customer.customer_type === "corporate"
									? "badge-info"
									: customer.customer_type === "agency"
									? "badge-warning"
									: "badge-neutral"
							}`}
						>
							{customer.customer_type}
						</span>
					</div>
					{customer.company_name && (
						<p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
							{customer.company_name}
						</p>
					)}
				</div>
				<div className="page-header-actions">
					<Link href={`/admin/customers/${customer.id}/edit`} className="btn btn-secondary">
						Edit Profile
					</Link>
					<Link href={`/admin/quotes/new?customer_id=${customer.id}`} className="btn btn-secondary">
						+ Create Quote
					</Link>
					<Link href={`/admin/bookings/new?customer_id=${customer.id}`} className="btn btn-primary">
						+ Book Transfer
					</Link>
				</div>
			</div>

			{/* Quick Stats Grid */}
			<div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Total Bookings</span>
						<div className="stat-card-icon" style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}>
							🚖
						</div>
					</div>
					<div className="stat-card-value">{customer.total_bookings}</div>
					<div className="stat-card-footer">All-time lifetime transfers</div>
				</div>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Completed Trips</span>
						<div className="stat-card-icon" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>
							✓
						</div>
					</div>
					<div className="stat-card-value">{customer.completed_trips}</div>
					<div className="stat-card-footer">Successfully dispatched</div>
				</div>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Total Spent</span>
						<div className="stat-card-icon" style={{ background: "var(--status-info-bg)", color: "var(--status-info)" }}>
							💶
						</div>
					</div>
					<div className="stat-card-value">{formatCurrency(customer.total_spent)}</div>
					<div className="stat-card-footer">Settled revenue</div>
				</div>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Client Since</span>
						<div className="stat-card-icon" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
							🗓️
						</div>
					</div>
					<div className="stat-card-value" style={{ fontSize: "1.25rem", paddingTop: "0.25rem" }}>
						{formatDate(customer.created_at)}
					</div>
					<div className="stat-card-footer">Account creation date</div>
				</div>
			</div>

			{/* Contact & Notes Card */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Client Details & Preferences</h2>
				</div>
				<div className="card-body">
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
						<div>
							<div className="form-label">Email Address</div>
							{customer.email ? (
								<a href={`mailto:${customer.email}`} style={{ color: "var(--brand-600)", fontWeight: 500 }}>
									{customer.email}
								</a>
							) : (
								<span style={{ color: "var(--text-tertiary)" }}>Not provided</span>
							)}
						</div>

						<div>
							<div className="form-label">Phone Number</div>
							{customer.phone ? (
								<a href={`tel:${customer.phone}`} style={{ color: "var(--brand-600)", fontWeight: 500 }}>
									{customer.phone}
								</a>
							) : (
								<span style={{ color: "var(--text-tertiary)" }}>Not provided</span>
							)}
						</div>

						<div>
							<div className="form-label">Company</div>
							<div>{customer.company_name || <span style={{ color: "var(--text-tertiary)" }}>None</span>}</div>
						</div>
					</div>

					{customer.notes && (
						<div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-default)" }}>
							<div className="form-label">VIP Notes & Service Instructions</div>
							<div
								style={{
									background: "var(--bg-page)",
									padding: "0.875rem 1rem",
									borderRadius: "var(--radius-sm)",
									fontSize: "0.875rem",
									marginTop: "0.375rem",
									whiteSpace: "pre-wrap",
								}}
							>
								{customer.notes}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Booking History */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">Booking History ({bookings.length})</h2>
					<Link href={`/admin/bookings/new?customer_id=${customer.id}`} className="btn btn-sm btn-primary">
						+ Book Transfer
					</Link>
				</div>
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Booking #</th>
								<th>Date & Time</th>
								<th>Route</th>
								<th>Vehicle & Driver</th>
								<th>Status</th>
								<th>Total</th>
								<th style={{ textAlign: "right" }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{bookings.length === 0 ? (
								<tr>
									<td colSpan={7}>
										<div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
											<div className="empty-state-icon">🚖</div>
											<div className="empty-state-title">No Transfers Recorded Yet</div>
											<div className="empty-state-text">
												This customer has no past or upcoming bookings in the dispatch system.
											</div>
											<Link
												href={`/admin/bookings/new?customer_id=${customer.id}`}
												className="btn btn-sm btn-primary"
												style={{ marginTop: "1rem" }}
											>
												Create First Booking
											</Link>
										</div>
									</td>
								</tr>
							) : (
								bookings.map((b) => (
										<tr key={b.id}>
											<td>
												<Link
													href={`/admin/bookings/${b.id}`}
													style={{ fontWeight: 600, color: "var(--brand-700)" }}
												>
													{b.booking_number}
												</Link>
											</td>
											<td>
												<div>{b.pickup_date || "—"}</div>
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													{b.pickup_time || "—"}
												</div>
											</td>
											<td>
												<div style={{ fontWeight: 500 }}>{b.pickup_location}</div>
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													→ {b.dropoff_location}
												</div>
											</td>
											<td>
												<div>{b.driver_name || <span style={{ color: "var(--status-warning)", fontSize: "0.75rem" }}>Unassigned</span>}</div>
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													{b.vehicle_model || b.vehicle_category || "—"}
												</div>
											</td>
											<td>
												<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
													<span className={`badge ${BOOKING_STATUS_BADGES[b.status] || "badge-neutral"}`}>
														{BOOKING_STATUS_LABELS[b.status] || b.status}
													</span>
													<span className={`badge ${PAYMENT_STATUS_BADGES[b.payment_status] || "badge-neutral"}`} style={{ fontSize: "0.625rem" }}>
														{PAYMENT_STATUS_LABELS[b.payment_status] || b.payment_status}
													</span>
												</div>
											</td>
											<td style={{ fontWeight: 600 }}>{formatCurrency(b.total)}</td>
											<td style={{ textAlign: "right" }}>
												<Link href={`/admin/bookings/${b.id}`} className="btn btn-sm btn-secondary">
													View
												</Link>
											</td>
										</tr>
									))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Quotations & Inquiries History */}
			<div className="card" style={{ marginTop: "1.5rem" }}>
				<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<h2 className="card-title">Quotations & Inquiries ({quotes.length})</h2>
					<Link href={`/admin/quotes/new?customer_id=${customer.id}`} className="btn btn-sm btn-secondary">
						+ New Quote
					</Link>
				</div>
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Quote #</th>
								<th>Date & Time</th>
								<th>Route</th>
								<th>Vehicle Class</th>
								<th>Status</th>
								<th>Total</th>
								<th style={{ textAlign: "right" }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{quotes.length === 0 ? (
								<tr>
									<td colSpan={7}>
										<div className="empty-state" style={{ padding: "2rem 1rem" }}>
											<div className="empty-state-title">No Quotations Yet</div>
											<div className="empty-state-text">
												No quotes have been issued for this customer.
											</div>
										</div>
									</td>
								</tr>
							) : (
								quotes.map((q) => (
									<tr key={q.id}>
										<td>
											<Link
												href={`/admin/quotes/${q.id}`}
												style={{ fontWeight: 600, color: "var(--accent)" }}
											>
												{q.quote_number}
											</Link>
											{q.converted_booking_number && (
												<div style={{ fontSize: "0.6875rem", color: "#22c55e" }}>
													Converted: {q.converted_booking_number}
												</div>
											)}
										</td>
										<td>
											<div>{q.pickup_date ? formatDate(q.pickup_date) : "—"}</div>
											<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
												{q.pickup_time || "—"}
											</div>
										</td>
										<td>
											<div style={{ fontWeight: 500 }}>{q.pickup_location || "—"}</div>
											<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
												→ {q.dropoff_location || "—"}
											</div>
										</td>
										<td>
											<span style={{ textTransform: "capitalize" }}>{q.vehicle_category || "Sedan"}</span>
										</td>
										<td>
											<span className={`badge ${QUOTE_STATUS_BADGES[q.status] || "badge-neutral"}`}>
												{QUOTE_STATUS_LABELS[q.status] || q.status}
											</span>
										</td>
										<td style={{ fontWeight: 600 }}>{formatCurrency(q.total)}</td>
										<td style={{ textAlign: "right" }}>
											<Link href={`/admin/quotes/${q.id}`} className="btn btn-sm btn-secondary">
												View
											</Link>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
