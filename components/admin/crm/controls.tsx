"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
	acceptQuotationAction, addInquiryNoteAction, archiveInquiryAction, changeInquiryStatusAction, completeInquiryAction, confirmBookingAction,
	createQuotationAction, processEmailQueueAction, recordContactAction, rejectQuotationAction, retryEmailAction, reviseQuotationAction,
	scheduleFollowupAction, sendBookingConfirmationAction, sendCustomerFollowUpAction, sendQuotationAction, sendTestEmailAction,
} from "@/lib/actions/inquiries";

type Result = { ok: boolean; error?: string; [k: string]: unknown };

/** Runs a server action, shows its outcome inline and refreshes server data. */
function useRun() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<{ tone: "good" | "bad" | "warn"; text: string } | null>(null);
	const run = (fn: () => Promise<Result>, okText: string, after?: (r: Result) => void) =>
		start(async () => {
			setMsg(null);
			try {
				const r = await fn();
				if (r.ok) setMsg({ tone: "good", text: okText });
				else setMsg({ tone: r.queued ? "warn" : "bad", text: r.error ?? "That didn't work." });
				after?.(r);
				router.refresh();
			} catch {
				setMsg({ tone: "bad", text: "Network problem — nothing was changed. Please try again." });
			}
		});
	return { pending, msg, run, setMsg };
}

const Msg = ({ m }: { m: { tone: string; text: string } | null }) => (m ? <div role="status" className={`crm-alert ${m.tone}`}>{m.text}</div> : null);

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
	return (
		<div className="crm-dialog-back" onClick={onClose} role="presentation" onKeyDown={(e) => e.key === "Escape" && onClose()}>
			<div className="crm-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
				<h3>{title}</h3>
				{children}
			</div>
		</div>
	);
}

