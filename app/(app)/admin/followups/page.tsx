import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { followupQueue, type InquiryListItem } from "@/lib/crm/queries";
import { InquiryStatusBadge, QuoteStateBadge } from "@/components/admin/crm/badges";
import { FollowupQuickActions } from "@/components/admin/crm/controls";
import { SERVICE_LABELS, type ServiceType } from "@/lib/crm/inquiry-input";
import { fmtDateTime } from "@/lib/crm/view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Follow-ups — Greece Chauffeur Service" };

function Table({ rows, empty, actions = true }: { rows: InquiryListItem[]; empty: string; actions?: boolean }) {
	if (!rows.length) return <div className="empty-state"><div className="empty-state-text">{empty}</div></div>;
	return (
		<div className="table-wrap">
			<table className="table">
				<thead><tr><th>Inquiry</th><th>Customer</th><th>Status</th><th>Quotation</th><th>Due</th><th>Note</th>{actions && <th>Quick actions</th>}</tr></thead>
				<tbody>
					{rows.map((r) => (
						<tr key={r.id}>
							<td><Link href={`/admin/inquiries/${r.id}`} style={{ fontWeight: 600 }}>{r.reference}</Link><span className="crm-sub">{SERVICE_LABELS[r.service_type as ServiceType] ?? r.service_type} · {r.pickup_date}</span></td>
							<td>{r.customer_name}<span className="crm-sub">{r.customer_email}</span></td>
							<td><InquiryStatusBadge status={r.status} /></td>
							<td><QuoteStateBadge status={r.quote_state} /></td>
							<td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.next_followup_at)}<span className="crm-sub">last contact {fmtDateTime(r.last_contact_at)}</span></td>
							<td style={{ maxWidth: 220 }}>{r.followup_note ?? "—"}</td>
							{actions && <td><FollowupQuickActions id={r.id} /></td>}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default async function FollowupsPage() {
	await requirePageUser();
	const q = await followupQueue(await getDb());
	return (
		<div>
			<div className="page-header">
				<div>
					<h1>Follow-ups</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>Reminders for open inquiries. Closed, cancelled and lost inquiries never appear here.</p>
				</div>
			</div>
			<div className="crm-kpis">
				<div className={`crm-kpi ${q.overdue.length ? "bad" : "good"}`}><small>Overdue</small><b>{q.overdue.length}</b></div>
				<div className={`crm-kpi ${q.today.length ? "warn" : "good"}`}><small>Due today</small><b>{q.today.length}</b></div>
				<div className="crm-kpi"><small>Upcoming</small><b>{q.upcoming.length}</b></div>
				<div className={`crm-kpi ${q.unscheduled.length ? "gold" : ""}`}><small>No reminder set</small><b>{q.unscheduled.length}</b></div>
			</div>

			<h2 className="crm-section-title">Overdue</h2>
			<div className="card"><Table rows={q.overdue} empty="Nothing overdue." /></div>
			<h2 className="crm-section-title">Due today</h2>
			<div className="card"><Table rows={q.today} empty="Nothing due today." /></div>
			<h2 className="crm-section-title">Upcoming</h2>
			<div className="card"><Table rows={q.upcoming} empty="No upcoming reminders." /></div>
			<h2 className="crm-section-title">Open inquiries without a reminder</h2>
			<div className="card"><Table rows={q.unscheduled} empty="Every open inquiry has a reminder." /></div>
		</div>
	);
}
