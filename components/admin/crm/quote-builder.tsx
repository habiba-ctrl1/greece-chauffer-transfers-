"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveQuotationAction } from "@/lib/actions/inquiries";
import { computeTotals, formatMoney, MoneyError } from "@/lib/crm/money";
import type { QuoteInput } from "@/lib/crm/quotes";
import { SendQuotationButton } from "@/components/admin/crm/controls";

type Line = { description: string; quantity: string; unitPrice: string };

export interface BuilderProps {
	quoteId: string;
	quoteNumber: string;
	version: number;
	inquiryId: string | null;
	inquiryRef: string | null;
	customer: { name: string; email: string | null };
	initial: Omit<QuoteInput, "items" | "discountValue" | "feesAmount" | "taxPercent" | "passengerCount"> & {
		passengerCount: string; discountValue: string; feesAmount: string; taxPercent: string; items: Line[];
	};
	readOnly: boolean;
	mailConfigured: boolean;
}

export function QuoteBuilder(p: BuilderProps) {
	const router = useRouter();
	const [v, setV] = useState(p.initial);
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
	const [dirty, setDirty] = useState(false);

	const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
		setV((s) => ({ ...s, [k]: val }));
		setDirty(true);
	};
	const setLine = (i: number, k: keyof Line, val: string) => set("items", v.items.map((l, j) => (j === i ? { ...l, [k]: val } : l)));

	const calc = useMemo(() => {
		try {
			return { t: computeTotals({ items: v.items, discountType: v.discountType, discountValue: v.discountType ? v.discountValue : null, feesAmount: v.feesAmount, taxPercent: v.taxPercent }), err: "" };
		} catch (e) {
			return { t: null, err: e instanceof MoneyError ? e.message : "Check the amounts." };
		}
	}, [v.items, v.discountType, v.discountValue, v.feesAmount, v.taxPercent]);

	const toInput = (): QuoteInput => ({
		...v,
		passengerCount: Number(v.passengerCount),
		items: v.items,
		discountValue: v.discountType ? v.discountValue : null,
		feesAmount: v.feesAmount || null,
		taxPercent: v.taxPercent || null,
	});

	const save = (then?: () => void) =>
		start(async () => {
			setMsg(null);
			try {
				const r = await saveQuotationAction(p.quoteId, toInput());
				if (!r.ok) return setMsg({ tone: "bad", text: r.error ?? "Could not save." });
				setDirty(false);
				setMsg({ tone: "good", text: "Draft saved." });
				router.refresh();
				then?.();
			} catch {
				setMsg({ tone: "bad", text: "Network problem — your edits are still on screen. Try saving again." });
			}
		});

	const fld = (label: string, k: keyof typeof v, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
		<label>{label}
			<input className="form-input" value={String(v[k] ?? "")} disabled={p.readOnly} onChange={(e) => set(k, e.target.value as never)} {...props} />
		</label>
	);
	const area = (label: string, k: keyof typeof v, rows = 3) => (
		<label>{label}
			<textarea className="form-input" rows={rows} value={String(v[k] ?? "")} disabled={p.readOnly} onChange={(e) => set(k, e.target.value as never)} />
		</label>
	);
	const cur = v.currency || "EUR";

	return (
		<div className="crm-stack">
			<div className="page-header">
				<div>
					<p style={{ fontSize: "0.8rem" }}>
						{p.inquiryId ? <Link href={`/admin/inquiries/${p.inquiryId}`} style={{ color: "var(--text-tertiary)" }}>← {p.inquiryRef}</Link> : <Link href="/admin/quotes" style={{ color: "var(--text-tertiary)" }}>← Quotes</Link>}
					</p>
					<h1>Quotation {p.quoteNumber} <span className="crm-pill gold">v{p.version}</span></h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>For {p.customer.name}{p.customer.email ? ` · ${p.customer.email}` : " · no email on file"}</p>
				</div>
				<div className="page-header-actions crm-actions">
					<a className="btn btn-secondary" href={`/admin/quotes/${p.quoteId}/pdf`} target="_blank" rel="noopener noreferrer">{p.readOnly ? "View PDF" : "Preview PDF (saved draft)"}</a>
				</div>
			</div>

			{p.readOnly && <div className="crm-alert warn">This quotation has been sent and is locked, so the document the customer received can&apos;t change. Create a new version from the inquiry page to make changes.</div>}
			{!p.mailConfigured && !p.readOnly && <div className="crm-alert warn">Email sending isn&apos;t configured yet — the quotation can be prepared and previewed, but sending will queue until it is.</div>}

			<section className="card">
				<div className="card-header"><h2 className="card-title">Journey</h2></div>
				<div className="crm-form">
					{area("Customer-facing journey description", "journeyDescription", 2)}
					<div className="row">{fld("Pickup", "pickup")}{fld("Drop-off", "destination")}</div>
					<div className="row">{fld("Date", "date", { type: "date" })}{fld("Time", "time", { type: "time" })}{fld("Return date", "returnDate", { type: "date" })}{fld("Return time", "returnTime", { type: "time" })}</div>
					<div className="row">{fld("Vehicle / service category", "vehicleCategory", { placeholder: "e.g. Mercedes V-Class" })}{fld("Passengers", "passengerCount", { type: "number", min: 1, max: 60 })}{fld("Luggage", "luggageInfo")}{fld("Flight", "flightNumber")}</div>
				</div>
			</section>

			<section className="card">
				<div className="card-header"><h2 className="card-title">Pricing</h2></div>
				<div className="crm-form">
					<div className="row">
						<label>Currency<input className="form-input" value={v.currency} maxLength={3} disabled={p.readOnly} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></label>
						<label>Valid until<input className="form-input" type="date" value={v.validUntil} disabled={p.readOnly} onChange={(e) => set("validUntil", e.target.value)} /></label>
					</div>
					<div className="crm-items">
						{v.items.map((l, i) => (
							<div className="crm-item" key={i}>
								<label>Description<input className="form-input" value={l.description} maxLength={300} disabled={p.readOnly} onChange={(e) => setLine(i, "description", e.target.value)} /></label>
								<label>Qty<input className="form-input" inputMode="decimal" value={l.quantity} disabled={p.readOnly} onChange={(e) => setLine(i, "quantity", e.target.value)} /></label>
								<label>Unit price<input className="form-input" inputMode="decimal" value={l.unitPrice} placeholder="0.00" disabled={p.readOnly} onChange={(e) => setLine(i, "unitPrice", e.target.value)} /></label>
								<div style={{ fontWeight: 600, paddingBottom: 10 }}>{calc.t?.lines[i] ? formatMoney(calc.t.lines[i].totalCents, cur) : "—"}</div>
								{!p.readOnly && <button type="button" className="btn btn-secondary btn-sm" aria-label={`Remove line ${i + 1}`} disabled={v.items.length < 2} onClick={() => set("items", v.items.filter((_, j) => j !== i))}>✕</button>}
							</div>
						))}
						{!p.readOnly && <div><button type="button" className="btn btn-secondary btn-sm" disabled={v.items.length >= 50} onClick={() => set("items", [...v.items, { description: "", quantity: "1", unitPrice: "" }])}>+ Add line</button></div>}
					</div>
					<div className="row">
						<label>Discount type
							<select className="form-select" value={v.discountType ?? ""} disabled={p.readOnly} onChange={(e) => set("discountType", (e.target.value || null) as never)}>
								<option value="">None</option><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option>
							</select>
						</label>
						{v.discountType && <label>{v.discountType === "percentage" ? "Discount %" : `Discount (${cur})`}<input className="form-input" inputMode="decimal" value={v.discountValue} disabled={p.readOnly} onChange={(e) => set("discountValue", e.target.value)} /></label>}
						<label>Additional charges ({cur})<input className="form-input" inputMode="decimal" value={v.feesAmount} placeholder="0.00" disabled={p.readOnly} onChange={(e) => set("feesAmount", e.target.value)} /></label>
						<label>Tax % (only if applicable)<input className="form-input" inputMode="decimal" value={v.taxPercent} placeholder="0" disabled={p.readOnly} onChange={(e) => set("taxPercent", e.target.value)} /></label>
					</div>
					{calc.err ? <div className="crm-alert bad" role="alert">{calc.err}</div> : calc.t && (
						<div className="crm-totals" aria-live="polite">
							<div><span>Subtotal</span><span>{formatMoney(calc.t.subtotalCents, cur)}</span></div>
							{calc.t.discountCents > 0 && <div><span>Discount</span><span>-{formatMoney(calc.t.discountCents, cur)}</span></div>}
							{calc.t.feesCents > 0 && <div><span>Additional charges</span><span>{formatMoney(calc.t.feesCents, cur)}</span></div>}
							{(calc.t.taxCents > 0 || Number(v.taxPercent) > 0) && <div><span>Tax ({v.taxPercent}%)</span><span>{formatMoney(calc.t.taxCents, cur)}</span></div>}
							<div className="grand"><span>Total</span><span>{formatMoney(calc.t.totalCents, cur)}</span></div>
						</div>
					)}
				</div>
			</section>

			<section className="card">
				<div className="card-header"><h2 className="card-title">Terms &amp; notes</h2></div>
				<div className="crm-form">
					<div className="row">{area("Included", "inclusions", 4)}{area("Not included", "exclusions", 4)}</div>
					<div className="row">{area("Payment terms", "paymentTerms", 4)}{area("Cancellation & amendment terms", "cancellationTerms", 4)}</div>
					{area("Notes shown to the customer", "notes", 3)}
					{area("Internal notes (never shown)", "internalNotes", 3)}
					<p className="crm-sub">Leave a section empty to omit it from the PDF — nothing is added on your behalf. Default terms can be set in Settings.</p>
				</div>
			</section>

			{!p.readOnly && (
				<div className="crm-actions" style={{ position: "sticky", bottom: 0, background: "var(--bg-page)", padding: "0.75rem 0", zIndex: 5 }}>
					<button className="btn btn-secondary" disabled={pending || !!calc.err} onClick={() => save()}>{pending ? "Saving…" : dirty ? "Save draft" : "Saved"}</button>
					<button className="btn btn-secondary" disabled={pending || !!calc.err} onClick={() => save(() => window.open(`/admin/quotes/${p.quoteId}/pdf`, "_blank", "noopener"))}>Save &amp; preview PDF</button>
					<SaveThenSend quoteId={p.quoteId} pending={pending} disabled={!!calc.err || !p.customer.email || !calc.t || calc.t.totalCents <= 0}
						save={(cb) => save(cb)} dirty={dirty}
						summary={<>
							<div><b>To:</b> {p.customer.name} &lt;{p.customer.email}&gt;</div>
							<div><b>Quotation:</b> {p.quoteNumber} (v{p.version})</div>
							<div><b>Journey:</b> {v.pickup}{v.destination ? ` → ${v.destination}` : ""} · {v.date} {v.time}</div>
							<div><b>Total:</b> {calc.t ? formatMoney(calc.t.totalCents, cur) : "—"} · valid until {v.validUntil}</div>
							<div><b>Attachment:</b> Quotation-{p.quoteNumber}.pdf <a href={`/admin/quotes/${p.quoteId}/pdf`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>(preview saved draft)</a></div>
						</>} />
					{msg && <span role="status" className={`crm-alert ${msg.tone}`}>{msg.text}</span>}
					{!p.customer.email && <span className="crm-alert bad">Add a customer email before sending.</span>}
				</div>
			)}
		</div>
	);
}

/** Saves any pending edits first so the reviewed/sent document always matches the screen. */
function SaveThenSend({ quoteId, summary, disabled, dirty, save, pending }: { quoteId: string; summary: React.ReactNode; disabled: boolean; dirty: boolean; save: (cb?: () => void) => void; pending: boolean }) {
	const [ready, setReady] = useState(false);
	if (!ready) {
		return <button className="btn btn-primary" disabled={disabled || pending} onClick={() => (dirty ? save(() => setReady(true)) : setReady(true))}>Review &amp; send…</button>;
	}
	return <ReadyDialog quoteId={quoteId} summary={summary} onClose={() => setReady(false)} />;
}

function ReadyDialog({ quoteId, summary, onClose }: { quoteId: string; summary: React.ReactNode; onClose: () => void }) {
	return (
		<>
			<SendQuotationButton quoteId={quoteId} summary={summary} openInitially />
			<button className="btn btn-secondary" onClick={onClose}>Keep editing</button>
		</>
	);
}
