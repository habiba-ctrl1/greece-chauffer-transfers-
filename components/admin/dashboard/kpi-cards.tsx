import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface KpiCardsProps {
	todayCount: number;
	todayFailed: boolean;
	upcomingCount: number;
	upcomingHref: string;
	upcomingFailed: boolean;
	pendingQuotesCount: number;
	quotesFailed: boolean;
	activeDriversCount: number;
	driversFailed: boolean;
	revenueMtd: number;
	revenueAvailable: boolean;
	financialFailed: boolean;
}

function StatValue({ failed, children }: { failed: boolean; children: React.ReactNode }) {
	if (failed) {
		return <span style={{ fontSize: "0.9375rem", color: "var(--text-tertiary)" }}>—</span>;
	}
	return <>{children}</>;
}

export function KpiCards({
	todayCount,
	todayFailed,
	upcomingCount,
	upcomingHref,
	upcomingFailed,
	pendingQuotesCount,
	quotesFailed,
	activeDriversCount,
	driversFailed,
	revenueMtd,
	revenueAvailable,
	financialFailed,
}: KpiCardsProps) {
	return (
		<div className="dashboard-grid">
			<Link href="/admin/bookings?today=true" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
				<div className="stat-card-header">
					<span className="stat-card-label">Today&apos;s Transfers</span>
					<div className="stat-card-icon" style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}>🚖</div>
				</div>
				<div className="stat-card-value"><StatValue failed={todayFailed}>{todayCount}</StatValue></div>
				<div className="stat-card-footer">Scheduled today →</div>
			</Link>

			<Link href={upcomingHref} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
				<div className="stat-card-header">
					<span className="stat-card-label">Upcoming 7 Days</span>
					<div className="stat-card-icon" style={{ background: "var(--status-info-bg)", color: "var(--status-info)" }}>📅</div>
				</div>
				<div className="stat-card-value"><StatValue failed={upcomingFailed}>{upcomingCount}</StatValue></div>
				<div className="stat-card-footer">Next 7 days →</div>
			</Link>

			<Link href="/admin/quotes?status=sent" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
				<div className="stat-card-header">
					<span className="stat-card-label">Pending Quotes</span>
					<div className="stat-card-icon" style={{ background: "var(--status-warning-bg)", color: "var(--status-warning)" }}>📋</div>
				</div>
				<div className="stat-card-value"><StatValue failed={quotesFailed}>{pendingQuotesCount}</StatValue></div>
				<div className="stat-card-footer">Awaiting client response →</div>
			</Link>

			<Link href="/admin/drivers?status=active" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
				<div className="stat-card-header">
					<span className="stat-card-label">Active Chauffeurs</span>
					<div className="stat-card-icon" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>👤</div>
				</div>
				<div className="stat-card-value"><StatValue failed={driversFailed}>{activeDriversCount}</StatValue></div>
				<div className="stat-card-footer">Available for dispatch →</div>
			</Link>

			<div className="stat-card">
				<div className="stat-card-header">
					<span className="stat-card-label">Revenue (MTD)</span>
					<div className="stat-card-icon" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>💶</div>
				</div>
				{financialFailed ? (
					<div className="stat-card-value"><StatValue failed>{null}</StatValue></div>
				) : revenueAvailable ? (
					<div className="stat-card-value">{formatCurrency(revenueMtd)}</div>
				) : (
					<div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
						Revenue data unavailable
					</div>
				)}
				<div className="stat-card-footer">
					{revenueAvailable ? "Month-to-date, settled payments" : "No payment records on file yet"}
				</div>
			</div>
		</div>
	);
}
