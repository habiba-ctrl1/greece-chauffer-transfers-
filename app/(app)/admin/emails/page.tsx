import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { emailActivity } from "@/lib/crm/queries";
import { ensureEnv, getMailConfig, isMailConfigured } from "@/lib/env";
import { EMAIL_CATEGORY_LABELS, EmailStatusBadge } from "@/components/admin/crm/badges";
import { ProcessQueueButton, RetryEmailButton, TestEmailButton } from "@/components/admin/crm/controls";
import { fmtDateTime, qs } from "@/lib/crm/view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email Activity — Greece Chauffeur Service" };

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
	const user = await requirePageUser();
	await ensureEnv();
	const sp = await searchParams;
	const cfg = getMailConfig();
	const ok = isMailConfigured(cfg);
	const owner = user.role === "super_admin" || user.role === "admin";
	const data = await emailActivity(await getDb(), { status: sp.status, page: Number(sp.page) || 1 });
	const tabs = [["", "All"], ["problem", "Needs attention"], ["queued", "Queued"], ["sent", "Sent"]] as const;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1>Email Activity</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>Every notification, acknowledgment and quotation email, with its delivery state.</p>
				</div>
			</div>

			<section className="card" style={{ marginBottom: "1rem" }}>
				<div className="card-header"><h2 className="card-title">Sender status</h2></div>
				<dl className="crm-dl">
					<dt>Provider</dt><dd>{cfg.transport === "console" ? "Console (development only — nothing is delivered)" : "Resend"}</dd>
					<dt>API key</dt><dd>{cfg.resendApiKey ? "Configured (hidden)" : <span className="crm-pill bad">Missing — set RESEND_API_KEY</span>}</dd>
					<dt>Sender address</dt><dd>{cfg.fromAddress ? `${cfg.fromName} <${cfg.fromAddress}>` : <span className="crm-pill bad">Missing — set EMAIL_FROM_ADDRESS (a verified domain address)</span>}</dd>
					<dt>New-inquiry alerts go to</dt><dd>{cfg.notifyTo}</dd>
					<dt>Operational alerts</dt><dd>{cfg.opsAlertTo ?? "Not set (optional)"}</dd>
					<dt>Ready to send?</dt><dd>{ok ? <span className="crm-pill good">Credentials present</span> : <span className="crm-pill warn">No — emails stay queued until configured</span>}</dd>
				</dl>
				<div className="crm-form">
					<p className="crm-sub">&quot;Credentials present&quot; only means the settings exist. Domain verification (SPF/DKIM/DMARC) and inbox delivery are confirmed by sending a test email below and checking the inbox. &quot;Accepted by provider&quot; is not the same as delivered.</p>
					<div className="crm-actions">
						<ProcessQueueButton />
						{owner && <TestEmailButton />}
					</div>
				</div>
			</section>

			<div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
				{tabs.map(([k, label]) => <Link key={k} href={`/admin/emails${qs({ status: k })}`} className={`table-tab ${(sp.status ?? "") === k ? "active" : ""}`}>{label}</Link>)}
			</div>

			<div className="card">
				<div className="table-wrap">
					<table className="table">
						<thead><tr><th>When</th><th>Type</th><th>To</th><th>Subject</th><th>Inquiry</th><th>State</th><th></th></tr></thead>
						<tbody>
							{data.rows.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No emails in this view.</div></div></td></tr>}
							{data.rows.map((e) => (
								<tr key={e.id}>
									<td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(e.sent_at ?? e.created_at)}<span className="crm-sub">attempts {e.attempts}/{e.max_attempts}</span></td>
									<td>{EMAIL_CATEGORY_LABELS[e.category] ?? e.category}</td>
									<td>{e.to_email}</td>
									<td style={{ maxWidth: 280 }}>{e.subject}{e.last_error && e.status !== "sent" && <span className="crm-sub" style={{ color: "var(--status-danger)" }}>{e.last_error}</span>}</td>
									<td>{e.inquiry_id ? <Link href={`/admin/inquiries/${e.inquiry_id}`} style={{ textDecoration: "underline" }}>{e.reference ?? "open"}</Link> : "—"}</td>
									<td><EmailStatusBadge status={e.status} providerStatus={e.provider_status} error={e.last_error} /></td>
									<td>{["failed", "dead", "queued"].includes(e.status) && <RetryEmailButton id={e.id} label={e.status === "queued" ? "Send now" : "Retry"} />}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="crm-pager">
					<span>{data.total} email{data.total === 1 ? "" : "s"} · page {data.page} of {data.totalPages}</span>
					<span className="crm-actions">
						{data.page > 1 && <Link className="btn btn-secondary btn-sm" href={`/admin/emails${qs({ status: sp.status, page: data.page - 1 })}`}>← Previous</Link>}
						{data.page < data.totalPages && <Link className="btn btn-secondary btn-sm" href={`/admin/emails${qs({ status: sp.status, page: data.page + 1 })}`}>Next →</Link>}
					</span>
				</div>
			</div>
		</div>
	);
}
