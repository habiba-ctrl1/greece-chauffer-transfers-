import Link from "next/link";
import { operationalDate, formatDate } from "@/lib/utils";
import { BOOKING_STATUSES, DRIVER_STATUSES, VEHICLE_STATUSES } from "@/lib/constants";
import {
	getScheduleBookings,
	getBookingPipelineCounts,
	getOperationalConflicts,
	getPendingSettlementBookings,
} from "@/lib/actions/bookings";
import { getQuoteAttention } from "@/lib/actions/quotes";
import { getFleetDriverSummary } from "@/lib/actions/drivers";
import { getVehicleFleetSummary } from "@/lib/actions/vehicles";
import { getFinancialSnapshot } from "@/lib/actions/invoices";
import { getRecentActivityFeed } from "@/lib/actions/activity";
import { RefreshButton } from "@/components/admin/dashboard/refresh-button";
import { AttentionPanel } from "@/components/admin/dashboard/attention-panel";
import { KpiCards } from "@/components/admin/dashboard/kpi-cards";
import { ScheduleTable } from "@/components/admin/dashboard/schedule-table";
import { PipelineStrip } from "@/components/admin/dashboard/pipeline-strip";
import { QuoteAttentionCard } from "@/components/admin/dashboard/quote-attention-card";
import { FleetStatusCard } from "@/components/admin/dashboard/fleet-status-card";
import { FinancialOverviewCard } from "@/components/admin/dashboard/financial-overview-card";
import { ActivityFeedCard } from "@/components/admin/dashboard/activity-feed-card";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Dashboard — Greece Chauffeur Operations",
};

const LIVE_EXCLUDED_STATUSES = new Set(["cancelled", "declined", "completed", "no_show"]);

function zeroed<T extends string>(keys: readonly T[]): Record<T, number> {
	return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
}

async function getDashboardData() {
	const today = operationalDate(0);
	const weekEnd = operationalDate(7);

	const [
		scheduleRes,
		pipelineRes,
		conflictsRes,
		quoteAttentionRes,
		fleetDriversRes,
		fleetVehiclesRes,
		financialRes,
		pendingSettlementRes,
		activityRes,
	] = await Promise.allSettled([
		getScheduleBookings(today, weekEnd, 100),
		getBookingPipelineCounts(),
		getOperationalConflicts(10),
		getQuoteAttention(5),
		getFleetDriverSummary(),
		getVehicleFleetSummary(),
		getFinancialSnapshot(),
		getPendingSettlementBookings(50),
		getRecentActivityFeed(8),
	]);

	// Log rejections so a failed query is visible in server logs without
	// crashing the page — each section below renders its own inline
	// error/empty state instead of an unhandled exception.
	for (const [label, res] of [
		["schedule", scheduleRes],
		["pipeline", pipelineRes],
		["conflicts", conflictsRes],
		["quoteAttention", quoteAttentionRes],
		["fleetDrivers", fleetDriversRes],
		["fleetVehicles", fleetVehiclesRes],
		["financial", financialRes],
		["pendingSettlement", pendingSettlementRes],
		["activity", activityRes],
	] as const) {
		if (res.status === "rejected") {
			console.error(`Dashboard section "${label}" failed:`, res.reason);
		}
	}

	const schedule = scheduleRes.status === "fulfilled" ? scheduleRes.value : [];
	const scheduleFailed = scheduleRes.status === "rejected";

	const pipeline = pipelineRes.status === "fulfilled" ? pipelineRes.value : zeroed(BOOKING_STATUSES);
	const pipelineFailed = pipelineRes.status === "rejected";

	const conflicts = conflictsRes.status === "fulfilled" ? conflictsRes.value : [];
	const conflictsFailed = conflictsRes.status === "rejected";

	const quoteAttention =
		quoteAttentionRes.status === "fulfilled"
			? quoteAttentionRes.value
			: { pendingResponse: [], pendingResponseTotal: 0, expiringSoon: [], expiringSoonTotal: 0 };
	const quoteAttentionFailed = quoteAttentionRes.status === "rejected";

	const fleetDrivers =
		fleetDriversRes.status === "fulfilled"
			? fleetDriversRes.value
			: { byStatus: zeroed(DRIVER_STATUSES), licenseExpiring: [] };
	const fleetDriversFailed = fleetDriversRes.status === "rejected";

	const fleetVehicles =
		fleetVehiclesRes.status === "fulfilled"
			? fleetVehiclesRes.value
			: { byStatus: zeroed(VEHICLE_STATUSES), total: 0 };
	const fleetVehiclesFailed = fleetVehiclesRes.status === "rejected";

	const financial =
		financialRes.status === "fulfilled"
			? financialRes.value
			: { revenueMtd: 0, revenueAvailable: false, paid: 0, outstanding: 0, overdue: 0 };
	const financialFailed = financialRes.status === "rejected";

	const pendingSettlement = pendingSettlementRes.status === "fulfilled" ? pendingSettlementRes.value : [];
	const pendingSettlementFailed = pendingSettlementRes.status === "rejected";

	const activity = activityRes.status === "fulfilled" ? activityRes.value : [];
	const activityFailed = activityRes.status === "rejected";

	// Derived, in-memory slices of the one schedule query — keeps this to a
	// single joined booking query for Today + Upcoming + three of the
	// Attention Required signals, rather than issuing several near-duplicate
	// queries for the same 7-day window.
	const todayRows = schedule.filter((b) => b.pickup_date === today);
	const upcomingRows = schedule.filter((b) => b.pickup_date && b.pickup_date > today);
	const unassignedRows = schedule.filter(
		(b) => !b.driver_name && (b.status === "confirmed" || b.status === "awaiting_confirmation")
	);
	const vehicleMissingRows = schedule.filter(
		(b) => b.driver_name && !b.vehicle_make && !LIVE_EXCLUDED_STATUSES.has(b.status)
	);
	const driverUnconfirmedRows = todayRows.filter((b) => b.status === "driver_assigned");

	return {
		today,
		weekEnd,
		todayRows,
		upcomingRows,
		scheduleFailed,
		pipeline,
		pipelineFailed,
		conflicts,
		conflictsFailed,
		quoteAttention,
		quoteAttentionFailed,
		fleetDrivers,
		fleetDriversFailed,
		fleetVehicles,
		fleetVehiclesFailed,
		financial,
		financialFailed,
		pendingSettlement,
		pendingSettlementFailed,
		activity,
		activityFailed,
		unassignedRows,
		vehicleMissingRows,
		driverUnconfirmedRows,
	};
}

