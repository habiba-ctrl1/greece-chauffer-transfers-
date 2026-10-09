import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { reports } from "@/lib/crm/queries";
import { athensToday, SERVICE_LABELS, type ServiceType } from "@/lib/crm/inquiry-input";
import { money } from "@/lib/crm/view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Greece Chauffeur Service" };

const defaultFrom = () => athensToday(new Date(Date.now() - 29 * 86400_000));
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

function Bars({ rows, label }: { rows: { key: string; n: number }[]; label: string }) {
	const max = Math.max(1, ...rows.map((r) => r.n));
	if (!rows.length) return <p className="crm-sub" style={{ padding: "1rem 1.25rem" }}>No data in this period.</p>;
	return (
		<ul style={{ listStyle: "none", padding: "0.75rem 1.25rem", display: "grid", gap: 8 }} aria-label={label}>
			{rows.map((r) => (
				<li key={r.key} style={{ display: "grid", gridTemplateColumns: "minmax(80px, 200px) 1fr 40px", gap: 10, alignItems: "center", fontSize: "0.8125rem" }}>
					<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.key}>{r.key}</span>
					<span className="crm-bar" style={{ width: `${(r.n / max) * 100}%` }} aria-hidden="true" />
					<b>{r.n}</b>
				</li>
			))}
		</ul>
	);
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
	await requirePageUser();
	const sp = await searchParams;
	const to = isDate(sp.to) ? sp.to! : athensToday();
	const from = isDate(sp.from) ? sp.from! : defaultFrom();
	const r = await reports(await getDb(), { from, to });
	const q = r.quotes;
	const pct = (v: number | null) => (v === null ? "n/a" : `${v.toFixed(0)}%`);

	return (
		<div>
			<div className="page-header">
				<div><h1>Reports</h1><p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>{from} → {to} (Athens time). All figures come from saved records.</p></div>
			</div>
			<form className="card crm-filters" method="GET" action="/admin/reports" style={{ marginBottom: "1rem" }}>
				<label>From<input className="form-input" type="date" name="from" defaultValue={from} /></label>
				<label>To<input className="form-input" type="date" name="to" defaultValue={to} /></label>
				<div className="crm-actions"><button className="btn btn-primary">Apply</button><Link className="btn btn-secondary" href="/admin/reports">Last 30 days</Link></div>
			</form>

			<div className="crm-kpis">
				<div className="crm-kpi"><small>Inquiries received</small><b>{r.byDay.reduce((s, d) => s + d.c, 0)}</b></div>
				<div className="crm-kpi"><small>Quotations created</small><b>{q.created}</b><span>including drafts</span></div>
				<div className="crm-kpi gold"><small>Quotations sent</small><b>{q.sent}</b><span>{money(q.sentValue)} quoted</span></div>
				<div className="crm-kpi good"><small>Acceptance rate</small><b>{pct(q.acceptanceRate)}</b><span>{q.accepted} accepted of {q.sent} sent</span></div>
				<div className="crm-kpi"><small>Accepted of decided</small><b>{pct(q.decidedRate)}</b><span>{q.accepted} accepted · {q.rejected} rejected</span></div>
				<div className="crm-kpi good"><small>Confirmed bookings</small><b>{r.confirmedByDay.reduce((s, d) => s + d.c, 0)}</b><span>{money(r.confirmedByDay.reduce((s, d) => s + (d.v ?? 0), 0))} confirmed value</span></div>
				<div className={`crm-kpi ${r.emailStats?.failed ? "bad" : ""}`}><small>Email failures</small><b>{r.emailStats?.failed ?? 0}</b><span>of {r.emailStats?.total ?? 0} emails · {r.emailStats?.bounced ?? 0} bounced</span></div>
			</div>
			<p className="crm-sub" style={{ marginBottom: "1rem" }}>Acceptance rate counts only quotations that were actually sent in this period (drafts excluded). Quoted value is not confirmed revenue; confirmed value comes from confirmed bookings only.</p>

			<div className="crm-detail" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
				<section className="card"><div className="card-header"><h2 className="card-title">Inquiries by day</h2></div><Bars label="Inquiries by day" rows={r.byDay.map((d) => ({ key: d.day, n: d.c }))} /></section>
				<section className="card"><div className="card-header"><h2 className="card-title">By service</h2></div><Bars label="By service" rows={r.byService.map((d) => ({ key: SERVICE_LABELS[d.service_type as ServiceType] ?? d.service_type, n: d.c }))} /></section>
				<section className="card"><div className="card-header"><h2 className="card-title">Source / landing page</h2></div><Bars label="Source" rows={r.bySource.map((d) => ({ key: d.source, n: d.c }))} /></section>
				<section className="card"><div className="card-header"><h2 className="card-title">Confirmed bookings by day</h2></div><Bars label="Confirmed bookings" rows={r.confirmedByDay.map((d) => ({ key: d.day, n: d.c }))} /></section>
				<section className="card"><div className="card-header"><h2 className="card-title">Lost inquiries — reasons</h2></div><Bars label="Lost reasons" rows={r.lostReasons.map((d) => ({ key: d.reason, n: d.c }))} /></section>
			</div>
		</div>
	);
}
