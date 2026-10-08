import Link from "next/link";
import { getInvoices } from "@/lib/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Invoices & Financials — Greece Chauffeur Service",
};

interface InvoicesPageProps {
	searchParams: Promise<{
		status?: string;
		search?: string;
		page?: string;
	}>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
	const params = await searchParams;
	const statusFilter = params.status || "all";
	const searchQuery = params.search || "";
	const page = parseInt(params.page || "1", 10);

	const { invoices, total, totalPages } = await getInvoices({
		status: statusFilter,
		search: searchQuery,
		page,
		limit: 20,
	});

	const tabs = [
		{ id: "all", label: "All Invoices" },
		{ id: "paid", label: "Paid" },
		{ id: "sent", label: "Sent / Due" },
		{ id: "draft", label: "Drafts" },
	];

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Invoices & Billing</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
						Official tax invoices, client billing, and settlement receipts for completed transfers.
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/admin/bookings" className="btn btn-primary">
						+ Invoicing from Bookings
					</Link>
				</div>
			</div>

			{/* Status Tabs */}
			<div
				style={{
					display: "flex",
					gap: "0.5rem",
					borderBottom: "1px solid var(--border-default)",
					marginBottom: "1.5rem",
				}}
			>
				{tabs.map((t) => {
					const isActive = statusFilter === t.id;
					return (
						<Link
							key={t.id}
							href={`/admin/invoices?status=${t.id}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
							style={{
								padding: "0.75rem 1.25rem",
								textDecoration: "none",
								borderBottom: isActive ? "2px solid var(--brand-600)" : "2px solid transparent",
								color: isActive ? "var(--brand-600)" : "var(--text-secondary)",
								fontWeight: isActive ? 600 : 500,
								fontSize: "0.875rem",
							}}
						>
							{t.label}
						</Link>
					);
				})}
			</div>

			{/* Table Card */}
			<div className="card">
				<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div>
						<h3 className="card-title">Invoices Directory ({total})</h3>
						<p className="card-subtitle">Official records generated from confirmed and completed bookings.</p>
					</div>

					<form method="GET" action="/admin/invoices" style={{ display: "flex", gap: "0.5rem" }}>
						{statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
						<input
							type="text"
							name="search"
							defaultValue={searchQuery}
							placeholder="Search by invoice #, client, booking..."
							className="form-input"
							style={{ width: "260px", padding: "0.4rem 0.75rem", fontSize: "0.8125rem" }}
						/>
						<button type="submit" className="btn btn-secondary btn-sm">
							Search
						</button>
					</form>
				</div>

				<div className="card-body" style={{ padding: 0 }}>
					{invoices.length === 0 ? (
						<div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-tertiary)" }}>
							<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧾</div>
							<h4 style={{ margin: "0 0 0.25rem", color: "var(--text-primary)" }}>No invoices found</h4>
							<p style={{ margin: 0, fontSize: "0.875rem" }}>
								When a booking completes, click &quot;Generate Official Invoice&quot; on the booking page.
							</p>
						</div>
					) : (
						<table className="table">
							<thead>
								<tr>
									<th>Invoice #</th>
									<th>Client</th>
									<th>Booking Ref</th>
									<th>Date</th>
									<th>Total Amount</th>
									<th>Status</th>
									<th style={{ textAlign: "right" }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map((inv) => (
									<tr key={inv.id}>
										<td>
											<strong style={{ color: "var(--text-primary)" }}>{inv.invoice_number}</strong>
										</td>
										<td>
											<div style={{ fontWeight: 600 }}>{inv.customer_name}</div>
											{inv.customer_company && (
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													{inv.customer_company}
												</div>
											)}
										</td>
										<td>
											{inv.booking_id && inv.booking_number ? (
												<Link
													href={`/admin/bookings/${inv.booking_id}`}
													style={{ color: "var(--brand-600)", fontWeight: 500, fontSize: "0.8125rem" }}
												>
													{inv.booking_number}
												</Link>
											) : (
												<span style={{ color: "var(--text-tertiary)" }}>—</span>
											)}
										</td>
										<td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
											{formatDate(inv.created_at)}
										</td>
										<td style={{ fontWeight: 700, color: "var(--text-primary)" }}>
											{formatCurrency(inv.total)}
										</td>
										<td>
											<span
												className={`badge ${
													inv.status === "paid"
														? "badge-success"
														: inv.status === "sent"
														? "badge-info"
														: inv.status === "draft"
														? "badge-neutral"
														: "badge-danger"
												}`}
											>
												{inv.status.toUpperCase()}
											</span>
										</td>
										<td style={{ textAlign: "right" }}>
											<div style={{ display: "inline-flex", gap: "0.375rem" }}>
												<Link
													href={`/admin/invoices/${inv.id}/print`}
													target="_blank"
													className="btn btn-secondary btn-sm"
													style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
												>
													Print / PDF
												</Link>
												{inv.booking_id && (
													<Link
														href={`/admin/bookings/${inv.booking_id}`}
														className="btn btn-secondary btn-sm"
														style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
													>
														Booking
													</Link>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "1rem 1.5rem",
							borderTop: "1px solid var(--border-default)",
							fontSize: "0.875rem",
						}}
					>
						<span style={{ color: "var(--text-tertiary)" }}>
							Page {page} of {totalPages} ({total} entries)
						</span>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							{page > 1 && (
								<Link
									href={`/admin/invoices?page=${page - 1}&status=${statusFilter}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
									className="btn btn-secondary btn-sm"
								>
									Previous
								</Link>
							)}
							{page < totalPages && (
								<Link
									href={`/admin/invoices?page=${page + 1}&status=${statusFilter}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
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
