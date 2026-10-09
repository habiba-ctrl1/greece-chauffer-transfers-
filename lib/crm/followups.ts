// ============================================================
// Follow-up scheduling rules (pure — intervals come from settings)
// ============================================================
import type { CrmSettings } from "@/lib/crm/settings";
import { FOLLOWUP_ELIGIBLE, type InquiryStatus } from "@/lib/crm/status";

const HOUR = 3600_000;
const addHours = (d: Date, h: number) => new Date(d.getTime() + h * HOUR).toISOString();

/** Initial reminder for a brand-new inquiry. */
export function initialFollowup(createdAt: Date, s: CrmSettings): string | null {
	return s.followupNewHours > 0 ? addHours(createdAt, s.followupNewHours) : null;
}

/** First reminder after a quotation has been sent. */
export function afterQuoteSent(sentAt: Date, s: CrmSettings): string | null {
	return s.followupQuote1Hours > 0 ? addHours(sentAt, s.followupQuote1Hours) : null;
}

/**
 * Next reminder after the owner marks a follow-up as done without the
 * customer having responded. `doneCount` is the number of follow-ups done
 * for the current quotation (including this one).
 */
export function afterFollowupDone(args: {
	status: InquiryStatus;
	quoteSentAt: Date | null;
	doneCount: number;
	now: Date;
	settings: CrmSettings;
}): string | null {
	const { status, quoteSentAt, doneCount, now, settings: s } = args;
	if (!FOLLOWUP_ELIGIBLE.includes(status)) return null;
	if (status === "quote_sent" && quoteSentAt && doneCount === 1 && s.followupQuote2Hours > 0) {
		const second = new Date(quoteSentAt.getTime() + s.followupQuote2Hours * HOUR);
		if (second.getTime() > now.getTime()) return second.toISOString();
		return addHours(now, 24);
	}
	return s.followupRepeatHours > 0 ? addHours(now, s.followupRepeatHours) : null;
}

export type FollowupState = "none" | "scheduled" | "due" | "overdue";

/** "due" = due today; "overdue" = earlier than the start of today (Athens). */
export function followupState(nextFollowupAt: string | null, status: InquiryStatus, now: Date, athensStartOfTodayIso: string): FollowupState {
	if (!nextFollowupAt || !FOLLOWUP_ELIGIBLE.includes(status)) return "none";
	if (new Date(nextFollowupAt).getTime() > now.getTime()) return "scheduled";
	return nextFollowupAt < athensStartOfTodayIso ? "overdue" : "due";
}
