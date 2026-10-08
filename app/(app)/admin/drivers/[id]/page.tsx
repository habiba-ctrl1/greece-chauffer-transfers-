import Link from "next/link";
import { notFound } from "next/navigation";
import { getDriverById } from "@/lib/actions/drivers";
import { getBookings } from "@/lib/actions/bookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_BADGES,
	PAYMENT_STATUS_LABELS,
	PAYMENT_STATUS_BADGES,
	DRIVER_STATUS_LABELS,
	DRIVER_STATUS_BADGES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Driver Profile — Greece Chauffeur Service",
};

interface DriverDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
	const { id } = await params;
	const driver = await getDriverById(id);

	if (!driver) {
		notFound();
	}

	const { bookings } = await getBookings({ driver_id: id, limit: 50 });

	const licenseExpiringSoon =
		driver.license_expiry &&
		new Date(driver.license_expiry).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;

	return (
		<div>
			{/* Breadcrumb */}
			<div style={{ marginBottom: "0.75rem" }}>
				<Link href="/admin/drivers" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
					← Back to Drivers
				</Link>
			</div>

			{/* Page Header */}
			<div className="page-header">
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
						<h1>{driver.name}</h1>
						<span className={`badge ${DRIVER_STATUS_BADGES[driver.status] || "badge-neutral"}`}>
							{DRIVER_STATUS_LABELS[driver.status] || driver.status}
						</span>
					</div>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem", textTransform: "capitalize" }}>
						{driver.driver_type} Driver
					</p>
				</div>
				<div className="page-header-actions">
					<Link href={`/admin/drivers/${driver.id}/edit`} className="btn btn-secondary">
						Edit Profile
					</Link>
					<Link href="/admin/bookings/new" className="btn btn-primary">
						+ New Booking
					</Link>
				</div>
			</div>

			{licenseExpiringSoon && (
				<div style={{ marginBottom: "1.5rem" }}>
					<div
						style={{
							background: "var(--status-warning-bg)",
							color: "var(--status-warning)",
							border: "1px solid rgba(230, 119, 0, 0.2)",
							borderRadius: "var(--radius-md)",
							padding: "0.875rem 1.25rem",
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
						}}
					>
						<span style={{ fontSize: "1.25rem" }}>⚠️</span>
						<div>
							<strong>License expires {formatDate(driver.license_expiry!)}</strong>
							<div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
								Renew this driver&apos;s license soon to keep them eligible for dispatch.
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Quick Stats */}
			<div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Total Trips</span>
						<div className="stat-card-icon" style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}>
							🚖
						</div>
					</div>
					<div className="stat-card-value">{driver.total_trips}</div>
					<div className="stat-card-footer">All-time assigned transfers</div>
				</div>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Completed Trips</span>
						<div className="stat-card-icon" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>
							✓
						</div>
					</div>
					<div className="stat-card-value">{driver.completed_trips}</div>
					<div className="stat-card-footer">Successfully finished</div>
				</div>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Driver Since</span>
						<div className="stat-card-icon" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
							🗓️
						</div>
					</div>
					<div className="stat-card-value" style={{ fontSize: "1.25rem", paddingTop: "0.25rem" }}>
						{formatDate(driver.created_at)}
					</div>
					<div className="stat-card-footer">Onboarding date</div>
				</div>
			</div>

			{/* Contact & License Details */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Contact & License Details</h2>
				</div>
				<div className="card-body">
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
						<div>
							<div className="form-label">Phone Number</div>
							{driver.phone ? (
								<a href={`tel:${driver.phone}`} style={{ color: "var(--brand-600)", fontWeight: 500 }}>
									{driver.phone}
								</a>
							) : (
								<span style={{ color: "var(--text-tertiary)" }}>Not provided</span>
							)}
						</div>

						<div>
							<div className="form-label">Email Address</div>
							{driver.email ? (
								<a href={`mailto:${driver.email}`} style={{ color: "var(--brand-600)", fontWeight: 500 }}>
									{driver.email}
								</a>
							) : (
								<span style={{ color: "var(--text-tertiary)" }}>Not provided</span>
							)}
						</div>

						<div>
							<div className="form-label">Address</div>
							<div>{driver.address || <span style={{ color: "var(--text-tertiary)" }}>Not provided</span>}</div>
						</div>

						<div>
							<div className="form-label">License Number</div>
							<div>{driver.license_number || <span style={{ color: "var(--text-tertiary)" }}>Not provided</span>}</div>
						</div>

						<div>
							<div className="form-label">License Expiry</div>
							<div>{driver.license_expiry ? formatDate(driver.license_expiry) : <span style={{ color: "var(--text-tertiary)" }}>Not provided</span>}</div>
						</div>

						<div>
							<div className="form-label">Emergency Contact</div>
							<div>
								{driver.emergency_contact_name || <span style={{ color: "var(--text-tertiary)" }}>Not provided</span>}
								{driver.emergency_contact_phone && ` (${driver.emergency_contact_phone})`}
							</div>
						</div>
					</div>

					{driver.notes && (
						<div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-default)" }}>
							<div className="form-label">Notes</div>
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
								{driver.notes}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Trip History */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">Trip History ({bookings.length})</h2>
				</div>
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Booking #</th>
								<th>Date & Time</th>
								<th>Route</th>
								<th>Customer</th>
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
											<div className="empty-state-title">No Trips Assigned Yet</div>
											<div className="empty-state-text">
												This driver has no past or upcoming bookings assigned.
											</div>
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
										<td>{b.customer_name}</td>
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
		</div>
	);
}
