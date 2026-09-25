import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_BADGES } from "@/lib/constants";
import { QuoteFollowUpButton } from "@/components/admin/dashboard/quote-follow-up-button";
import type { QuoteWithDetails } from "@/lib/schema";

interface QuoteAttentionCardProps {
	pendingResponse: QuoteWithDetails[];
	pendingResponseTotal: number;
	expiringSoon: QuoteWithDetails[];
	expiringSoonTotal: number;
	failed?: boolean;
}

function QuoteRow({ q, showExpiry }: { q: QuoteWithDetails; showExpiry: boolean }) {
	return (
		<tr>
			<td>
				<Link href={`/admin/quotes/${q.id}`} style={{ fontWeight: 600, color: "var(--brand-700)" }}>
					{q.quote_number}
				</Link>
			</td>
			<td>{q.customer_name}</td>
			<td style={{ fontWeight: 600 }}>{formatCurrency(q.total)}</td>
			<td style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{formatDate(q.created_at)}</td>
			{showExpiry && (
				<td style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
					{q.valid_until ? formatDate(q.valid_until) : "—"}
				</td>
			)}
			<td>
				<span className={`badge ${QUOTE_STATUS_BADGES[q.status] || "badge-neutral"}`}>
					{QUOTE_STATUS_LABELS[q.status] || q.status}
				</span>
			</td>
			<td style={{ textAlign: "right" }}>
				<div style={{ display: "inline-flex", gap: "0.375rem" }}>
					<Link href={`/admin/quotes/${q.id}`} className="btn btn-sm btn-secondary" style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}>
						View Quote
					</Link>
					<QuoteFollowUpButton quoteId={q.id} hasEmail={Boolean(q.customer_email)} />
				</div>
			</td>
		</tr>
	);
}

export function QuoteAttentionCard({
	pendingResponse,
	pendingResponseTotal,
	expiringSoon,
	expiringSoonTotal,
	failed,
}: QuoteAttentionCardProps) {
	return (
		<div className="card">
			<div className="card-header">
				<h2 className="card-title">Quote Attention</h2>
				<Link href="/admin/quotes?status=sent" style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
					View All Quotes →
				</Link>
			</div>
			<div className="card-body" style={{ padding: 0 }}>
				{failed ? (
					<div className="empty-state" style={{ padding: "2rem 1rem" }}>
						<div className="empty-state-icon">⚠️</div>
						<div className="empty-state-title">Couldn&apos;t load quote attention data</div>
						<div className="empty-state-text">Try refreshing the dashboard.</div>
					</div>
				) : pendingResponse.length === 0 && expiringSoon.length === 0 ? (
					<div className="empty-state" style={{ padding: "2rem 1rem" }}>
						<div className="empty-state-icon">📋</div>
						<div className="empty-state-title">No quotes currently require attention</div>
						<div className="empty-state-text">Sent quotes awaiting a reply or nearing expiry will appear here.</div>
					</div>
				) : (
					<>
						{expiringSoon.length > 0 && (
							<div style={{ borderBottom: pendingResponse.length > 0 ? "1px solid var(--border-default)" : "none" }}>
								<div style={{ padding: "0.75rem 1.25rem 0", fontSize: "0.75rem", fontWeight: 600, color: "var(--status-warning)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
									Expiring within 48 hours ({expiringSoonTotal})
								</div>
								<div className="table-wrap">
									<table className="table">
										<thead>
											<tr>
												<th>Quote #</th>
												<th>Client</th>
												<th>Amount</th>
												<th>Created</th>
												<th>Expires</th>
												<th>Status</th>
												<th style={{ textAlign: "right" }}>Action</th>
											</tr>
										</thead>
										<tbody>
											{expiringSoon.map((q) => (
												<QuoteRow key={q.id} q={q} showExpiry />
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{pendingResponse.length > 0 && (
							<div>
								<div style={{ padding: "0.75rem 1.25rem 0", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
									Awaiting client response, oldest first ({pendingResponseTotal})
								</div>
								<div className="table-wrap">
									<table className="table">
										<thead>
											<tr>
												<th>Quote #</th>
												<th>Client</th>
												<th>Amount</th>
												<th>Created</th>
												<th>Status</th>
												<th style={{ textAlign: "right" }}>Action</th>
											</tr>
										</thead>
										<tbody>
											{pendingResponse.map((q) => (
												<QuoteRow key={q.id} q={q} showExpiry={false} />
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
