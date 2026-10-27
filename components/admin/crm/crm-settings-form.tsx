"use client";

import { useState, useTransition } from "react";
import { saveCrmSettingsAction } from "@/lib/actions/inquiries";
import type { CrmSettings } from "@/lib/crm/settings";

type Fields = Pick<CrmSettings, "followupNewHours" | "followupQuote1Hours" | "followupQuote2Hours" | "followupRepeatHours" | "taxPercent" | "paymentTerms" | "cancellationTerms" | "inclusions" | "exclusions">;

export function CrmSettingsForm({ initial }: { initial: Fields }) {
	const [v, setV] = useState<Record<keyof Fields, string>>({
		followupNewHours: String(initial.followupNewHours), followupQuote1Hours: String(initial.followupQuote1Hours), followupQuote2Hours: String(initial.followupQuote2Hours),
		followupRepeatHours: String(initial.followupRepeatHours), taxPercent: String(initial.taxPercent), paymentTerms: initial.paymentTerms, cancellationTerms: initial.cancellationTerms,
		inclusions: initial.inclusions, exclusions: initial.exclusions,
	});
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<{ tone: string; text: string } | null>(null);
	const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
	const num = (k: keyof Fields, label: string, hint: string) => (
		<label>{label}<input className="form-input" type="number" min={0} step="any" value={v[k]} onChange={set(k)} /><span className="crm-sub">{hint}</span></label>
	);
	return (
		<form className="card" style={{ marginTop: "1.5rem" }} onSubmit={(e) => {
			e.preventDefault();
			start(async () => {
				const r = await saveCrmSettingsAction({
					followupNewHours: Number(v.followupNewHours), followupQuote1Hours: Number(v.followupQuote1Hours), followupQuote2Hours: Number(v.followupQuote2Hours),
					followupRepeatHours: Number(v.followupRepeatHours), taxPercent: Number(v.taxPercent), paymentTerms: v.paymentTerms, cancellationTerms: v.cancellationTerms,
					inclusions: v.inclusions, exclusions: v.exclusions,
				});
				setMsg(r.ok ? { tone: "good", text: "Saved." } : { tone: "bad", text: r.error ?? "Could not save." });
			});
		}}>
			<div className="card-header"><h3 className="card-title">Follow-up reminders &amp; quotation defaults</h3></div>
			<div className="crm-form">
				<div className="row">
					{num("followupNewHours", "New inquiry → reminder (hours)", "0 turns it off")}
					{num("followupQuote1Hours", "After quotation sent → 1st follow-up (hours)", "Suggested: 24")}
					{num("followupQuote2Hours", "After quotation sent → 2nd follow-up (hours)", "Suggested: 72")}
					{num("followupRepeatHours", "Then repeat every (hours)", "0 = stop reminding")}
				</div>
				<div className="row">{num("taxPercent", "Tax % added to new quotations", "Leave 0 unless a tax line is correct for your business")}</div>
				<div className="row">
					<label>Default payment terms<textarea className="form-input" rows={4} value={v.paymentTerms} onChange={set("paymentTerms")} /></label>
					<label>Default cancellation &amp; amendment terms<textarea className="form-input" rows={4} value={v.cancellationTerms} onChange={set("cancellationTerms")} /></label>
				</div>
				<div className="row">
					<label>Default inclusions<textarea className="form-input" rows={3} value={v.inclusions} onChange={set("inclusions")} /></label>
					<label>Default exclusions<textarea className="form-input" rows={3} value={v.exclusions} onChange={set("exclusions")} /></label>
				</div>
				<p className="crm-sub">Reminder intervals are internal scheduling defaults — they are not promises to customers. Terms stay empty until you write them; nothing is invented.</p>
				<div className="crm-actions"><button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save reminders & defaults"}</button></div>
				{msg && <div role="status" className={`crm-alert ${msg.tone}`}>{msg.text}</div>}
			</div>
		</form>
	);
}
