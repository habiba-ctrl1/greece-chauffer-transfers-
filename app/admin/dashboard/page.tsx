import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_BADGES } from "@/lib/constants";
import type { BookingWithDetails, ActivityLog } from "@/lib/schema";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Dashboard — Greece Chauffeur Operations",
};

interface DashboardStats {
	todayBookings: number;
	pendingQuotes: number;
	activeDrivers: number;
	revenueMtd: number;
	unassignedBookings: number;
	todaySchedule: BookingWithDetails[];
	recentActivity: ActivityLog[];
}

async function getDashboardData(): Promise<DashboardStats> {
	try {
		const db = await getDb();

		const [
			todayBookingsRes,
			pendingQuotesRes,
			activeDriversRes,
			revenueRes,
			unassignedRes,
			todayScheduleRes,
			activityRes,
		] = await Promise.allSettled([
			db.prepare("SELECT COUNT(*) as count FROM bookings WHERE pickup_date = date('now')").first<{ count: number }>(),
			db.prepare("SELECT COUNT(*) as count FROM quotes WHERE status IN ('draft', 'sent')").first<{ count: number }>(),
			db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'active'").first<{ count: number }>(),
			db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND payment_date >= date('now', 'start of month')").first<{ total: number }>(),
			db.prepare("SELECT COUNT(*) as count FROM bookings WHERE driver_id IS NULL AND status IN ('confirmed', 'awaiting_confirmation')").first<{ count: number }>(),
			db.prepare(`
				SELECT 
					b.*,
					c.name as customer_name,
					c.email as customer_email,
					c.phone as customer_phone,
					d.name as driver_name,
					d.phone as driver_phone,
					v.make as vehicle_make,
					v.model as vehicle_model,
					v.registration as vehicle_registration
				FROM bookings b
				JOIN customers c ON c.id = b.customer_id
				LEFT JOIN drivers d ON d.id = b.driver_id
				LEFT JOIN vehicles v ON v.id = b.vehicle_id
				WHERE b.pickup_date = date('now')
				ORDER BY b.pickup_time ASC
				LIMIT 6
			`).all<BookingWithDetails>(),
			db.prepare(`
				SELECT * FROM activity_logs 
				ORDER BY created_at DESC 
				LIMIT 6
			`).all<ActivityLog>(),
		]);

		return {
			todayBookings: todayBookingsRes.status === "fulfilled" ? (todayBookingsRes.value?.count ?? 0) : 0,
			pendingQuotes: pendingQuotesRes.status === "fulfilled" ? (pendingQuotesRes.value?.count ?? 0) : 0,
			activeDrivers: activeDriversRes.status === "fulfilled" ? (activeDriversRes.value?.count ?? 0) : 0,
			revenueMtd: revenueRes.status === "fulfilled" ? (revenueRes.value?.total ?? 0) : 0,
			unassignedBookings: unassignedRes.status === "fulfilled" ? (unassignedRes.value?.count ?? 0) : 0,
			todaySchedule: todayScheduleRes.status === "fulfilled" ? (todayScheduleRes.value?.results || []) : [],
			recentActivity: activityRes.status === "fulfilled" ? (activityRes.value?.results || []) : [],
		};
	} catch {
		return {
			todayBookings: 0,
			pendingQuotes: 0,
			activeDrivers: 0,
			revenueMtd: 0,
			unassignedBookings: 0,
			todaySchedule: [],
			recentActivity: [],
		};
	}
}

