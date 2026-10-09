import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { listInquiries, type InquiryFilters } from "@/lib/crm/queries";
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS } from "@/lib/crm/status";
import { SERVICE_LABELS, SERVICE_TYPES, type ServiceType } from "@/lib/crm/inquiry-input";
import { FollowupChip, InquiryStatusBadge, QuoteStateBadge } from "@/components/admin/crm/badges";
import { followupOf, money, qs } from "@/lib/crm/view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings & Inquiries — Greece Chauffeur Service" };

type SP = Record<string, string | undefined>;

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
	const user = await requirePageUser();
	const sp = await searchParams;
	const filters: InquiryFilters = {
		q: sp.q, status: sp.status || "open", service: sp.service, followup: (sp.followup as InquiryFilters["followup"]) || "",
		from: sp.from, to: sp.to, sort: (sp.sort as InquiryFilters["sort"]) || "created_at", dir: sp.dir === "asc" ? "asc" : "desc",
		page: Number(sp.page) || 1, archived: sp.archived === "1",
	};
	const now = new Date();
	const data = await listInquiries(await getDb(), filters, now);
	const base = { q: sp.q, status: sp.status, service: sp.service, followup: sp.followup, from: sp.from, to: sp.to, sort: sp.sort, dir: sp.dir, archived: sp.archived };
	const sortLink = (col: string, label: string) => {
		const active = (filters.sort ?? "created_at") === col;
		const dir = active && filters.dir === "desc" ? "asc" : "desc";
		return <Link href={`/admin/inquiries${qs(base, { sort: col, dir, page: 1 })}`}>{label}{active ? (filters.dir === "asc" ? " ↑" : " ↓") : ""}</Link>;
	};
	const owner = user.role === "super_admin" || user.role === "admin";

	return (
		<div>
			<div className="page-header">
				<div>
					<h1>Bookings &amp; Inquiries</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>{data.total} record{data.total === 1 ? "" : "s"} in this view</p>
				</div>
				<div className="page-header-actions">
					{owner && <a className="btn btn-secondary" href={`/admin/export/inquiries${qs(base)}`}>Export CSV</a>}
				</div>
			</div>

			<form method="GET" action="/admin/inquiries" className="card crm-filters" style={{ marginBottom: "1rem" }}>
				<label className="wide">Search
					<input className="form-input" name="q" defaultValue={sp.q ?? ""} placeholder="Reference, name, email, phone, place…" />
				</label>
				<label>Status
					<select className="form-select" name="status" defaultValue={filters.status}>
						<option value="open">Open (all active)</option>
						<option value="">Everything</option>
						{INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{INQUIRY_STATUS_LABELS[s]}</option>)}
					</select>
				</label>
				<label>Service
					<select className="form-select" name="service" defaultValue={sp.service ?? ""}>
						<option value="">All services</option>
						{SERVICE_TYPES.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
					</select>
				</label>
				<label>Follow-up
					<select className="form-select" name="followup" defaultValue={sp.followup ?? ""}>
						<option value="">Any</option>
						<option value="overdue">Overdue</option>
						<option value="due">Due now</option>
						<option value="scheduled">Scheduled</option>
						<option value="none">None</option>
					</select>
				</label>
				<label>Pickup from<input className="form-input" type="date" name="from" defaultValue={sp.from ?? ""} /></label>
				<label>Pickup to<input className="form-input" type="date" name="to" defaultValue={sp.to ?? ""} /></label>
				<label>Archive
					<select className="form-select" name="archived" defaultValue={sp.archived ?? ""}>
						<option value="">Active</option>
						<option value="1">Archived</option>
					</select>
				</label>
				<div className="crm-actions">
					<button className="btn btn-primary" type="submit">Apply</button>
					<Link className="btn btn-secondary" href="/admin/inquiries">Reset</Link>
				</div>
			</form>

			<div className="card">
				<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>{sortLink("reference", "Reference")}</th>
								<th>Customer</th>
								<th>Service</th>
								<th>{sortLink("pickup_date", "Pickup")}</th>
								<th>Route</th>
								<th>Pax</th>
								<th>Status</th>
								<th>Quotation</th>
								<th>{sortLink("next_followup_at", "Follow-up")}</th>
								<th>{sortLink("updated_at", "Updated")}</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{data.rows.length === 0 && (
								<tr><td colSpan={11}><div className="empty-state"><div className="empty-state-title">No inquiries match</div><div className="empty-state-text">New website requests appear here automatically. Try clearing the filters.</div></div></td></tr>
							)}
							{data.rows.map((r) => (
								<tr key={r.id}>
									<td><Link href={`/admin/inquiries/${r.id}`} style={{ fontWeight: 600 }}>{r.reference}</Link><span className="crm-sub">{r.created_at.slice(0, 10)}</span></td>
									<td>{r.customer_name}<span className="crm-sub">{r.customer_email}</span></td>
									<td>{SERVICE_LABELS[r.service_type as ServiceType] ?? r.service_type}</td>
									<td style={{ whiteSpace: "nowrap" }}>{r.pickup_date}<span className="crm-sub">{r.pickup_time ?? ""}</span></td>
									<td style={{ minWidth: 230 }}>{r.pickup_location}{r.destination ? ` → ${r.destination}` : ""}</td>
									<td>{r.adults + r.children}</td>
									<td><InquiryStatusBadge status={r.status} /></td>
									<td><QuoteStateBadge status={r.quote_state} />{r.quote_total ? <span className="crm-sub">{money(r.quote_total)}</span> : null}</td>
									<td><FollowupChip at={r.next_followup_at} state={followupOf(r, now)} /></td>
									<td style={{ whiteSpace: "nowrap" }} className="crm-sub">{r.updated_at.slice(0, 10)}</td>
									<td><Link className="btn btn-secondary btn-sm" href={`/admin/inquiries/${r.id}`}>Open</Link></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="crm-pager">
					<span>Page {data.page} of {data.totalPages}</span>
					<span className="crm-actions">
						{data.page > 1 && <Link className="btn btn-secondary btn-sm" href={`/admin/inquiries${qs(base, { page: data.page - 1 })}`}>← Previous</Link>}
						{data.page < data.totalPages && <Link className="btn btn-secondary btn-sm" href={`/admin/inquiries${qs(base, { page: data.page + 1 })}`}>Next →</Link>}
					</span>
				</div>
			</div>
		</div>
	);
}