/** Button that asks for confirmation (and optionally a reason) before running a consequential action. */
export function ConfirmAction({
	label, title, body, confirmLabel, variant = "secondary", reasonLabel, reasonRequired, action, doneText, size = "sm", onDone,
}: {
	label: string; title: string; body?: ReactNode; confirmLabel?: string; variant?: "primary" | "secondary" | "danger";
	reasonLabel?: string; reasonRequired?: boolean; action: (reason: string) => Promise<Result>; doneText: string; size?: "sm" | "md"; onDone?: (r: Result) => void;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");
	const { pending, msg, run } = useRun();
	return (
		<>
			<button type="button" className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""}`} onClick={() => setOpen(true)}>{label}</button>
			{msg && !open && <Msg m={msg} />}
			{open && (
				<Dialog title={title} onClose={() => !pending && setOpen(false)}>
					{body && <div style={{ fontSize: "0.875rem" }}>{body}</div>}
					{reasonLabel && (
						<label style={{ display: "grid", gap: 4, fontSize: "0.75rem", fontWeight: 600 }}>{reasonLabel}
							<textarea className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
						</label>
					)}
					<Msg m={msg} />
					<div className="crm-actions" style={{ justifyContent: "flex-end" }}>
						<button type="button" className="btn btn-secondary" disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
						<button type="button" className={`btn btn-${variant === "secondary" ? "primary" : variant}`} disabled={pending || (!!reasonRequired && !reason.trim())}
							onClick={() => run(() => action(reason), doneText, (r) => { if (r.ok) { setOpen(false); onDone?.(r); } })}>
							{pending ? "Working…" : confirmLabel ?? "Confirm"}
						</button>
					</div>
				</Dialog>
			)}
		</>
	);
}

export function StatusControl({ id, current, options }: { id: string; current: string; options: { value: string; label: string }[] }) {
	const [to, setTo] = useState("");
	const { pending, msg, run } = useRun();
	const needsReason = to === "lost" || to === "cancelled";
	const [reason, setReason] = useState("");
	return (
		<div className="crm-stack">
			<div className="crm-actions">
				<select className="form-select" aria-label="Change status" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: 260 }}>
					<option value="">Change status…</option>
					{options.filter((o) => o.value !== current).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
				</select>
				{needsReason && <input className="form-input" placeholder={to === "lost" ? "Reason (required)" : "Reason (optional)"} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} style={{ maxWidth: 260 }} />}
				<button className="btn btn-secondary" disabled={!to || pending || (to === "lost" && !reason.trim())} onClick={() => run(() => changeInquiryStatusAction(id, to, reason), "Status updated.", (r) => { if (r.ok) { setTo(""); setReason(""); } })}>
					{pending ? "Saving…" : "Update"}
				</button>
			</div>
			<Msg m={msg} />
		</div>
	);
}

export function NoteForm({ id }: { id: string }) {
	const [note, setNote] = useState("");
	const { pending, msg, run } = useRun();
	return (
		<form className="crm-form" onSubmit={(e) => { e.preventDefault(); run(() => addInquiryNoteAction(id, note), "Note added.", (r) => r.ok && setNote("")); }}>
			<label>Internal note (never shown to the customer)
				<textarea className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Call summary, preferences, internal reminders…" />
			</label>
			<div className="crm-actions"><button className="btn btn-secondary" disabled={pending || !note.trim()}>{pending ? "Saving…" : "Add note"}</button></div>
			<Msg m={msg} />
		</form>
	);
}

export function FollowupForm({ id, current, canEmail }: { id: string; current: string | null; canEmail: boolean }) {
	const [date, setDate] = useState(current ? current.slice(0, 10) : "");
	const [note, setNote] = useState("");
	const [responded, setResponded] = useState(false);
	const { pending, msg, run } = useRun();
	return (
		<div className="crm-form">
			<div className="row">
				<label>Next follow-up date
					<input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
				</label>
				<label>Reminder note
					<input className="form-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="e.g. call back after flights confirmed" />
				</label>
			</div>
			<div className="crm-actions">
				<button className="btn btn-secondary btn-sm" disabled={pending || !date} onClick={() => run(() => scheduleFollowupAction(id, date, note), "Follow-up scheduled.")}>Schedule / snooze</button>
				<button className="btn btn-secondary btn-sm" disabled={pending || !current} onClick={() => run(() => scheduleFollowupAction(id, null), "Follow-up cleared.", () => setDate(""))}>Clear reminder</button>
			</div>
			<hr style={{ border: 0, borderTop: "1px solid var(--border-default)" }} />
			<label>Record contact / customer response
				<textarea className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="What was said or sent?" />
			</label>
			<label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500 }}>
				<input type="checkbox" checked={responded} onChange={(e) => setResponded(e.target.checked)} /> The customer responded (stops automatic reminders)
			</label>
			<div className="crm-actions">
				<button className="btn btn-primary btn-sm" disabled={pending} onClick={() => run(() => recordContactAction(id, note, responded), responded ? "Customer response recorded." : "Follow-up marked done; next reminder planned.", () => { setNote(""); setResponded(false); })}>
					{responded ? "Record response" : "Mark contacted"}
				</button>
				{canEmail && (
					<ConfirmAction label="Email the customer a follow-up" title="Send follow-up email?" confirmLabel="Send email" doneText="Follow-up email queued."
						body="A short, neutral follow-up referencing this request will be emailed to the customer." action={() => sendCustomerFollowUpAction(id)} />
				)}
			</div>
			<Msg m={msg} />
		</div>
	);
}

export function CreateQuoteButton({ inquiryId, label = "Create quotation" }: { inquiryId: string; label?: string }) {
	const router = useRouter();
	const { pending, msg, run } = useRun();
	return (
		<>
			<button className="btn btn-primary" disabled={pending} onClick={() => run(() => createQuotationAction(inquiryId), "Opening editor…", (r) => r.ok && r.quoteId && router.push(`/admin/quotes/${r.quoteId}/builder`))}>{pending ? "Preparing…" : label}</button>
			<Msg m={msg} />
		</>
	);
}

export function QuoteRowActions({ quote, inquiryId, hasBooking }: { quote: { id: string; state: string; version: number }; inquiryId: string; hasBooking: boolean }) {
	const router = useRouter();
	return (
		<div className="crm-actions">
			<a className="btn btn-secondary btn-sm" href={`/admin/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer">PDF</a>
			{quote.state === "draft" && <a className="btn btn-secondary btn-sm" href={`/admin/quotes/${quote.id}/builder`}>Edit</a>}
			{quote.state === "sent" && (
				<>
					<ConfirmAction label="Mark accepted" title="Record customer acceptance?" confirmLabel="Mark accepted" doneText="Acceptance recorded."
						body="Use this when the customer has told you they accept. It does not confirm the booking — that is a separate step." action={() => acceptQuotationAction(quote.id)} />
					<ConfirmAction label="Mark rejected" variant="danger" title="Mark quotation as rejected?" reasonLabel="Reason (optional)" doneText="Quotation marked rejected."
						action={(reason) => rejectQuotationAction(quote.id, reason)} />
				</>
			)}
			{quote.state === "accepted" && !hasBooking && (
				<ConfirmAction label="Confirm booking" variant="primary" title="Confirm this booking?" confirmLabel="Confirm booking" doneText="Booking confirmed."
					body="This creates the confirmed booking from this accepted quotation version. Only do this once availability, a vehicle and payment arrangements are agreed." action={() => confirmBookingAction(quote.id)} onDone={() => router.refresh()} />
			)}
			{["sent", "rejected", "expired", "accepted", "superseded"].includes(quote.state) && (
				<ConfirmAction label="New version" title="Create a new version?" confirmLabel="Create version" doneText="New draft version created."
					body={`Version ${quote.version} stays exactly as the customer received it. A new editable draft is created from it.`}
					action={() => reviseQuotationAction(quote.id)} onDone={(r) => r.quoteId && router.push(`/admin/quotes/${r.quoteId}/builder`)} />
			)}
			<span className="crm-sub" style={{ display: "none" }}>{inquiryId}</span>
		</div>
	);
}