export default async function DashboardPage() {
	const data = await getDashboardData();

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Operations Overview</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						Real-time dispatch, schedule monitor & fleet tracking
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/admin/bookings/new" className="btn btn-primary">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						<span>New Booking</span>
					</Link>
					<Link href="/admin/quotes/new" className="btn btn-secondary">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						<span>New Quote</span>
					</Link>
				</div>
			</div>

			{/* Operational Alerts if any */}
			{data.unassignedBookings > 0 && (
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
							justifyContent: "space-between",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
							<span style={{ fontSize: "1.25rem" }}>⚠️</span>
							<div>
								<strong>{data.unassignedBookings} Confirmed Booking(s) Require Driver Assignment</strong>
								<div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
									Assign vehicles and chauffeurs to prevent dispatch delays.
								</div>
							</div>
						</div>
						<Link href="/admin/bookings?unassigned=true" className="btn btn-sm btn-secondary">
							Review Bookings
						</Link>
					</div>
				</div>
			)}

			{/* Stat Cards Grid */}
			<div className="dashboard-grid">
				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Today&apos;s Transfers</span>
						<div className="stat-card-icon" style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}>
							🚖
						</div>
					</div>
					<div className="stat-card-value">{data.todayBookings}</div>
					<div className="stat-card-footer">Scheduled for today</div>
				</div>

				<Link href="/admin/quotes" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
					<div className="stat-card-header">
						<span className="stat-card-label">Pending Quotes</span>
						<div className="stat-card-icon" style={{ background: "var(--status-warning-bg)", color: "var(--status-warning)" }}>
							📋
						</div>
					</div>
					<div className="stat-card-value">{data.pendingQuotes}</div>
					<div className="stat-card-footer">Draft or in-review quotes →</div>
				</Link>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Active Chauffeurs</span>
						<div className="stat-card-icon" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>
							👤
						</div>
					</div>
					<div className="stat-card-value">{data.activeDrivers}</div>
					<div className="stat-card-footer">Available for dispatch</div>
				</div>

				<div className="stat-card">
					<div className="stat-card-header">
						<span className="stat-card-label">Revenue (MTD)</span>
						<div className="stat-card-icon" style={{ background: "var(--status-info-bg)", color: "var(--status-info)" }}>
							💶
						</div>
					</div>
					<div className="stat-card-value">{formatCurrency(data.revenueMtd)}</div>
					<div className="stat-card-footer">Month-to-date settled</div>
				</div>
			</div>

			{/* Quick Operational Shortcuts */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Quick Operational Actions</h2>
				</div>
				<div className="card-body">
					<div className="quick-actions" style={{ marginBottom: 0 }}>
						<Link href="/admin/bookings/new" className="btn btn-secondary">
							+ Create Booking
						</Link>
						<Link href="/admin/quotes/new" className="btn btn-secondary">
							+ Draft Quotation
						</Link>
						<Link href="/admin/customers/new" className="btn btn-secondary">
							+ Add Customer
						</Link>
						<Link href="/admin/drivers/new" className="btn btn-secondary">
							+ Onboard Driver
						</Link>
						<Link href="/admin/vehicles/new" className="btn btn-secondary">
							+ Add Vehicle
						</Link>
						<Link href="/admin/calendar" className="btn btn-secondary">
							📅 View Schedule
						</Link>
					</div>
				</div>
			</div>

			{/* Two Column Layout: Today's Schedule & Recent Activity */}
			<div className="dashboard-sections">
				{/* Today's Schedule */}
				<div className="card">
					<div className="card-header">
						<h2 className="card-title">Today&apos;s Dispatch Schedule</h2>
						<Link href="/admin/bookings?today=true" style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
							View All Bookings →
						</Link>
					</div>
					<div className="card-body card-body-flush">
						{data.todaySchedule.length === 0 ? (
							<div className="empty-state" style={{ padding: "2rem 1rem" }}>
								<div className="empty-state-icon">🗓️</div>
								<div className="empty-state-title">No Bookings Scheduled for Today</div>
								<div className="empty-state-text">
									When new bookings are scheduled for today, they will appear here with pickup times, vehicle assignments, and route details.
								</div>
								<Link href="/admin/bookings/new" className="btn btn-sm btn-primary" style={{ marginTop: "1rem" }}>
									Create First Booking
								</Link>
							</div>
						) : (
							<div className="table-wrap">
								<table className="table">
									<thead>
										<tr>
											<th>Time</th>
											<th>Route</th>
											<th>Passenger</th>
											<th>Chauffeur</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{data.todaySchedule.map((b) => (
												<tr key={b.id}>
													<td style={{ fontWeight: 600 }}>{b.pickup_time}</td>
													<td>
														<Link href={`/admin/bookings/${b.id}`} style={{ fontWeight: 500, color: "var(--brand-700)" }}>
															{b.pickup_location} → {b.dropoff_location}
														</Link>
													</td>
													<td>{b.customer_name}</td>
													<td>
														{b.driver_name || (
															<span className="badge badge-warning" style={{ fontSize: "0.625rem" }}>
																Unassigned
															</span>
														)}
													</td>
													<td>
														<span className={`badge ${BOOKING_STATUS_BADGES[b.status] || "badge-neutral"}`} style={{ fontSize: "0.625rem" }}>
															{BOOKING_STATUS_LABELS[b.status] || b.status}
														</span>
													</td>
												</tr>
											))
										}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				{/* Recent Activity */}
				<div className="card">
					<div className="card-header">
						<h2 className="card-title">Recent Activity Feed</h2>
						<Link href="/admin/activity-log" style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
							View Full Audit Log →
						</Link>
					</div>
					<div className="card-body">
						{data.recentActivity.length === 0 ? (
							<div className="empty-state" style={{ padding: "2rem 1rem" }}>
								<div className="empty-state-icon">⚡</div>
								<div className="empty-state-title">System Activity Feed</div>
								<div className="empty-state-text">
									Real-time audit log of quotes sent, bookings confirmed, driver assignments, and customer updates.
								</div>
							</div>
						) : (
							<div style={{ display: "flex", flexDirection: "column" }}>
								{data.recentActivity.map((act) => (
									<div key={act.id} className="activity-item">
										<div
											className="activity-dot"
											style={{
												background:
													act.action === "created"
														? "var(--brand-500)"
														: act.action === "status_changed"
														? "var(--status-warning)"
														: act.action === "assigned"
														? "var(--status-info)"
														: "var(--gray-400)",
											}}
										/>
										<div className="activity-content">
											<div className="activity-text">
												<strong>{act.action.toUpperCase()}</strong> on {act.entity_type}
											</div>
											<div className="activity-time">{formatDate(act.created_at)}</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
