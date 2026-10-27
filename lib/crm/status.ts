// ============================================================
// Inquiry status workflow
// ============================================================
// "Follow-up Due" is derived (next_followup_at <= now), not stored.
// Booking status, quotation status, payment status and email status are all
// separate concepts and live in their own columns/tables.

export const INQUIRY_STATUSES = [
	"new", "reviewing", "awaiting_info", "preparing_quote", "quote_sent",
	"accepted", "confirmed", "completed", "lost", "cancelled",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
	new: "New Inquiry",
	reviewing: "Reviewing Request",
	awaiting_info: "Awaiting Information",
	preparing_quote: "Preparing Quotation",
	quote_sent: "Quotation Sent",
	accepted: "Accepted / Awaiting Confirmation",
	confirmed: "Confirmed Booking",
	completed: "Completed",
	lost: "Lost",
	cancelled: "Cancelled",
};

export const TERMINAL_STATUSES: InquiryStatus[] = ["completed", "lost", "cancelled"];
/** Statuses where reminders make sense. */
export const FOLLOWUP_ELIGIBLE: InquiryStatus[] = ["new", "reviewing", "awaiting_info", "preparing_quote", "quote_sent", "accepted"];

const OPEN: InquiryStatus[] = ["new", "reviewing", "awaiting_info", "preparing_quote", "quote_sent", "accepted"];

export const TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
	new: ["reviewing", "awaiting_info", "preparing_quote", "quote_sent", "lost", "cancelled"],
	reviewing: ["awaiting_info", "preparing_quote", "quote_sent", "lost", "cancelled", "new"],
	awaiting_info: ["reviewing", "preparing_quote", "quote_sent", "lost", "cancelled"],
	preparing_quote: ["reviewing", "awaiting_info", "quote_sent", "lost", "cancelled"],
	quote_sent: ["reviewing", "awaiting_info", "preparing_quote", "accepted", "lost", "cancelled"],
	accepted: ["quote_sent", "confirmed", "lost", "cancelled"],
	confirmed: ["completed", "cancelled"],
	completed: [],
	lost: ["reviewing"],
	cancelled: ["reviewing"],
};

export function canTransition(from: InquiryStatus, to: InquiryStatus): boolean {
	return from !== to && TRANSITIONS[from].includes(to);
}

export const isOpenStatus = (s: InquiryStatus) => OPEN.includes(s);

/** Statuses that must go through a dedicated action (they create/require records). */
export const GUARDED_TARGETS: InquiryStatus[] = ["confirmed", "completed", "quote_sent"];

export type QuoteState = "draft" | "sent" | "accepted" | "rejected" | "expired" | "superseded";

/** Display state of a quotation row (superseded is stored as cancelled + superseded_by_id). */
export function quoteState(q: { status: string; superseded_by_id?: string | null }): QuoteState {
	if (q.superseded_by_id) return "superseded";
	if (q.status === "viewed") return "sent";
	if (q.status === "cancelled") return "superseded";
	return q.status as QuoteState;
}
