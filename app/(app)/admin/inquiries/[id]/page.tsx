import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { getInquiryDetail } from "@/lib/crm/queries";
import { INQUIRY_STATUS_LABELS, TRANSITIONS, GUARDED_TARGETS, quoteState, isOpenStatus, FOLLOWUP_ELIGIBLE } from "@/lib/crm/status";
import { SERVICE_LABELS, type ServiceType } from "@/lib/crm/inquiry-input";
import { EMAIL_CATEGORY_LABELS, EmailStatusBadge, FollowupChip, InquiryStatusBadge, QuoteStateBadge } from "@/components/admin/crm/badges";
import { ArchiveButton, BookingActions, CreateQuoteButton, FollowupForm, NoteForm, QuoteRowActions, RetryEmailButton, StatusControl } from "@/components/admin/crm/controls";
import { fmtDateTime, followupOf, money } from "@/lib/crm/view";
import { ensureEnv, isMailConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const DETAIL_LABELS: Record<string, string> = {
	airport: "Airport", flight_number: "Flight number", airline: "Airline", arrival_details: "Arrival details", port: "Port", ferry_details: "Ferry / cruise",
	hotel: "Hotel / accommodation", child_seats: "Child seats", child_seat_types: "Child seat types", duration_hours: "Duration (hours)", duration_days: "Duration (days)",
	stops: "Stops / itinerary", tour_preferences: "Tour preferences", meet_greet: "Meet & greet", special: "Special requirements",
};

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
	await requirePageUser();
	await ensureEnv();
	const { id } = await params;
	const d = await getInquiryDetail(await getDb(), id);
	if (!d) notFound();
	const { inquiry: i, customer, quotes, itemsByQuote, events, emails, bookings } = d;
	const now = new Date();
	const details = (i.details_json ? JSON.parse(i.details_json) : {}) as Record<string, unknown>;
	const extra = Object.entries(details).filter(([k, v]) => DETAIL_LABELS[k] && typeof v === "string" && v);
	const utm = i.utm_json ? (JSON.parse(i.utm_json) as Record<string, string>) : {};
	const hasDraft = quotes.some((q) => q.status === "draft");
	const booking = bookings[0];
	const statusOptions = TRANSITIONS[i.status].filter((s) => !GUARDED_TARGETS.includes(s)).map((s) => ({ value: s, label: INQUIRY_STATUS_LABELS[s] }));
	const open = isOpenStatus(i.status);
	const emailProblems = emails.filter((e) => ["failed", "dead"].includes(e.status) || (e.status === "queued" && e.last_error));
	const mailOk = isMailConfigured();
	const fu = followupOf(i, now);

	return (
		<div>
			<div className="page-header">
				<div>
					<p style={{ fontSize: "0.8rem" }}><Link href="/admin/inquiries" style={{ color: "var(--text-tertiary)" }}>← Bookings &amp; Inquiries</Link></p>
					<h1 style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>{i.reference} <InquiryStatusBadge status={i.status} /></h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						{SERVICE_LABELS[i.service_type as ServiceType] ?? i.service_type} · received {fmtDateTime(i.created_at)}{i.archived_at ? " · archived" : ""}
					</p>
				</div>
				<div className="page-header-actions crm-actions">
					{open && !hasDraft && !quotes.some((q) => ["sent", "accepted"].includes(q.status) && !q.superseded_by_id) && <CreateQuoteButton inquiryId={i.id} />}
					{open && hasDraft && <Link className="btn btn-primary" href={`/admin/quotes/${quotes.find((q) => q.status === "draft")!.id}/builder`}>Continue quotation</Link>}
					<ArchiveButton id={i.id} archived={!!i.archived_at} />
				</div>
			</div>

			{!mailOk && <div className="crm-alert warn" style={{ marginBottom: "1rem" }}>Email sending isn&apos;t configured on this server yet, so emails stay queued. See <Link href="/admin/emails" style={{ textDecoration: "underline" }}>Email Activity</Link>.</div>}
			{emailProblems.length > 0 && (
				<div className="crm-alert bad" style={{ marginBottom: "1rem" }}>
					{emailProblems.length} email{emailProblems.length === 1 ? "" : "s"} for this inquiry did not go out. The inquiry itself is safely saved. See the Emails panel to retry.
				</div>
			)}

			<div className="crm-detail">
				<div className="crm-stack">
					<section className="card">
						<div className="card-header"><h2 className="card-title">Customer</h2></div>
						<dl className="crm-dl">
							<dt>Name</dt><dd><Link href={`/admin/customers/${customer?.id}`} style={{ textDecoration: "underline" }}>{customer?.name}</Link></dd>
							<dt>Email</dt><dd>{customer?.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : "—"}</dd>
							<dt>Phone</dt><dd>{customer?.phone ? <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}>{customer.phone}</a> : "—"}</dd>
						</dl>
					</section>

					<section className="card">
						<div className="card-header"><h2 className="card-title">Journey &amp; requirements</h2></div>
						<dl className="crm-dl">
							<dt>Pickup</dt><dd>{i.pickup_location}</dd>
							<dt>Drop-off</dt><dd>{i.destination ?? "—"}</dd>
							<dt>Date &amp; time</dt><dd>{i.pickup_date}{i.pickup_time ? ` at ${i.pickup_time}` : ""}</dd>
							{i.return_date && (<><dt>Return</dt><dd>{i.return_date}{i.return_time ? ` at ${i.return_time}` : ""}</dd></>)}
							<dt>Passengers</dt><dd>{i.adults} adult(s){i.children ? `, ${i.children} child(ren)` : ""}</dd>
							<dt>Luggage</dt><dd>{i.luggage ?? "—"}</dd>
							<dt>Vehicle preference</dt><dd>{i.vehicle_preference ?? "—"}</dd>
							{extra.map(([k, v]) => (<Fragment key={k}><dt>{DETAIL_LABELS[k]}</dt><dd>{String(v)}</dd></Fragment>))}
							<dt>Customer notes</dt><dd>{i.customer_notes ?? "—"}</dd>
							<dt>Source</dt><dd>{i.source_page ?? "—"}{Object.keys(utm).length ? ` · ${Object.entries(utm).map(([k, v]) => `${k.replace("utm_", "")}=${v}`).join(", ")}` : ""}</dd>
						</dl>
					</section>

					<section className="card">
						<div className="card-header"><h2 className="card-title">Quotations</h2></div>
						{quotes.length === 0 ? (
							<div className="empty-state"><div className="empty-state-title">No quotation yet</div><div className="empty-state-text">{open ? "Create one — customer and journey details are filled in automatically." : "This inquiry is closed."}</div></div>
						) : (
							<div className="table-wrap">
								<table className="table">
									<thead><tr><th>Quotation</th><th>Status</th><th>Total</th><th>Valid until</th><th>Sent</th><th>Actions</th></tr></thead>
									<tbody>
										{quotes.map((q) => {
											const st = quoteState(q);
											const items = itemsByQuote[q.id] ?? [];
											return (
												<tr key={q.id}>
													<td><strong>{q.quote_number}</strong><span className="crm-sub">v{q.version}{!q.superseded_by_id ? " · current" : ""} · {items.length} line{items.length === 1 ? "" : "s"}</span></td>
													<td><QuoteStateBadge status={q.status} supersededBy={q.superseded_by_id} />{q.accepted_at && <span className="crm-sub">{q.accepted_via === "manual" ? "recorded by owner" : "via customer link"} · {fmtDateTime(q.accepted_at)}</span>}</td>
													<td>{money(q.total, q.currency)}</td>
													<td>{q.valid_until ?? "—"}</td>
													<td className="crm-sub">{fmtDateTime(q.sent_at)}</td>
													<td><QuoteRowActions quote={{ id: q.id, state: st, version: q.version }} inquiryId={i.id} hasBooking={bookings.some((b) => b.quote_id === q.id)} /></td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</section>

					{booking && (
						<section className="card">
							<div className="card-header"><h2 className="card-title">Confirmed booking</h2></div>
							<dl className="crm-dl">
								<dt>Booking</dt><dd><Link href={`/admin/bookings/${booking.id}`} style={{ textDecoration: "underline" }}>{booking.booking_number}</Link></dd>
								<dt>Status</dt><dd>{booking.status.replace(/_/g, " ")}</dd>
								<dt>Payment</dt><dd>{booking.payment_status.replace(/_/g, " ")}</dd>
								<dt>Agreed amount</dt><dd>{money(booking.total)}</dd>
							</dl>
							<div style={{ padding: "0 1.25rem 1rem" }}>
								<BookingActions bookingId={booking.id} inquiryId={i.id} canConfirmEmail={["confirmed", "driver_assigned", "driver_confirmed"].includes(booking.status)} canComplete={i.status === "confirmed"} />
							</div>
						</section>
					)}

					<section className="card">
						<div className="card-header"><h2 className="card-title">Activity history</h2></div>
						<ul className="crm-timeline">
							{events.map((e) => (
								<li key={e.id} className={/failed|bounce/.test(e.type) ? "bad" : ""}>
									<span>{e.message}</span>
									<time>{fmtDateTime(e.created_at)}{e.actor_name ? ` · ${e.actor_name}` : ""} · {e.type.replace(/_/g, " ")}</time>
								</li>
							))}
						</ul>
					</section>
				</div>

				<div className="crm-stack">
					<section className="card">
						<div className="card-header"><h2 className="card-title">Status</h2></div>
						<div className="crm-form">
							{statusOptions.length > 0 ? <StatusControl id={i.id} current={i.status} options={statusOptions} /> : <p className="crm-sub">No manual status changes available from here.</p>}
							{i.lost_reason && <div className="crm-note">Lost reason: {i.lost_reason}</div>}
							{open && i.status === "accepted" && <p className="crm-sub">Customer has accepted. Confirm the booking from the quotation row once availability and payment arrangements are agreed.</p>}
						</div>
					</section>

					<section className="card">
						<div className="card-header"><h2 className="card-title">Follow-up</h2><FollowupChip at={i.next_followup_at} state={fu} /></div>
						{FOLLOWUP_ELIGIBLE.includes(i.status) ? (
							<FollowupForm id={i.id} current={i.next_followup_at} canEmail={!!customer?.email && i.status !== "accepted"} />
						) : <p className="crm-sub" style={{ padding: "1rem 1.25rem" }}>Reminders are off for {INQUIRY_STATUS_LABELS[i.status].toLowerCase()} inquiries.</p>}
						<dl className="crm-dl"><dt>Last contact</dt><dd>{fmtDateTime(i.last_contact_at)}</dd>{i.followup_note && (<><dt>Note</dt><dd>{i.followup_note}</dd></>)}</dl>
					</section>

					<section className="card">
						<div className="card-header"><h2 className="card-title">Internal notes</h2></div>
						{i.internal_notes && <pre className="crm-note" style={{ margin: "1rem 1.25rem 0", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{i.internal_notes}</pre>}
						<NoteForm id={i.id} />
					</section>

					<section className="card">
						<div className="card-header"><h2 className="card-title">Emails</h2></div>
						{emails.length === 0 ? <p className="crm-sub" style={{ padding: "1rem 1.25rem" }}>No emails yet.</p> : (
							<ul className="crm-timeline">
								{emails.map((e) => (
									<li key={e.id}>
										<span><strong>{EMAIL_CATEGORY_LABELS[e.category] ?? e.category}</strong> → {e.to_email}</span>
										<span><EmailStatusBadge status={e.status} providerStatus={e.provider_status} error={e.last_error} /> {["failed", "dead", "queued"].includes(e.status) && <RetryEmailButton id={e.id} label={e.status === "queued" ? "Send now" : "Retry"} />}</span>
										{e.last_error && e.status !== "sent" && <span className="crm-sub" style={{ color: "var(--status-danger)" }}>{e.last_error}</span>}
										<time>{fmtDateTime(e.sent_at ?? e.created_at)} · attempts {e.attempts}/{e.max_attempts}</time>
									</li>
								))}
							</ul>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}
