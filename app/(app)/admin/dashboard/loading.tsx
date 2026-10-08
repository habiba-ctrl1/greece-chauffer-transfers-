/**
 * Next.js App Router shows this automatically while the server-rendered
 * dashboard page (page.tsx, force-dynamic) is fetching — no client-side
 * fetching or spinner logic needed for a page that's already server-rendered.
 */
export default function DashboardLoading() {
	return (
		<div aria-busy="true" aria-live="polite">
			<div className="page-header">
				<div>
					<div className="skeleton" style={{ width: "160px", height: "1.5rem", marginBottom: "0.5rem" }} />
					<div className="skeleton" style={{ width: "320px", height: "0.875rem" }} />
				</div>
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<div className="skeleton" style={{ width: "90px", height: "34px" }} />
					<div className="skeleton" style={{ width: "120px", height: "34px" }} />
				</div>
			</div>

			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div className="card-body">
					<div className="skeleton" style={{ width: "100%", height: "48px" }} />
				</div>
			</div>

			<div className="dashboard-grid">
				{Array.from({ length: 5 }).map((_, i) => (
					<div className="stat-card" key={i}>
						<div className="skeleton" style={{ width: "70%", height: "0.75rem", marginBottom: "0.75rem" }} />
						<div className="skeleton" style={{ width: "50%", height: "1.75rem" }} />
					</div>
				))}
			</div>

			<div className="card" style={{ marginTop: "1.5rem" }}>
				<div className="card-header">
					<div className="skeleton" style={{ width: "180px", height: "1rem" }} />
				</div>
				<div className="card-body">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="skeleton" style={{ width: "100%", height: "2.25rem", marginBottom: "0.5rem" }} />
					))}
				</div>
			</div>
		</div>
	);
}
