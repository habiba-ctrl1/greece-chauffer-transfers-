// Small formatting helpers shared by admin pages.
import { followupState, type FollowupState } from "@/lib/crm/followups";
import { athensDayStart } from "@/lib/crm/queries";
import type { InquiryStatus } from "@/lib/crm/status";

export function followupOf(i: { next_followup_at: string | null; status: InquiryStatus }, now: Date = new Date()): FollowupState {
	return followupState(i.next_followup_at, i.status, now, athensDayStart(now));
}

export const fmtDateTime = (iso: string | null | undefined) => {
	if (!iso) return "—";
	const d = new Date(iso.includes("T") || iso.includes("Z") ? iso : `${iso.replace(" ", "T")}Z`);
	if (Number.isNaN(d.getTime())) return iso;
	return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Athens", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

export const money = (v: number | null | undefined, cur = "EUR") =>
	v === null || v === undefined ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: cur }).format(v);

export const qs = (base: Record<string, string | number | undefined | null>, over: Record<string, string | number | undefined | null> = {}) => {
	const p = new URLSearchParams();
	for (const [k, v] of Object.entries({ ...base, ...over })) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
	const s = p.toString();
	return s ? `?${s}` : "";
};
