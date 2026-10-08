import Link from "next/link";
import { getDrivers } from "@/lib/actions/drivers";
import { DRIVER_STATUS_LABELS, DRIVER_STATUS_BADGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Drivers — Greece Chauffeur Service",
};

interface DriversPageProps {
	searchParams: Promise<{
		search?: string;
		status?: string;
		page?: string;
	}>;
}

export default async function DriversPage({ searchParams }: DriversPageProps) {
	const params = await searchParams;
	const search = params.search || "";
	const status = params.status || "all";
	const page = parseInt(params.page || "1", 10);

	const { drivers, total, totalPages } = await getDrivers({
		search,
		status,
		page,
		limit: 15,
	});

	const statusTabs = [
		{ id: "all", label: "All Drivers" },
		{ id: "active", label: "Active" },
		{ id: "pending", label: "Pending" },
		{ id: "under_review", label: "Under Review" },
		{ id: "suspended", label: "Suspended" },
	];

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Drivers</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						{total} driver{total === 1 ? "" : "s"} on record
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/admin/drivers/new" className="btn btn-primary">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						<span>Add Driver</span>
					</Link>
				</div>
			</div>

			{/* Filter Tabs & Search */}
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
					<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
						{statusTabs.map((tab) => {
							const isActive = status === tab.id;
							return (
								<Link
									key={tab.id}
									href={`/admin/drivers?status=${tab.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
									className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
								>
									{tab.label}
								</Link>
							);
						})}
					</div>

					<form method="GET" action="/admin/drivers" style={{ display: "flex", gap: "0.5rem", minWidth: "260px" }}>
						<input type="hidden" name="status" value={status} />
						<input
							type="text"
							name="search"
							defaultValue={search}
							placeholder="Search by name, phone, license..."
							className="form-input"
							style={{ height: "34px", fontSize: "0.8125rem", flex: 1 }}
						/>
						<button type="submit" className="btn btn-sm btn-secondary">
							Search
						</button>
						{search && (
							<Link href={`/admin/drivers?status=${status}`} className="btn btn-sm btn-ghost">
								Clear
							</Link>
						)}
					</form>
				</div>
			</div>

			{/* Driver Table */}
			<div className="card">
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Driver</th>
								<th>Type</th>
								<th>Contact</th>
								<th>License</th>
								<th>Trips</th>
								<th>Status</th>
								<th style={{ textAlign: "right" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{drivers.length === 0 ? (
								<tr>
									<td colSpan={7}>
										<div className="empty-state">
											<div className="empty-state-icon">🧑‍✈️</div>
											<div className="empty-state-title">No Drivers Found</div>
											<div className="empty-state-text">
												{search
													? "No driver matches your search criteria."
													: "Add your first driver to start assigning them to bookings."}
											</div>
											<Link href="/admin/drivers/new" className="btn btn-sm btn-primary" style={{ marginTop: "1rem" }}>
												+ Add First Driver
											</Link>
										</div>
									</td>
								</tr>
							) : (
								drivers.map((d) => (
									<tr key={d.id}>
										<td>
											<Link
												href={`/admin/drivers/${d.id}`}
												style={{ fontWeight: 600, color: "var(--brand-700)" }}
											>
												{d.name}
											</Link>
										</td>
										<td style={{ textTransform: "capitalize" }}>{d.driver_type}</td>
										<td>
											<div>{d.phone || "—"}</div>
											<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
												{d.email || "—"}
											</div>
										</td>
										<td>
											<div>{d.license_number || "—"}</div>
											{d.license_expiry && (
												<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
													Expires {d.license_expiry}
												</div>
											)}
										</td>
										<td>
											<span style={{ fontWeight: 600 }}>{d.total_trips}</span>
											<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
												{" "}({d.completed_trips} done)
											</span>
										</td>
										<td>
											<span className={`badge ${DRIVER_STATUS_BADGES[d.status] || "badge-neutral"}`}>
												{DRIVER_STATUS_LABELS[d.status] || d.status}
											</span>
										</td>
										<td style={{ textAlign: "right" }}>
											<Link href={`/admin/drivers/${d.id}`} className="btn btn-sm btn-secondary">
												View
											</Link>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

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
									href={`/admin/drivers?status=${status}&page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
									className="btn btn-sm btn-secondary"
								>
									Previous
								</Link>
							)}
							{page < totalPages && (
								<Link
									href={`/admin/drivers?status=${status}&page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
