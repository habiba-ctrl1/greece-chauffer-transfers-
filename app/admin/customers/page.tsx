import Link from "next/link";
import { getCustomers } from "@/lib/actions/customers";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Customers — Greece Chauffeur Service",
};

interface CustomersPageProps {
	searchParams: Promise<{
		search?: string;
		type?: string;
		page?: string;
	}>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
	const params = await searchParams;
	const search = params.search || "";
	const customerType = params.type || "all";
	const page = parseInt(params.page || "1", 10);

	const { customers, total, totalPages } = await getCustomers({
		search,
		customer_type: customerType,
		page,
		limit: 15,
	});

	const typeTabs = [
		{ id: "all", label: "All Customers" },
		{ id: "individual", label: "Individual" },
		{ id: "corporate", label: "Corporate" },
		{ id: "agency", label: "Travel Agency" },
	];

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Customer Directory</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						{total} client account{total === 1 ? "" : "s"} on record
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/admin/customers/new" className="btn btn-primary">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						<span>Add Customer</span>
					</Link>
				</div>
			</div>

			{/* Filter Tabs & Search Bar */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
					{/* Type Filters */}
					<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
						{typeTabs.map((tab) => {
							const isActive = customerType === tab.id;
							return (
								<Link
									key={tab.id}
									href={`/admin/customers?type=${tab.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
									className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
								>
									{tab.label}
								</Link>
							);
						})}
					</div>

					{/* Search Form */}
					<form method="GET" action="/admin/customers" style={{ display: "flex", gap: "0.5rem", minWidth: "280px" }}>
						<input type="hidden" name="type" value={customerType} />
						<input
							type="text"
							name="search"
							defaultValue={search}
							placeholder="Search by name, email, phone..."
							className="form-input"
							style={{ height: "34px", fontSize: "0.8125rem", flex: 1 }}
						/>
						<button type="submit" className="btn btn-sm btn-secondary">
							Search
						</button>
						{search && (
							<Link href={`/admin/customers?type=${customerType}`} className="btn btn-sm btn-ghost">
								Clear
							</Link>
						)}
					</form>
				</div>
			</div>

			{/* Customer Table */}
			<div className="card">
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Customer</th>
								<th>Type</th>
								<th>Contact Details</th>
								<th>Bookings</th>
								<th>Total Spent</th>
								<th>Added</th>
								<th style={{ textAlign: "right" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{customers.length === 0 ? (
								<tr>
									<td colSpan={7}>
										<div className="empty-state">
											<div className="empty-state-icon">👥</div>
											<div className="empty-state-title">No Customers Found</div>
											<div className="empty-state-text">
												{search
													? "No customer matches your search criteria. Try a different query."
													: "Get started by adding your first customer or corporate account."}
											</div>
											<Link href="/admin/customers/new" className="btn btn-sm btn-primary" style={{ marginTop: "1rem" }}>
												+ Add First Customer
											</Link>
										</div>
									</td>
								</tr>
							) : (
								customers.map((c) => (
									<tr key={c.id}>
										<td>
											<Link
												href={`/admin/customers/${c.id}`}
												style={{ fontWeight: 600, color: "var(--brand-700)" }}
											>
												{c.name}
											</Link>
											{c.company_name && (
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													{c.company_name}
												</div>
											)}
										</td>
										<td>
											<span
												className={`badge ${
													c.customer_type === "corporate"
														? "badge-info"
														: c.customer_type === "agency"
														? "badge-warning"
														: "badge-neutral"
												}`}
											>
												{c.customer_type}
											</span>
										</td>
										<td>
											<div>{c.email || "—"}</div>
											<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
												{c.phone || "—"}
											</div>
										</td>
										<td>
											<span style={{ fontWeight: 600 }}>{c.total_bookings}</span>
											<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
												{" "}({c.completed_trips} done)
											</span>
										</td>
										<td style={{ fontWeight: 600 }}>
											{formatCurrency(c.total_spent)}
										</td>
										<td style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
											{formatDate(c.created_at)}
										</td>
										<td style={{ textAlign: "right" }}>
											<div style={{ display: "inline-flex", gap: "0.375rem" }}>
												<Link
													href={`/admin/bookings/new?customer_id=${c.id}`}
													className="btn btn-sm btn-ghost"
													title="New booking for customer"
												>
													+ Book
												</Link>
												<Link
													href={`/admin/customers/${c.id}`}
													className="btn btn-sm btn-secondary"
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
									href={`/admin/customers?type=${customerType}&page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
									className="btn btn-sm btn-secondary"
								>
									Previous
								</Link>
							)}
							{page < totalPages && (
								<Link
									href={`/admin/customers?type=${customerType}&page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
