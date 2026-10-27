import Link from "next/link";
import { getDb } from "@/lib/db";
import { crmDashboard } from "@/lib/crm/queries";
import { athensToday } from "@/lib/crm/inquiry-input";
import { money } from "@/lib/crm/view";
import { ensureEnv, isMailConfigured } from "@/lib/env";

const RANGES = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as const;

export async function CrmDashboardBlock({ rangeDays }: { rangeDays: number }) {
	await ensureEnv();
	const now = new Date();
	let m;
	try {
		m = await crmDashboard(await getDb(), { from: athensToday(new Date(now.getTime() - (rangeDays - 1) * 86400_000)), to: athensToday(now) }, now);
	} catch (e) {
		console.error("CRM dashboard block failed", e);
		return <div className="crm-alert bad" style={{ marginBottom: "1rem" }}>Inquiry metrics couldn&apos;t be loaded. Has the latest database migration been applied?</div>;
	}
	const mail = isMailConfigured();
	return (
		<section aria-label="Inquiries and quotations" style={{ marginBottom: "1.5rem" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
				<h2 className="crm-section-title" style={{ margin: 0 }}>Inquiries &amp; quotations</h2>
				<div style={{ display: "flex", gap: 6 }}>
					{RANGES.map(([d, label]) => <Link key={d} href={`/admin/dashboard?range=${d}`} className={`table-tab ${String(rangeDays) === d ? "active" : ""}`}>{label}</Link>)}
				</div>
			</div>
			{(m.emailFailures > 0 || !mail) && (
				<div className={`crm-alert ${m.emailFailures > 0 ? "bad" : "warn"}`} style={{ marginBottom: 10 }}>
					{m.emailFailures > 0 ? <>{m.emailFailures} email{m.emailFailures === 1 ? "" : "s"} failed to send. </> : null}
					{!mail ? "Email sending isn't configured, so notifications are queued. " : ""}
					<Link href="/admin/emails?status=problem" style={{ textDecoration: "underline" }}>Review Email Activity</Link>
				</div>
			)}
			<div className="crm-kpis">
				<Link href="/admin/inquiries?status=new" className={`crm-kpi ${m.newCount ? "gold" : ""}`}><small>New inquiries</small><b>{m.newCount}</b><span>awaiting first review</span></Link>
				<Link href="/admin/inquiries?status=open" className="crm-kpi"><small>Received</small><b>{m.receivedToday}</b><span>today · {m.receivedWeek} this week · {m.receivedRange} in {rangeDays}d</span></Link>
				<Link href="/admin/inquiries?status=preparing_quote" className={`crm-kpi ${m.awaitingPrep ? "warn" : ""}`}><small>Awaiting quotation</small><b>{m.awaitingPrep}</b><span>reviewing / preparing</span></Link>
				<Link href="/admin/inquiries?status=quote_sent" className="crm-kpi"><small>Quotations sent</small><b>{m.quotesSent}</b><span>{money(m.quotedValue)} quoted ({rangeDays}d)</span></Link>
				<Link href="/admin/followups" className={`crm-kpi ${m.overdue ? "bad" : m.dueToday ? "warn" : "good"}`}><small>Follow-ups</small><b>{m.dueToday}</b><span>due today · {m.overdue} overdue</span></Link>
				<Link href="/admin/bookings" className="crm-kpi good"><small>Upcoming bookings</small><b>{m.upcoming}</b><span>confirmed, not yet travelled</span></Link>
				<Link href="/admin/reports" className="crm-kpi good"><small>Confirmed value</small><b>{money(m.confirmedValue)}</b><span>{m.confirmedCount} booking(s) confirmed ({rangeDays}d)</span></Link>
				<Link href="/admin/inquiries?status=lost" className="crm-kpi"><small>Lost / completed</small><b>{m.lost} / {m.completed}</b><span>last {rangeDays} days</span></Link>
			</div>
		</section>
	);
}
