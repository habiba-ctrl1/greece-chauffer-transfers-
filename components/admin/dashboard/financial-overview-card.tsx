import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { FinancialSnapshot } from "@/lib/actions/invoices";

interface FinancialOverviewCardProps {
	financial: FinancialSnapshot;
	pendingSettlementCount: number;
	pendingSettlementAmount: number;
	failed?: boolean;
}

function FigureBlock({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
	const color =
		tone === "success" ? "var(--status-success)" :
		tone === "warning" ? "var(--status-warning)" :
		tone === "danger" ? "var(--status-danger)" :
		"var(--text-primary)";
	return (
		<div>
			<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
				{label}
			</div>
			<div style={{ fontSize: "1.375rem", fontWeight: 700, color, letterSpacing: "-0.01em" }}>{value}</div>
		</div>
	);
}

export function FinancialOverviewCard({ financial, pendingSettlementCount, pendingSettlementAmount, failed }: FinancialOverviewCardProps) {
	return (
		<div className="card">
			<div className="card-header">
				<h2 className="card-title">Financial Overview</h2>
				<Link href="/admin/invoices" style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
					View Invoices →
				</Link>
			</div>
			<div className="card-body">
				{failed ? (
					<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
						Couldn&apos;t load financial data — try refreshing.
					</div>
				) : (
					<>
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.25rem" }}>
							{financial.revenueAvailable ? (
								<FigureBlock label="Revenue (MTD)" value={formatCurrency(financial.revenueMtd)} tone="success" />
							) : (
								<div>
									<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
										Revenue (MTD)
									</div>
									<div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-tertiary)" }}>
										Revenue data unavailable
									</div>
									<div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>No payment records on file</div>
								</div>
							)}
							<FigureBlock label="Paid (Invoices)" value={formatCurrency(financial.paid)} tone="success" />
							<FigureBlock label="Outstanding" value={formatCurrency(financial.outstanding)} tone="warning" />
							<FigureBlock label="Overdue" value={formatCurrency(financial.overdue)} tone="danger" />
						</div>
						<div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-default)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
							{pendingSettlementCount > 0 ? (
								<>
									<strong style={{ color: "var(--status-warning)" }}>{pendingSettlementCount}</strong> completed
									trip{pendingSettlementCount === 1 ? "" : "s"} still pending settlement, totaling{" "}
									<strong>{formatCurrency(pendingSettlementAmount)}</strong>.
								</>
							) : (
								"No completed trips are currently pending settlement."
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
