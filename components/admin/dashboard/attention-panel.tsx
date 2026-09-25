import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { BookingWithDetails, QuoteWithDetails } from "@/lib/schema";
import type { OperationalConflict, PendingSettlementBooking } from "@/lib/actions/bookings";

type Severity = "critical" | "warning" | "info";

const SEVERITY_STYLE: Record<Severity, { bg: string; fg: string; icon: string }> = {
	critical: { bg: "var(--status-danger-bg)", fg: "var(--status-danger)", icon: "⛔" },
	warning: { bg: "var(--status-warning-bg)", fg: "var(--status-warning)", icon: "⚠️" },
	info: { bg: "var(--status-info-bg)", fg: "var(--status-info)", icon: "ℹ️" },
};

interface SampleLink {
	label: string;
	href: string;
}

interface AlertRow {
	key: string;
	severity: Severity;
	text: string;
	cta?: { label: string; href: string };
	samples?: SampleLink[];
	moreCount?: number;
}

interface AttentionPanelProps {
	unassignedRows: BookingWithDetails[];
	vehicleMissingRows: BookingWithDetails[];
	driverUnconfirmedRows: BookingWithDetails[];
	pendingSettlement: PendingSettlementBooking[];
	quoteExpiringSoon: QuoteWithDetails[];
	quoteExpiringSoonTotal: number;
	conflicts: OperationalConflict[];
	scheduleFailed: boolean;
	conflictsFailed: boolean;
	quotesFailed: boolean;
	pendingSettlementFailed: boolean;
}

function toBookingSamples(rows: BookingWithDetails[]): SampleLink[] {
	return rows.slice(0, 3).map((b) => ({ label: b.booking_number, href: `/admin/bookings/${b.id}` }));
}

/**
 * Single triaged "needs attention" queue combining the spec's Attention
 * Required alerts and Operational Conflicts into one zone, since both are
 * Priority 1 (urgent, act-now) information and a dispatcher shouldn't have
 * to check two separate cards to know if today is clean. Conflict rows are
 * still clearly labelled as conflicts.
 */
