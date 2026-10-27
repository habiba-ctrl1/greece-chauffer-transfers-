import { INQUIRY_STATUS_LABELS, quoteState, type InquiryStatus } from "@/lib/crm/status";

const STATUS_TONE: Record<InquiryStatus, string> = {
	new: "new", reviewing: "active", awaiting_info: "warn", preparing_quote: "gold", quote_sent: "active",
	accepted: "good", confirmed: "good", completed: "muted", lost: "bad", cancelled: "muted",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
	return <span className={`crm-pill ${STATUS_TONE[status] ?? "muted"}`}>{INQUIRY_STATUS_LABELS[status] ?? status}</span>;
}

const QUOTE_TONE: Record<string, [string, string]> = {
	draft: ["muted", "Draft"], sent: ["active", "Sent"], accepted: ["good", "Accepted"], rejected: ["bad", "Rejected"],
	expired: ["warn", "Expired"], superseded: ["muted", "Superseded"],
};

export function QuoteStateBadge({ status, supersededBy }: { status: string | null; supersededBy?: string | null }) {
	if (!status) return <span className="crm-pill muted">No quotation</span>;
	const [tone, label] = QUOTE_TONE[quoteState({ status, superseded_by_id: supersededBy })] ?? ["muted", status];
	return <span className={`crm-pill ${tone}`}>{label}</span>;
}

export function EmailStatusBadge({ status, providerStatus, error }: { status: string; providerStatus?: string | null; error?: string | null }) {
	if (status === "sent") {
		const ps = providerStatus ?? "accepted";
		const map: Record<string, [string, string]> = {
			accepted: ["active", "Accepted by provider"], delivered: ["good", "Delivered"], delayed: ["warn", "Delayed"],
			bounced: ["bad", "Bounced"], complained: ["bad", "Spam complaint"], failed: ["bad", "Failed"],
		};
		const [tone, label] = map[ps] ?? ["active", ps];
		return <span className={`crm-pill ${tone}`} title="'Accepted' means the mail provider took the message; it is not proof of inbox delivery.">{label}</span>;
	}
	if (status === "queued") return <span className={`crm-pill ${error ? "warn" : "muted"}`} title={error ?? undefined}>{error ? "Queued — blocked" : "Queued"}</span>;
	if (status === "sending") return <span className="crm-pill muted">Sending…</span>;
	if (status === "failed") return <span className="crm-pill bad" title={error ?? undefined}>Failed — retrying</span>;
	if (status === "dead") return <span className="crm-pill bad" title={error ?? undefined}>Failed — gave up</span>;
	return <span className="crm-pill muted">{status}</span>;
}

export function FollowupChip({ at, state }: { at: string | null; state: "none" | "scheduled" | "due" | "overdue" }) {
	if (state === "none" || !at) return <span className="crm-sub">—</span>;
	const d = at.slice(0, 10);
	return <span className={`crm-pill ${state === "overdue" ? "bad" : state === "due" ? "warn" : "muted"}`}>{state === "overdue" ? "Overdue · " : state === "due" ? "Due · " : ""}{d}</span>;
}

export const EMAIL_CATEGORY_LABELS: Record<string, string> = {
	owner_new_inquiry: "New inquiry alert", customer_acknowledgment: "Customer acknowledgment", quotation: "Quotation", booking_confirmation: "Booking confirmation",
	customer_followup: "Customer follow-up", owner_quote_accepted: "Quote accepted alert", owner_followup_digest: "Follow-up digest", test: "Test email",
};
