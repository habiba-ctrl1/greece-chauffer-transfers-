import Link from "next/link";
import { getQuotes } from "@/lib/actions/quotes";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_BADGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Quotes & Inquiries — Greece Chauffeur Service",
};

interface QuotesPageProps {
	searchParams: Promise<{
		status?: string;
		search?: string;
		page?: string;
	}>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
	const params = await searchParams;
	const status = params.status || "all";
	const search = params.search || "";
	const page = parseInt(params.page || "1", 10);

	const { quotes, total, totalPages } = await getQuotes({
		status,
		search,
		page,
		limit: 15,
	});

	const filterTabs = [
		{ id: "all", label: "All Quotes", href: "/admin/quotes" },
		{ id: "sent", label: "Sent / In Review", href: "/admin/quotes?status=sent" },
		{ id: "draft", label: "Drafts", href: "/admin/quotes?status=draft" },
		{ id: "accepted", label: "Accepted / Converted", href: "/admin/quotes?status=accepted" },
		{ id: "closed", label: "Closed / Expired", href: "/admin/quotes?status=closed" },
	];

	function isTabActive(tabId: string) {
		return status === tabId;
	}

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Quotations & Inquiries</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						{total} quotation{total === 1 ? "" : "s"} found in current view
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/admin/quotes/new" className="btn btn-primary">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						+ New Quote
					</Link>
				</div>
			</div>

			{/* Filter Tabs */}
			<div className="table-tabs" style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
				{filterTabs.map((tab) => (
					<Link
						key={tab.id}
						href={tab.href}
						className={`table-tab ${isTabActive(tab.id) ? "active" : ""}`}
					>
						{tab.label}
					</Link>
				))}
			</div>

			{/* Search Controls */}
			<div className="card" style={{ marginBottom: "1.25rem", padding: "1rem" }}>
				<form method="GET" action="/admin/quotes" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
					{status !== "all" && <input type="hidden" name="status" value={status} />}
					<div style={{ flex: 1, position: "relative" }}>
						<input
							type="text"
							name="search"
							defaultValue={search}
							placeholder="Search by quote #, client name, email, pickup or dropoff..."
							className="form-input"
						/>
					</div>
					<button type="submit" className="btn btn-secondary">
						Search
					</button>
					{search && (
						<Link href={`/admin/quotes${status !== "all" ? `?status=${status}` : ""}`} className="btn btn-secondary">
							Clear
						</Link>
					)}
				</form>
			</div>

			{/* Quotes Table */}
			<div className="card">
				<div className="table-container">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Quote #</th>
								<th>Client / Passenger</th>
								<th>Service Date & Time</th>
								<th>Route Itinerary</th>
								<th>Vehicle Class</th>
								<th>Total Amount</th>
								<th>Valid Until</th>
								<th>Status</th>
								<th style={{ textAlign: "right" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{quotes.length === 0 ? (
								<tr>
									<td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
										No quotations found matching your criteria.
										<div style={{ marginTop: "1rem" }}>
											<Link href="/admin/quotes/new" className="btn btn-secondary btn-sm">
												Create First Quote
											</Link>
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
												<div style={{ fontSize: "0.6875rem", color: "#22c55e", marginTop: "2px" }}>
													↳ Converted: {q.converted_booking_number}
												</div>
											)}
										</td>
										<td>
											<div style={{ fontWeight: 500 }}>{q.customer_name}</div>
											<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
												{q.customer_phone || q.customer_email || "No direct contact"}
											</div>
										</td>
										<td>
											<div style={{ fontWeight: 500 }}>{q.pickup_date ? formatDate(q.pickup_date) : "—"}</div>
											<div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
												{q.pickup_time || "TBD"}
											</div>
										</td>
										<td style={{ maxWidth: "240px" }}>
											<div style={{ fontSize: "0.8125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
												<span style={{ color: "var(--text-muted)" }}>From:</span> {q.pickup_location || "—"}
											</div>
											<div style={{ fontSize: "0.8125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
												<span style={{ color: "var(--text-muted)" }}>To:</span> {q.dropoff_location || "—"}
											</div>
										</td>
										<td>
											<span style={{ textTransform: "capitalize", fontSize: "0.8125rem", fontWeight: 500 }}>
												{q.vehicle_category || "Sedan"}
											</span>
										</td>
										<td style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
											{formatCurrency(q.total)}
										</td>
										<td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
											{q.valid_until ? formatDate(q.valid_until) : "—"}
										</td>
										<td>
											<span className={`badge ${QUOTE_STATUS_BADGES[q.status] || "badge-neutral"}`}>
												{QUOTE_STATUS_LABELS[q.status] || q.status}
											</span>
										</td>
										<td style={{ textAlign: "right" }}>
											<div style={{ display: "inline-flex", gap: "0.5rem" }}>
												<Link
													href={`/admin/quotes/${q.id}`}
													className="btn btn-secondary btn-sm"
												>
													View
												</Link>
											</div>
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
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "1rem 1.5rem",
							borderTop: "1px solid var(--border-color)",
						}}
					>
						<span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
							Page {page} of {totalPages} ({total} items)
						</span>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							{page > 1 && (
								<Link
									href={`/admin/quotes?page=${page - 1}${status !== "all" ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
									className="btn btn-secondary btn-sm"
								>
									Previous
								</Link>
							)}
							{page < totalPages && (
								<Link
									href={`/admin/quotes?page=${page + 1}${status !== "all" ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
									className="btn btn-secondary btn-sm"
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