export function BookingActions({ bookingId, canConfirmEmail, inquiryId, canComplete }: { bookingId: string; canConfirmEmail: boolean; inquiryId: string; canComplete: boolean }) {
	return (
		<div className="crm-actions">
			{canConfirmEmail && (
				<ConfirmAction label="Email booking confirmation" title="Email confirmation to the customer?" confirmLabel="Send confirmation" doneText="Confirmation email queued/sent."
					body="Sends the confirmed journey, agreed amount and the terms from the accepted quotation." action={() => sendBookingConfirmationAction(bookingId)} />
			)}
			{canComplete && (
				<ConfirmAction label="Mark completed" title="Mark this booking completed?" confirmLabel="Mark completed" doneText="Marked completed." action={() => completeInquiryAction(inquiryId)} />
			)}
		</div>
	);
}

export function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
	return <ConfirmAction label={archived ? "Restore" : "Archive"} title={archived ? "Restore inquiry?" : "Archive inquiry?"} confirmLabel={archived ? "Restore" : "Archive"} doneText="Done."
		body={archived ? undefined : "Archived inquiries are hidden from the default lists. Nothing is deleted."} action={() => archiveInquiryAction(id, !archived)} />;
}

export function RetryEmailButton({ id, label = "Retry" }: { id: string; label?: string }) {
	const { pending, msg, run } = useRun();
	return (
		<span style={{ display: "inline-grid", gap: 4 }}>
			<button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(() => retryEmailAction(id), "Sent.")}>{pending ? "Retrying…" : label}</button>
			<Msg m={msg} />
		</span>
	);
}

export function ProcessQueueButton() {
	const { pending, msg, run } = useRun();
	return (
		<div style={{ display: "grid", gap: 6 }}>
			<button className="btn btn-secondary" disabled={pending} onClick={() => run(() => processEmailQueueAction(), "Queue processed.")}>{pending ? "Processing…" : "Send queued emails now"}</button>
			<Msg m={msg} />
		</div>
	);
}

export function TestEmailButton() {
	const { pending, msg, run } = useRun();
	const ref = useRef<HTMLDivElement>(null);
	return (
		<div ref={ref} style={{ display: "grid", gap: 6 }}>
			<button className="btn btn-secondary" disabled={pending} onClick={() => run(() => sendTestEmailAction(), "Test email accepted by the provider. Check the inbox to confirm delivery.")}>{pending ? "Sending…" : "Send test email"}</button>
			<Msg m={msg} />
		</div>
	);
}

export function SendQuotationButton({ quoteId, summary, disabled, openInitially }: { quoteId: string; summary: ReactNode; disabled?: boolean; openInitially?: boolean }) {
	const [open, setOpen] = useState(!!openInitially);
	const { pending, msg, run } = useRun();
	return (
		<>
			<button type="button" className="btn btn-primary" disabled={disabled} onClick={() => setOpen(true)}>Review &amp; send to customer</button>
			{open && (
				<Dialog title="Final review before sending" onClose={() => !pending && setOpen(false)}>
					<div style={{ fontSize: "0.875rem", display: "grid", gap: 8 }}>{summary}</div>
					<p className="crm-note">The PDF is generated from exactly what you saved. Once sent, this version can no longer be edited — you can create a new version later.</p>
					<Msg m={msg} />
					<div className="crm-actions" style={{ justifyContent: "flex-end" }}>
						<button className="btn btn-secondary" disabled={pending} onClick={() => setOpen(false)}>Back</button>
						<button className="btn btn-primary" disabled={pending} onClick={() => run(() => sendQuotationAction(quoteId), "Quotation sent — the provider accepted it.", (r) => { if (r.ok) setOpen(false); })}>{pending ? "Sending…" : "Send quotation"}</button>
					</div>
				</Dialog>
			)}
			{!open && <Msg m={msg} />}
		</>
	);
}

export function FollowupQuickActions({ id }: { id: string }) {
	const { pending, msg, run } = useRun();
	const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);
	return (
		<div style={{ display: "grid", gap: 4 }}>
			<div className="crm-actions">
				<button className="btn btn-primary btn-sm" disabled={pending} onClick={() => run(() => recordContactAction(id, "", false), "Marked contacted.")}>Mark contacted</button>
				<button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(() => scheduleFollowupAction(id, inDays(1)), "Snoozed 1 day.")}>+1 day</button>
				<button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(() => scheduleFollowupAction(id, inDays(3)), "Snoozed 3 days.")}>+3 days</button>
			</div>
			<Msg m={msg} />
		</div>
	);
}
