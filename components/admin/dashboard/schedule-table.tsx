import Link from "next/link";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_BADGES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { BookingWithDetails } from "@/lib/schema";

const LIVE_STATUSES = new Set(["cancelled", "declined", "completed", "no_show"]);

interface ScheduleTableProps {
	rows: BookingWithDetails[];
	/** "today" hides the Date column (time-only); "upcoming" shows it. */
	mode: "today" | "upcoming";
	failed?: boolean;
	emptyTitle: string;
	emptyText: string;
}

/**
 * Operational schedule table shared by "Today's Operations" and
 * "Upcoming Transfers" — same row shape, one extra Date column for the
 * upcoming view. Driver and vehicle are surfaced as two independent
 * readiness signals rather than one combined "assigned" flag, since a
 * booking can have a driver with no vehicle (or vice versa) and that
 * distinction is exactly what dispatch needs to see at a glance.
 *
 * Row actions deep-link into the existing booking detail page, where the
 * real assignment/status controls already live — this intentionally does
 * not duplicate that logic inline in a dashboard table.
 */
export function ScheduleTable({ rows, mode, failed, emptyTitle, emptyText }: ScheduleTableProps) {
	if (failed) {
		return (
			<div className="empty-state" style={{ padding: "2rem 1rem" }}>
				<div className="empty-state-icon">⚠️</div>
				<div className="empty-state-title">Couldn&apos;t load this schedule</div>
				<div className="empty-state-text">
					A database query failed. Other dashboard sections are unaffected — try refreshing.
				</div>
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<div className="empty-state" style={{ padding: "2rem 1rem" }}>
				<div className="empty-state-icon">🗓️</div>
				<div className="empty-state-title">{emptyTitle}</div>
				<div className="empty-state-text">{emptyText}</div>
			</div>
		);
	}

	return (
		<div className="table-wrap">
			<table className="table">
				<thead>
					<tr>
						{mode === "upcoming" && <th>Date</th>}
						<th>Time</th>
						<th>Booking</th>
						<th>Client</th>
						<th>Pickup</th>
						<th>Drop-off</th>
						<th>Driver</th>
						<th>Vehicle</th>
						<th>Status</th>
						<th style={{ textAlign: "right" }}>Action</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((b) => {
						const isLive = !LIVE_STATUSES.has(b.status);
						const needsDriver = isLive && !b.driver_name;
						const needsVehicle = isLive && b.driver_name && !b.vehicle_make;

						return (
							<tr key={b.id}>
								{mode === "upcoming" && (
									<td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
										{b.pickup_date ? formatDate(b.pickup_date) : "—"}
									</td>
								)}
								<td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{b.pickup_time || "—"}</td>
								<td>
									<Link href={`/admin/bookings/${b.id}`} style={{ fontWeight: 600, color: "var(--brand-700)" }}>
										{b.booking_number}
									</Link>
								</td>
								<td>{b.customer_name}</td>
								<td style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.pickup_location || ""}>
									{b.pickup_location || "—"}
								</td>
								<td style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.dropoff_location || ""}>
									{b.dropoff_location || "—"}
								</td>
								<td>
									{b.driver_name ? (
										<span style={{ color: "var(--status-success)", fontWeight: 500, whiteSpace: "nowrap" }}>
											✓ {b.driver_name}
										</span>
									) : needsDriver ? (
										<span className="badge badge-danger">Driver Required</span>
									) : (
										<span style={{ color: "var(--text-tertiary)" }}>—</span>
									)}
								</td>
								<td>
									{b.vehicle_make ? (
										<span style={{ color: "var(--status-success)", fontWeight: 500, whiteSpace: "nowrap" }}>
											✓ {b.vehicle_make} {b.vehicle_model}
										</span>
									) : needsVehicle ? (
										<span className="badge badge-warning">Vehicle Required</span>
									) : (
										<span style={{ color: "var(--text-tertiary)" }}>—</span>
									)}
								</td>
								<td>
									<span className={`badge ${BOOKING_STATUS_BADGES[b.status] || "badge-neutral"}`}>
										{BOOKING_STATUS_LABELS[b.status] || b.status}
									</span>
								</td>
								<td style={{ textAlign: "right" }}>
									<Link
										href={`/admin/bookings/${b.id}`}
										className="btn btn-sm btn-secondary"
									>
										{needsDriver ? "Assign Driver" : needsVehicle ? "Assign Vehicle" : "View"}
									</Link>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
