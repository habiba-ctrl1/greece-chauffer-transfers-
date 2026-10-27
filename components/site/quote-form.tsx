"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { submitInquiry } from "@/lib/actions/leads";
import { CONTACT, whatsappHref } from "@/lib/site/config";
import { PHONE_CODES } from "@/lib/site/phone-codes";
import { CONDITIONAL_FIELDS, DESTINATION_OPTIONAL, SERVICE_LABELS, SERVICE_TYPES, type ServiceType } from "@/lib/crm/inquiry-input";
import { ArrowRight, Check } from "./icons";

export interface QuotePrefill {
  pickup?: string; destination?: string; date?: string; adults?: string; vehicle?: string; service?: string; topic?: string;
}

/** Older links use short service slugs — map them onto the full service list. */
const LEGACY_SERVICE: Record<string, ServiceType> = {
  airport: "airport_transfer", port: "port_transfer", chauffeur: "hourly_chauffeur", intercity: "intercity_transfer",
  tour: "private_tour", corporate: "point_to_point",
};
const resolveService = (s?: string, topic?: string): string => {
  if (s && (SERVICE_TYPES as readonly string[]).includes(s)) return s;
  if (s && LEGACY_SERVICE[s]) return LEGACY_SERVICE[s];
  return topic === "partner" ? "custom_journey" : "";
};

const STEPS = ["Service", "Journey", "Travellers", "Details", "Contact"] as const;
const todayLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

type Values = Record<string, string>;
const FIELD_STEP: Record<string, number> = {
  service: 0, pickup: 1, destination: 1, date: 1, time: 1, returnDate: 1, returnTime: 1, adults: 2, children: 2, luggage: 2, vehicle: 2,
  firstName: 4, lastName: 4, email: 4, phone: 4, consent: 4,
};

