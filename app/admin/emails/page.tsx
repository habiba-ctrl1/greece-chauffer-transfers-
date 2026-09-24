import Link from "next/link";
import { getEmailLogs, getEmailTemplates } from "@/lib/actions/emails";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Email Dispatch & Templates — Greece Chauffeur Service",
};

interface EmailsPageProps {
	searchParams: Promise<{
		tab?: string;
		page?: string;
		related_type?: "quote" | "booking" | "invoice";
	}>;
}

export default async function EmailsPage({ searchParams }: EmailsPageProps) {
	const params = await searchParams;
	const activeTab = params.tab || "logs";
	const page = parseInt(params.page || "1", 10);

	const [{ logs, total, totalPages }, templates] = await Promise.all([
		getEmailLogs({
			page,
			limit: 25,
			related_type: params.related_type,
		}),
		getEmailTemplates(),
	]);

	return (
		<div>
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1>Email Communications</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
						Review outgoing dispatch logs, delivery statuses, and system email templates.
					</p>
				</div>
				<div className="page-header-actions">
					<Link href="/admin/settings" className="btn btn-secondary">
						Email Settings
					</Link>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div
				style={{
					display: "flex",
					gap: "0.5rem",
					borderBottom: "1px solid var(--border-default)",
					marginBottom: "1.5rem",
				}}
			>
				<Link
					href="/admin/emails?tab=logs"
					style={{
						padding: "0.75rem 1.25rem",
						textDecoration: "none",
						borderBottom: activeTab === "logs" ? "2px solid var(--brand-600)" : "2px solid transparent",
						color: activeTab === "logs" ? "var(--brand-600)" : "var(--text-secondary)",
						fontWeight: activeTab === "logs" ? 600 : 500,
						fontSize: "0.875rem",
					}}
				>
					Dispatch Logs ({total})
				</Link>
				<Link
					href="/admin/emails?tab=templates"
					style={{
						padding: "0.75rem 1.25rem",
						textDecoration: "none",
						borderBottom: activeTab === "templates" ? "2px solid var(--brand-600)" : "2px solid transparent",
						color: activeTab === "templates" ? "var(--brand-600)" : "var(--text-secondary)",
						fontWeight: activeTab === "templates" ? 600 : 500,
						fontSize: "0.875rem",
					}}
				>
					Templates ({templates.length})
				</Link>
			</div>

			{/* Tab 1: Dispatch Logs */}
			{activeTab === "logs" && (
				<div className="card">
					<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<div>
							<h3 className="card-title">Outbox & Delivery History</h3>
							<p className="card-subtitle">Audited record of all automated and manual emails dispatched to clients.</p>
						</div>

						{/* Quick Filter */}
						<div style={{ display: "flex", gap: "0.5rem" }}>
							<Link
								href="/admin/emails?tab=logs"
								className={`btn btn-sm ${!params.related_type ? "btn-primary" : "btn-secondary"}`}
							>
								All
							</Link>
							<Link
								href="/admin/emails?tab=logs&related_type=quote"
								className={`btn btn-sm ${params.related_type === "quote" ? "btn-primary" : "btn-secondary"}`}
							>
								Quotes
							</Link>
							<Link
								href="/admin/emails?tab=logs&related_type=booking"
								className={`btn btn-sm ${params.related_type === "booking" ? "btn-primary" : "btn-secondary"}`}
							>
								Bookings
							</Link>
						</div>
					</div>

					<div className="card-body" style={{ padding: 0 }}>
						{logs.length === 0 ? (
							<div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-tertiary)" }}>
								<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✉</div>
								<h4 style={{ margin: "0 0 0.25rem", color: "var(--text-primary)" }}>No emails sent yet</h4>
								<p style={{ margin: 0, fontSize: "0.875rem" }}>
									Emails dispatched from Quotes or Bookings will automatically be recorded here.
								</p>
							</div>
						) : (
							<table className="table">
								<thead>
									<tr>
										<th>Recipient</th>
										<th>Subject</th>
										<th>Related Record</th>
										<th>Status</th>
										<th>Dispatched At</th>
									</tr>
								</thead>
								<tbody>
									{logs.map((log) => (
										<tr key={log.id}>
											<td>
												<div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
													{log.recipient_name || log.recipient_email}
												</div>
												{log.recipient_name && (
													<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
														{log.recipient_email}
													</div>
												)}
											</td>
											<td>
												<div style={{ fontSize: "0.875rem", color: "var(--text-primary)", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
													{log.subject}
												</div>
												{log.error_message && (
													<div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.125rem" }}>
														Error: {log.error_message}
													</div>
												)}
											</td>
											<td>
												{log.related_type && log.related_id ? (
													<Link
														href={
															log.related_type === "quote"
																? `/admin/quotes/${log.related_id}`
																: `/admin/bookings/${log.related_id}`
														}
														style={{ color: "var(--brand-600)", fontWeight: 500, fontSize: "0.8125rem" }}
													>
														{log.related_type.toUpperCase()} #{log.related_id.substring(0, 8)}
													</Link>
												) : (
													<span style={{ color: "var(--text-tertiary)" }}>—</span>
												)}
											</td>
											<td>
												<span
													className={`badge ${
														log.status === "sent"
															? "badge-success"
															: log.status === "failed"
															? "badge-danger"
															: "badge-warning"
													}`}
												>
													{log.status}
												</span>
											</td>
											<td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
												{formatDate(log.sent_at || log.created_at)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>

					{/* Pagination Footer */}
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
										href={`/admin/emails?tab=logs&page=${page - 1}${params.related_type ? `&related_type=${params.related_type}` : ""}`}
										className="btn btn-secondary btn-sm"
									>
										Previous
									</Link>
								)}
								{page < totalPages && (
									<Link
										href={`/admin/emails?tab=logs&page=${page + 1}${params.related_type ? `&related_type=${params.related_type}` : ""}`}
										className="btn btn-secondary btn-sm"
									>
										Next
									</Link>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Tab 2: Templates Preview */}
			{activeTab === "templates" && (
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "1.5rem" }}>
					{templates.map((tpl) => (
						<div key={tpl.id} className="card">
							<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
								<div>
									<h3 className="card-title">{tpl.name}</h3>
									<code style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", background: "var(--bg-page)", padding: "0.15rem 0.4rem", borderRadius: "3px" }}>
										{tpl.slug}
									</code>
								</div>
								<span className="badge badge-success">Active</span>
							</div>

							<div className="card-body">
								<div style={{ marginBottom: "1rem" }}>
									<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
										Subject Line
									</div>
									<div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
										{tpl.subject}
									</div>
								</div>

								{tpl.variables && (
									<div>
										<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.35rem" }}>
											Supported Variables
										</div>
										<div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
											{tpl.variables.split(",").map((v) => (
												<span
													key={v}
													style={{
														fontSize: "0.6875rem",
														fontFamily: "monospace",
														padding: "0.15rem 0.4rem",
														borderRadius: "3px",
														background: "var(--bg-page)",
														border: "1px solid var(--border-default)",
														color: "var(--brand-700)",
													}}
												>
													{`{{${v.trim()}}}`}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