export default async function DashboardPage() {
	const data = await getDashboardData();
	const upcomingHref = `/admin/bookings?from=${operationalDate(1)}&to=${operationalDate(7)}`;
	const pendingSettlementAmount = data.pendingSettlement.reduce((sum, b) => sum + b.total, 0);

	return (
		<div>
			{/* Header */}
			<div className="page-header">
				<div>
					<h1>Dashboard</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						Overview of today&apos;s operations, upcoming transfers, bookings and financial activity.
					</p>
				</div>
				<div className="page-header-actions" style={{ alignItems: "center" }}>
					<span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
						{formatDate(data.today)}
					</span>
					<RefreshButton />
					<Link href="/admin/bookings/new" className="btn btn-primary">
						+ New Booking
					</Link>
					<Link href="/admin/quotes/new" className="btn btn-secondary">
						+ New Quote
					</Link>
				</div>
			</div>

			{/* Priority 1 — urgent operational issues */}
			<AttentionPanel
				unassignedRows={data.unassignedRows}
				vehicleMissingRows={data.vehicleMissingRows}
				driverUnconfirmedRows={data.driverUnconfirmedRows}
				pendingSettlement={data.pendingSettlement}
				quoteExpiringSoon={data.quoteAttention.expiringSoon}
				quoteExpiringSoonTotal={data.quoteAttention.expiringSoonTotal}
				conflicts={data.conflicts}
				scheduleFailed={data.scheduleFailed}
				conflictsFailed={data.conflictsFailed}
				quotesFailed={data.quoteAttentionFailed}
				pendingSettlementFailed={data.pendingSettlementFailed}
			/>

			{/* KPI strip */}
			<KpiCards
				todayCount={data.todayRows.length}
				todayFailed={data.scheduleFailed}
				upcomingCount={data.upcomingRows.length}
				upcomingHref={upcomingHref}
				upcomingFailed={data.scheduleFailed}
				pendingQuotesCount={data.quoteAttention.pendingResponseTotal}
				quotesFailed={data.quoteAttentionFailed}
				activeDriversCount={data.fleetDrivers.byStatus.active ?? 0}
				driversFailed={data.fleetDriversFailed}
				revenueMtd={data.financial.revenueMtd}
				revenueAvailable={data.financial.revenueAvailable}
				financialFailed={data.financialFailed}
			/>

			{/* Priority 2 — today's operations */}
			<div className="card" style={{ marginTop: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Today&apos;s Operations</h2>
					<Link href="/admin/bookings?today=true" style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
						View All Today&apos;s Bookings →
					</Link>
				</div>
				<div className="card-body card-body-flush">
					<ScheduleTable
						rows={data.todayRows}
						mode="today"
						failed={data.scheduleFailed}
						emptyTitle="No transfers scheduled for today."
						emptyText="When bookings are scheduled for today, they'll appear here with pickup times, driver and vehicle assignment, and status."
					/>
				</div>
			</div>

			{/* Priority 3 — upcoming operations */}
			<div className="card" style={{ marginTop: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Upcoming Transfers</h2>
					<Link href={upcomingHref} style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
						View All Upcoming Bookings →
					</Link>
				</div>
				<div className="card-body card-body-flush">
					<ScheduleTable
						rows={data.upcomingRows}
						mode="upcoming"
						failed={data.scheduleFailed}
						emptyTitle="No upcoming transfers in the next 7 days."
						emptyText="Bookings scheduled for the next week will appear here."
					/>
				</div>
			</div>

			{/* Priority 4 — booking/quote pipeline */}
			<div className="card" style={{ marginTop: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Booking Pipeline</h2>
				</div>
				<div className="card-body">
					<PipelineStrip counts={data.pipeline} failed={data.pipelineFailed} />
				</div>
			</div>

			<div style={{ marginTop: "1.5rem" }}>
				<QuoteAttentionCard
					pendingResponse={data.quoteAttention.pendingResponse}
					pendingResponseTotal={data.quoteAttention.pendingResponseTotal}
					expiringSoon={data.quoteAttention.expiringSoon}
					expiringSoonTotal={data.quoteAttention.expiringSoonTotal}
					failed={data.quoteAttentionFailed}
				/>
			</div>

			{/* Priority 5 — fleet and financial overview */}
			<div className="dashboard-sections" style={{ marginTop: "1.5rem" }}>
				<FleetStatusCard
					driverByStatus={data.fleetDrivers.byStatus}
					licenseExpiring={data.fleetDrivers.licenseExpiring}
					vehicleByStatus={data.fleetVehicles.byStatus}
					vehicleTotal={data.fleetVehicles.total}
					driversFailed={data.fleetDriversFailed}
					vehiclesFailed={data.fleetVehiclesFailed}
				/>
				<FinancialOverviewCard
					financial={data.financial}
					pendingSettlementCount={data.pendingSettlement.length}
					pendingSettlementAmount={pendingSettlementAmount}
					failed={data.financialFailed}
				/>
			</div>

			{/* Quick Actions — every link verified to point at a real route */}
			<div className="card" style={{ marginTop: "1.5rem" }}>
				<div className="card-header">
					<h2 className="card-title">Quick Actions</h2>
				</div>
				<div className="card-body">
					<div className="quick-actions" style={{ marginBottom: 0 }}>
						<Link href="/admin/bookings/new" className="btn btn-secondary">+ New Booking</Link>
						<Link href="/admin/quotes/new" className="btn btn-secondary">+ New Quote</Link>
						<Link href="/admin/bookings?today=true" className="btn btn-secondary">Today&apos;s Transfers</Link>
						<Link href={upcomingHref} className="btn btn-secondary">Upcoming Transfers</Link>
						<Link href="/admin/drivers" className="btn btn-secondary">Manage Drivers</Link>
						<Link href="/admin/customers/new" className="btn btn-secondary">+ Add Customer</Link>
					</div>
				</div>
			</div>

			{/* Priority 6 — recent activity */}
			<div style={{ marginTop: "1.5rem" }}>
				<ActivityFeedCard activity={data.activity} failed={data.activityFailed} />
			</div>
		</div>
	);
}
