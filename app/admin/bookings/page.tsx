import Link from "next/link";
import { getBookings } from "@/lib/actions/bookings";
import { formatCurrency } from "@/lib/utils";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_BADGES,
	PAYMENT_STATUS_LABELS,
	PAYMENT_STATUS_BADGES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Bookings — Greece Chauffeur Service",
};

interface BookingsPageProps {
	searchParams: Promise<{
		status?: string;
		unassigned?: string;
		today?: string;
		search?: string;
		page?: string;
	}>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
	const params = await searchParams;
	const status = params.status || "all";
	const unassigned = params.unassigned === "true";
	const todayOnly = params.today === "true";
	const search = params.search || "";
	const page = parseInt(params.page || "1", 10);

	const { bookings, total, totalPages } = await getBookings({
		status: unassigned ? undefined : status,
		unassigned,
		today_only: todayOnly,
		search,
		page,
		limit: 15,
	});

	const filterTabs = [
		{ id: "all", label: "All Bookings", href: "/admin/bookings" },
		{ id: "unassigned", label: "⚠️ Needs Chauffeur", href: "/admin/bookings?unassigned=true" },
		{ id: "today", label: "Today's Schedule", href: "/admin/bookings?today=true" },
		{ id: "confirmed", label: "Confirmed", href: "/admin/bookings?status=confirmed" },
		{ id: "driver_assigned", label: "Driver Assigned", href: "/admin/bookings?status=driver_assigned" },
		{ id: "in_progress", label: "In Progress", href: "/admin/bookings?status=in_progress" },
		{ id: "completed", label: "Completed", href: "/admin/bookings?status=completed" },
		{ id: "cancelled", label: "Cancelled", href: "/admin/bookings?status=cancelled" },
	];

	function isTabActive(tabId: string) {
		if (unassigned) return tabId === "unassigned";
		if (todayOnly) return tabId === "today";
		return status === tabId;
	}

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Chauffeur Booking Dispatch</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						{total} booking{total === 1 ? "" : "s"} found in current view
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
				</div>
			</div>

			{/* Operational Filter Tabs */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
					<div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
						{filterTabs.map((tab) => {
							const active = isTabActive(tab.id);
							return (
								<Link
									key={tab.id}
									href={`${tab.href}${search ? (tab.href.includes("?") ? `&search=${encodeURIComponent(search)}` : `?search=${encodeURIComponent(search)}`) : ""}`}
									className={`btn btn-sm ${active ? "btn-primary" : "btn-secondary"}`}
								>
									{tab.label}
								</Link>
							);
						})}
					</div>

					{/* Search Form */}
					<form method="GET" action="/admin/bookings" style={{ display: "flex", gap: "0.5rem", minWidth: "260px" }}>
						{status !== "all" && <input type="hidden" name="status" value={status} />}
						{unassigned && <input type="hidden" name="unassigned" value="true" />}
						{todayOnly && <input type="hidden" name="today" value="true" />}
						<input
							type="text"
							name="search"
							defaultValue={search}
							placeholder="Search #, customer, flight, route..."
							className="form-input"
							style={{ height: "34px", fontSize: "0.8125rem", flex: 1 }}
						/>
						<button type="submit" className="btn btn-sm btn-secondary">
							Search
						</button>
						{search && (
							<Link href="/admin/bookings" className="btn btn-sm btn-ghost">
								Clear
							</Link>
						)}
					</form>
				</div>
			</div>

			{/* Bookings Table */}
			<div className="card">
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Booking #</th>
								<th>Date & Pickup</th>
								<th>Route Coordinates</th>
								<th>Passenger & Client</th>
								<th>Chauffeur & Vehicle</th>
								<th>Status</th>
								<th>Amount</th>
								<th style={{ textAlign: "right" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{bookings.length === 0 ? (
								<tr>
									<td colSpan={8}>
										<div className="empty-state">
											<div className="empty-state-icon">🚖</div>
											<div className="empty-state-title">No Bookings Found</div>
											<div className="empty-state-text">
												{search
													? "No bookings match your search query."
													: "There are currently no bookings under this status tab."}
											</div>
											<Link href="/admin/bookings/new" className="btn btn-sm btn-primary" style={{ marginTop: "1rem" }}>
												+ Create New Booking
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
												<div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>
													{b.booking_source}
												</div>
											</td>
											<td>
												<div style={{ fontWeight: 600 }}>{b.pickup_date}</div>
												<div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
													{b.pickup_time}
												</div>
											</td>
											<td>
												<div style={{ fontWeight: 500, maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.pickup_location || ""}>
													🟢 {b.pickup_location}
												</div>
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.dropoff_location || ""}>
													🔴 {b.dropoff_location}
												</div>
												{b.flight_number && (
													<div style={{ fontSize: "0.6875rem", color: "var(--brand-600)", fontWeight: 600 }}>
														✈️ {b.airline} {b.flight_number}
													</div>
												)}
											</td>
											<td>
												<Link
													href={`/admin/customers/${b.customer_id}`}
													style={{ fontWeight: 600, color: "var(--text-primary)" }}
												>
													{b.customer_name}
												</Link>
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													{b.passenger_count} Pax • {b.customer_phone || "No phone"}
												</div>
											</td>
											<td>
												{b.driver_name ? (
													<div>
														<div style={{ fontWeight: 500 }}>{b.driver_name}</div>
														<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
															{b.vehicle_model || b.vehicle_category || "Vehicle assigned"}
														</div>
													</div>
												) : (
													<span
														className="badge badge-warning"
														style={{ fontSize: "0.6875rem" }}
													>
														⚠️ Unassigned
													</span>
												)}
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
											<td style={{ fontWeight: 600 }}>
												{formatCurrency(b.total)}
											</td>
											<td style={{ textAlign: "right" }}>
												<Link
													href={`/admin/bookings/${b.id}`}
													className="btn btn-sm btn-secondary"
												>
													Dispatch
												</Link>
											</td>
										</tr>
									))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div
						style={{
							padding: "1rem 1.25rem",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							borderTop: "1px solid var(--border-default)",
						}}
					>
						<span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
							Page {page} of {totalPages}
						</span>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							{page > 1 && (
								<Link
									href={`/admin/bookings?page=${page - 1}${status !== "all" ? `&status=${status}` : ""}${unassigned ? "&unassigned=true" : ""}${todayOnly ? "&today=true" : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
									className="btn btn-sm btn-secondary"
								>
									Previous
								</Link>
							)}
							{page < totalPages && (
								<Link
									href={`/admin/bookings?page=${page + 1}${status !== "all" ? `&status=${status}` : ""}${unassigned ? "&unassigned=true" : ""}${todayOnly ? "&today=true" : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
									className="btn btn-sm btn-secondary"
								>
									Next
								</Link>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
