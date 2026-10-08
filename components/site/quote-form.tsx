"use client";

import { useRef, useState, useTransition } from "react";
import { submitQuoteRequest } from "@/lib/actions/leads";
import { CONTACT, whatsappHref } from "@/lib/site/config";
import { ArrowRight, Check } from "./icons";

export interface QuotePrefill {
  pickup?: string; destination?: string; date?: string; adults?: string; vehicle?: string; service?: string; topic?: string;
}

const SERVICES = [
  ["airport", "Airport transfer"], ["port", "Port transfer"], ["chauffeur", "Private chauffeur"],
  ["intercity", "Intercity transfer"], ["tour", "Private tour"], ["corporate", "Corporate / VIP"],
] as const;

const STEPS = ["Journey", "Passengers", "Service", "Contact", "Notes"] as const;

type Values = Record<string, string>;

export function QuoteForm({ prefill = {} }: { prefill?: QuotePrefill }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>({
    pickup: prefill.pickup ?? "", destination: prefill.destination ?? "", date: prefill.date ?? "", time: "",
    adults: prefill.adults ?? "2", children: "0", luggage: "",
    service: prefill.service ?? (prefill.topic === "partner" ? "corporate" : ""), vehicle: prefill.vehicle ?? "",
    name: "", email: "", phone: "", whatsapp: "",
    flight: "", hotel: "", requirements: "", stops: "", childSeat: "", company_website: "",
  });
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reference?: string } | null>(null);
  const [pending, start] = useTransition();
  const top = useRef<HTMLFormElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const validate = (s: number): string => {
    if (s === 0 && (!v.pickup.trim() || !v.destination.trim() || !v.date)) return "Please add a pickup, destination and date.";
    if (s === 1 && (Number(v.adults) < 1)) return "Please add at least one adult passenger.";
    if (s === 2 && !v.service) return "Please choose the service you need.";
    if (s === 3 && (!v.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))) return "Please add your name and a valid email address.";
    return "";
  };

  const go = (to: number) => {
    setError("");
    setStep(to);
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const next = () => {
    const e = validate(step);
    if (e) return setError(e);
    go(step + 1);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validate(i);
      if (err) { setStep(i); return setError(err); }
    }
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => fd.set(k, val));
    start(async () => {
      const r = await submitQuoteRequest(fd);
      if (r.ok) setResult({ reference: r.reference });
      else setError(r.error ?? "Something went wrong. Please try again.");
    });
  };

  if (result) {
    return (
      <div className="qf" id="quote" role="status">
        <div className="done-card">
          <Check />
          <h2 className="h3">Thank you, {v.name.split(" ")[0]}.</h2>
          <p className="lede">
            We&apos;ve received your request and will reply to {v.email} with a tailored quote. We don&apos;t show automatic prices — every journey is quoted individually.
          </p>
          {result.reference && <p className="qf-meta">Reference {result.reference}</p>}
          {CONTACT.whatsapp && (
            <a className="btn btn-wa" href={whatsappHref(`Hello, I just sent a quote request (${result.reference}).`)} target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="qf" id="quote" ref={top} onSubmit={submit} noValidate aria-label="Request a private quote">
      <div>
        <p className="qf-meta">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        <div className="progress" aria-hidden="true" style={{ marginTop: 12 }}>
          {STEPS.map((s, i) => <i key={s} className={i <= step ? "done" : ""} />)}
        </div>
      </div>

      <div className="hp" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" name="company_website" value={v.company_website} onChange={set("company_website")} /></label>
      </div>

      {step === 0 && (
        <fieldset className="qf-step">
          <legend>Tell us your journey</legend>
          <label>Pickup<input className="fld" value={v.pickup} onChange={set("pickup")} placeholder="Airport, port, hotel or address" autoComplete="off" /></label>
          <label>Destination<input className="fld" value={v.destination} onChange={set("destination")} placeholder="Where would you like to go?" autoComplete="off" /></label>
          <div className="two">
            <label>Date<input className="fld" type="date" value={v.date} onChange={set("date")} /></label>
            <label>Pickup time<input className="fld" type="time" value={v.time} onChange={set("time")} /></label>
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="qf-step">
          <legend>Who is travelling?</legend>
          <div className="two">
            <label>Adults<input className="fld" type="number" min={1} max={60} value={v.adults} onChange={set("adults")} /></label>
            <label>Children<input className="fld" type="number" min={0} max={60} value={v.children} onChange={set("children")} /></label>
          </div>
          <label>Luggage<input className="fld" value={v.luggage} onChange={set("luggage")} placeholder="e.g. 3 large suitcases, 2 carry-ons" /></label>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="qf-step">
          <legend>Which service do you need?</legend>
          <div className="opts" role="radiogroup" aria-label="Service">
            {SERVICES.map(([val, label]) => (
              <label key={val} className="opt">
                <input type="radio" name="service" value={val} checked={v.service === val} onChange={set("service")} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {v.vehicle && <p className="fine">Vehicle preference noted: {v.vehicle}</p>}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="qf-step">
          <legend>How can we reach you?</legend>
          <div className="two">
            <label>Full name<input className="fld" value={v.name} onChange={set("name")} autoComplete="name" /></label>
            <label>Email<input className="fld" type="email" value={v.email} onChange={set("email")} autoComplete="email" /></label>
          </div>
          <div className="two">
            <label>Phone<input className="fld" type="tel" value={v.phone} onChange={set("phone")} autoComplete="tel" /></label>
            <label>WhatsApp (if different)<input className="fld" type="tel" value={v.whatsapp} onChange={set("whatsapp")} /></label>
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="qf-step">
          <legend>Anything else we should know?</legend>
          <div className="two">
            <label>{v.service === "port" ? "Ship name & times" : v.service === "airport" ? "Flight number" : "Flight / ship (if relevant)"}<input className="fld" value={v.flight} onChange={set("flight")} placeholder={v.service === "port" ? "e.g. ship, port, arrival time" : "Optional"} /></label>
            <label>Hotel / address<input className="fld" value={v.hotel} onChange={set("hotel")} placeholder="Optional" /></label>
          </div>
          <label>Additional stops<input className="fld" value={v.stops} onChange={set("stops")} placeholder="Optional" /></label>
          <label>Special requirements<textarea className="fld" value={v.requirements} onChange={set("requirements")} placeholder="Accessibility, timing, preferences…" /></label>
          <label className="check">
            <input type="checkbox" checked={v.childSeat === "yes"} onChange={(e) => setV((s) => ({ ...s, childSeat: e.target.checked ? "yes" : "" }))} />
            I need a child seat (tell us the ages in the notes)
          </label>
        </fieldset>
      )}

      {error && <p className="err" role="alert">{error}</p>}

      <div className="qf-nav">
        {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>Back</button> : <span />}
        {step < STEPS.length - 1 ? (
          <button type="submit" className="btn btn-primary">Continue <ArrowRight /></button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Request My Quote"}</button>
        )}
      </div>
      <p className="fine" style={{ margin: 0 }}>No payment is taken. We&apos;ll reply with a tailored quote — prices are never shown automatically.</p>
    </form>
  );
}