export function QuoteForm({ prefill = {} }: { prefill?: QuotePrefill }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>({
    service: resolveService(prefill.service, prefill.topic),
    pickup: prefill.pickup ?? "", destination: prefill.destination ?? "", date: prefill.date ?? "", time: "",
    returnDate: "", returnTime: "", adults: prefill.adults ?? "2", children: "0", luggage: "", vehicle: prefill.vehicle ?? "",
    firstName: "", lastName: "", email: "", phoneCode: "+30", phone: "", notes: "", consent: "",
    company_website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<{ reference?: string } | null>(null);
  const [pending, start] = useTransition();
  const top = useRef<HTMLFormElement>(null);
  const key = useRef("");
  const attribution = useRef<Record<string, string>>({});

  useEffect(() => {
    key.current = crypto.randomUUID();
    try {
      attribution.current = JSON.parse(sessionStorage.getItem("gcs_attr") ?? "{}");
    } catch { /* storage unavailable — attribution is optional */ }
  }, []);

  const svc = v.service as ServiceType;
  const has = (f: string) => !!svc && CONDITIONAL_FIELDS[svc]?.includes(f);
  const isReturn = svc === "return_transfer";
  const destOptional = DESTINATION_OPTIONAL.includes(svc);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => { const n = { ...x }; delete n[k]; return n; });
  };

  const fullPhone = () => {
    const raw = v.phone.trim();
    if (raw.startsWith("+")) return raw;
    return `${v.phoneCode}${raw.replace(/^0+/, "")}`;
  };

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0 && !v.service) e.service = "Please choose a service.";
    if (s === 1) {
      if (!v.pickup.trim()) e.pickup = "Please enter the pickup location.";
      if (!destOptional && !v.destination.trim()) e.destination = "Please enter the drop-off location.";
      if (!v.date) e.date = "Please choose a date."; else if (v.date < todayLocal()) e.date = "The date can't be in the past.";
      if (!v.time) e.time = "Please choose a pickup time.";
      if (isReturn) {
        if (!v.returnDate) e.returnDate = "Please choose the return date."; else if (v.date && v.returnDate < v.date) e.returnDate = "Return can't be before pickup.";
        if (!v.returnTime) e.returnTime = "Please choose the return time.";
      }
    }
    if (s === 2) {
      const a = Number(v.adults), c = Number(v.children || 0);
      if (!Number.isInteger(a) || a < 1 || a > 60) e.adults = "Enter 1–60 passengers.";
      if (!Number.isInteger(c) || c < 0 || c > 30) e.children = "Enter 0–30 children.";
    }
    if (s === 3 && svc === "hourly_chauffeur" && !v.duration_hours) e.duration_hours = "How many hours do you need?";
    if (s === 4) {
      if (!v.firstName.trim()) e.firstName = "Please enter your first name.";
      if (!v.lastName.trim()) e.lastName = "Please enter your last name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Please enter a valid email address.";
      if (!/^\+\d{7,15}$/.test(fullPhone().replace(/[\s\-().]/g, ""))) e.phone = "Please enter a valid phone number.";
      if (v.consent !== "on") e.consent = "Please accept the privacy notice to continue.";
    }
    return e;
  };

  const focusFirst = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0];
    requestAnimationFrame(() => (top.current?.querySelector(`[name="${first}"]`) as HTMLElement | null)?.focus());
  };

  const go = (to: number) => {
    setFormError("");
    setStep(to);
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return focusFirst(e);
    go(step + 1);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (pending) return;
    if (step < STEPS.length - 1) return next();
    for (let i = 0; i < STEPS.length; i++) {
      const e = validate(i);
      if (Object.keys(e).length) { setErrors(e); setStep(i); return focusFirst(e); }
    }
    const fd = new FormData();
    const { phoneCode: _pc, phone: _p, ...rest } = v;
    void _pc; void _p;
    Object.entries(rest).forEach(([k, val]) => fd.set(k, val));
    fd.set("phone", fullPhone());
    fd.set("idempotencyKey", key.current || crypto.randomUUID());
    fd.set("sourcePage", attribution.current.source || window.location.pathname);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) if (attribution.current[k]) fd.set(k, attribution.current[k]);
    setFormError("");
    start(async () => {
      try {
        const r = await submitInquiry(fd);
        if (r.ok) return setResult({ reference: r.reference });
        if (r.fieldErrors) {
          setErrors(r.fieldErrors);
          const bad = Object.keys(r.fieldErrors).map((k) => FIELD_STEP[k] ?? 3);
          if (bad.length) setStep(Math.min(...bad));
        }
        setFormError(r.error ?? "Something went wrong. Please try again.");
      } catch {
        setFormError("We couldn't reach the server. Your details are still here — please try again.");
      }
    });
  };

  if (result) {
    return (
      <div className="qf" id="quote" role="status" aria-live="polite">
        <div className="done-card">
          <Check />
          <h2 className="h3">Thank you, {v.firstName}.</h2>
          <p className="lede">
            Your request has been received. We&apos;ll review your journey and availability and reply to {v.email} with a quotation. This is not yet a booking — nothing is reserved until you have accepted a quotation from us.
          </p>
          {result.reference && result.reference !== "GCS-RECEIVED" && <p className="qf-meta">Reference {result.reference}</p>}
          {CONTACT.whatsapp && (
            <a className="btn btn-wa" href={whatsappHref(`Hello, I just sent a request (${result.reference}).`)} target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label>
      {label}
      <input className="fld" name={name} value={v[name] ?? ""} onChange={set(name)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `e-${name}` : undefined} {...props} />
      {errors[name] && <span className="ferr" id={`e-${name}`} role="alert">{errors[name]}</span>}
    </label>
  );
  const area = (name: string, label: string, placeholder?: string) => (
    <label>
      {label}
      <textarea className="fld" name={name} value={v[name] ?? ""} onChange={set(name)} placeholder={placeholder} maxLength={1000} />
    </label>
  );

  return (
    <form className="qf" id="quote" ref={top} onSubmit={submit} noValidate aria-label="Request a private quote" aria-busy={pending}>
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
          <legend>Which service do you need?</legend>
          <div className="opts" role="radiogroup" aria-label="Service">
            {SERVICE_TYPES.map((val) => (
              <label key={val} className="opt">
                <input type="radio" name="service" value={val} checked={v.service === val} onChange={set("service")} />
                <span>{SERVICE_LABELS[val]}</span>
              </label>
            ))}
          </div>
          {errors.service && <p className="ferr" role="alert">{errors.service}</p>}
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="qf-step">
          <legend>Tell us your journey</legend>
          {field("pickup", has("airport") && !isReturn ? "Pickup (airport, hotel or address)" : "Pickup location", { placeholder: "Airport, port, hotel or address", autoComplete: "off" })}
          {field("destination", destOptional ? "Destination (optional)" : "Drop-off location", { placeholder: "Where would you like to go?", autoComplete: "off" })}
          <div className="two">
            {field("date", "Pickup date", { type: "date", min: todayLocal() })}
            {field("time", "Pickup time", { type: "time" })}
          </div>
          {isReturn && (
            <div className="two">
              {field("returnDate", "Return date", { type: "date", min: v.date || todayLocal() })}
              {field("returnTime", "Return pickup time", { type: "time" })}
            </div>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="qf-step">
          <legend>Who is travelling?</legend>
          <div className="two">
            {field("adults", "Passengers (adults)", { type: "number", inputMode: "numeric", min: 1, max: 60 })}
            {field("children", "Children", { type: "number", inputMode: "numeric", min: 0, max: 30 })}
          </div>
          {field("luggage", "Luggage", { placeholder: "e.g. 3 large suitcases, 2 carry-ons", maxLength: 120 })}
          {field("vehicle", "Vehicle preference (optional)", { placeholder: "e.g. sedan, minivan, minibus", maxLength: 60 })}
          {has("child_seats") && (
            <div className="two">
              {field("child_seats", "Child seats needed", { type: "number", inputMode: "numeric", min: 0, max: 10, placeholder: "0" })}
              {has("child_seat_types") && field("child_seat_types", "Seat types / ages", { placeholder: "e.g. booster (6y), infant seat", maxLength: 200 })}
            </div>
          )}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="qf-step">
          <legend>A few details</legend>
          {has("airport") && field("airport", "Airport", { placeholder: "e.g. Athens (ATH)", maxLength: 120 })}
          {(has("flight_number") || has("airline")) && (
            <div className="two">
              {has("flight_number") && field("flight_number", "Flight number", { placeholder: "e.g. A3 601", maxLength: 20 })}
              {has("airline") && field("airline", "Airline", { maxLength: 80 })}
            </div>
          )}
          {has("arrival_details") && field("arrival_details", "Arrival details", { placeholder: "Terminal, landing time…", maxLength: 300 })}
          {has("port") && field("port", "Port", { placeholder: "e.g. Piraeus", maxLength: 120 })}
          {has("ferry_details") && field("ferry_details", "Ferry / cruise details", { placeholder: "Ship name, arrival time…", maxLength: 300 })}
          {has("hotel") && field("hotel", "Hotel, villa or accommodation", { maxLength: 200 })}
          {(has("duration_hours") || has("duration_days")) && (
            <div className="two">
              {has("duration_hours") && field("duration_hours", svc === "hourly_chauffeur" ? "Hours needed" : "Hours (optional)", { type: "number", inputMode: "numeric", min: 1, max: 24 })}
              {has("duration_days") && field("duration_days", "Days", { type: "number", inputMode: "numeric", min: 1, max: 30, placeholder: "1" })}
            </div>
          )}
          {has("tour_preferences") && area("tour_preferences", "Tour preferences", "Places, pace, interests…")}
          {has("stops") && area("stops", "Additional stops / itinerary", "Optional")}
          {has("meet_greet") && (
            <label className="check">
              <input type="checkbox" checked={v.meet_greet === "yes"} onChange={(e) => setV((s) => ({ ...s, meet_greet: e.target.checked ? "yes" : "" }))} />
              I&apos;d like to ask about a meet &amp; greet
            </label>
          )}
          {has("special") && area("special", "Accessibility or special requirements", "Optional")}
          {area("notes", "Anything else we should know?", "Optional")}
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="qf-step">
          <legend>How can we reach you?</legend>
          <div className="two">
            {field("firstName", "First name", { autoComplete: "given-name", maxLength: 60 })}
            {field("lastName", "Last name", { autoComplete: "family-name", maxLength: 60 })}
          </div>
          {field("email", "Email", { type: "email", autoComplete: "email", maxLength: 254, inputMode: "email" })}
          <div className="phone-row">
            <label>
              Code
              <select className="fld" name="phoneCode" value={v.phoneCode} onChange={set("phoneCode")} aria-label="Country calling code">
                {PHONE_CODES.map(([c, l]) => <option key={c + l} value={c}>{l}</option>)}
              </select>
            </label>
            {field("phone", "Phone number", { type: "tel", autoComplete: "tel-national", inputMode: "tel", maxLength: 30, placeholder: "e.g. 7700 900123" })}
          </div>
          <label className="check consent">
            <input type="checkbox" name="consent" checked={v.consent === "on"} onChange={(e) => { setV((s) => ({ ...s, consent: e.target.checked ? "on" : "" })); setErrors((x) => { const n = { ...x }; delete n.consent; return n; }); }} aria-invalid={!!errors.consent} />
            <span>I&apos;ve read the <Link href="/privacy" target="_blank">privacy notice</Link> and agree that you may use these details to reply to my request.</span>
          </label>
          {errors.consent && <p className="ferr" role="alert">{errors.consent}</p>}
        </fieldset>
      )}

      {formError && <p className="err" role="alert">{formError}</p>}

      <div className="qf-nav">
        {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)} disabled={pending}>Back</button> : <span />}
        {step < STEPS.length - 1 ? (
          <button type="submit" className="btn btn-primary">Continue <ArrowRight /></button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Request My Quote"}</button>
        )}
      </div>
      <p className="fine" style={{ margin: 0 }}>No payment is taken and nothing is booked by sending this form. We review every request and reply with a tailored quotation.</p>
    </form>
  );
}