export function AttentionPanel({
	unassignedRows,
	vehicleMissingRows,
	driverUnconfirmedRows,
	pendingSettlement,
	quoteExpiringSoon,
	quoteExpiringSoonTotal,
	conflicts,
	scheduleFailed,
	conflictsFailed,
	quotesFailed,
	pendingSettlementFailed,
}: AttentionPanelProps) {
	const rows: AlertRow[] = [];

	if (!scheduleFailed) {
		if (unassignedRows.length > 0) {
			rows.push({
				key: "unassigned",
				severity: "critical",
				text: `${unassignedRows.length} confirmed booking${unassignedRows.length === 1 ? "" : "s"} in the next 7 days ${unassignedRows.length === 1 ? "has" : "have"} no driver assigned.`,
				cta: { label: "View Bookings", href: "/admin/bookings?unassigned=true" },
				samples: toBookingSamples(unassignedRows),
			});
		}
		if (vehicleMissingRows.length > 0) {
			rows.push({
				key: "vehicle-missing",
				severity: "warning",
				text: `${vehicleMissingRows.length} upcoming booking${vehicleMissingRows.length === 1 ? " has" : "s have"} a driver but no vehicle assigned.`,
				samples: toBookingSamples(vehicleMissingRows),
			});
		}
		if (driverUnconfirmedRows.length > 0) {
			rows.push({
				key: "driver-unconfirmed",
				severity: "warning",
				text: `${driverUnconfirmedRows.length} booking${driverUnconfirmedRows.length === 1 ? "" : "s"} start${driverUnconfirmedRows.length === 1 ? "s" : ""} today and the assigned driver hasn't confirmed yet.`,
				samples: toBookingSamples(driverUnconfirmedRows),
			});
		}
	}

	if (!pendingSettlementFailed && pendingSettlement.length > 0) {
		const sum = pendingSettlement.reduce((s, b) => s + b.total, 0);
		rows.push({
			key: "payment-pending",
			severity: "warning",
			text: `${pendingSettlement.length} completed booking${pendingSettlement.length === 1 ? " has" : "s have"} outstanding payment totaling ${formatCurrency(sum)}.`,
			samples: pendingSettlement.slice(0, 3).map((b) => ({ label: b.booking_number, href: `/admin/bookings/${b.id}` })),
		});
	}

	if (!quotesFailed && quoteExpiringSoonTotal > 0) {
		rows.push({
			key: "quotes-expiring",
			severity: "info",
			text: `${quoteExpiringSoonTotal} quote${quoteExpiringSoonTotal === 1 ? "" : "s"} expire${quoteExpiringSoonTotal === 1 ? "s" : ""} within 48 hours.`,
			cta: { label: "View Quotes", href: "/admin/quotes?status=sent" },
			samples: quoteExpiringSoon.slice(0, 3).map((q) => ({ label: q.quote_number, href: `/admin/quotes/${q.id}` })),
		});
	}

	if (!conflictsFailed) {
		const shown = conflicts.slice(0, 4);
		for (const c of shown) {
			rows.push({
				key: `conflict-${c.resourceType}-${c.bookingAId}-${c.bookingBId}`,
				severity: "critical",
				text: `Operational conflict: ${c.resourceType === "driver" ? "Driver" : "Vehicle"} "${c.resourceName}" is assigned to two bookings at the same pickup time (${c.pickupDate} ${c.pickupTime || ""}).`,
				cta: { label: "Review Booking", href: `/admin/bookings/${c.bookingAId}` },
				samples: [
					{ label: c.bookingANumber, href: `/admin/bookings/${c.bookingAId}` },
					{ label: c.bookingBNumber, href: `/admin/bookings/${c.bookingBId}` },
				],
			});
		}
		if (conflicts.length > shown.length) {
			rows.push({
				key: "conflicts-more",
				severity: "critical",
				text: `${conflicts.length - shown.length} additional scheduling conflict${conflicts.length - shown.length === 1 ? "" : "s"} detected.`,
			});
		}
	}

	const anyFailed = scheduleFailed || conflictsFailed || quotesFailed || pendingSettlementFailed;

	return (
		<div className="card" style={{ marginBottom: "1.5rem" }}>
			<div className="card-header">
				<h2 className="card-title">Attention Required</h2>
			</div>
			<div className="card-body" style={{ padding: rows.length ? "0.75rem" : "1.25rem" }}>
				{rows.length === 0 ? (
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.25rem" }}>
						<span style={{ fontSize: "1.25rem" }}>✅</span>
						<div>
							<strong style={{ color: "var(--status-success)" }}>All operations are currently on track.</strong>
							<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
								No unassigned bookings, missing vehicles, expiring quotes, unsettled payments, or scheduling conflicts detected.
							</div>
						</div>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
						{rows.map((row) => {
							const style = SEVERITY_STYLE[row.severity];
							return (
								<div
									key={row.key}
									style={{
										background: style.bg,
										border: "1px solid rgba(0,0,0,0.04)",
										borderRadius: "var(--radius-md)",
										padding: "0.75rem 1rem",
										display: "flex",
										alignItems: "flex-start",
										justifyContent: "space-between",
										gap: "1rem",
										flexWrap: "wrap",
									}}
								>
									<div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", flex: 1, minWidth: "240px" }}>
										<span style={{ fontSize: "1.05rem" }} aria-hidden="true">{style.icon}</span>
										<div>
											<div style={{ color: style.fg, fontWeight: 600, fontSize: "0.8125rem" }}>{row.text}</div>
											{row.samples && row.samples.length > 0 && (
												<div style={{ marginTop: "0.3rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
													{row.samples.map((s) => (
														<Link
															key={s.href}
															href={s.href}
															style={{ fontSize: "0.6875rem", color: style.fg, textDecoration: "underline" }}
														>
															{s.label}
														</Link>
													))}
												</div>
											)}
										</div>
									</div>
									{row.cta && (
										<Link href={row.cta.href} className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
											{row.cta.label}
										</Link>
									)}
								</div>
							);
						})}
					</div>
				)}
				{anyFailed && (
					<div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
						Some operational checks couldn&apos;t be loaded and are excluded from this list — try refreshing.
					</div>
				)}
			</div>
		</div>
	);
}
