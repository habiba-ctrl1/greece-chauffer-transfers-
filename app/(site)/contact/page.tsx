import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { QuoteForm } from "@/components/site/quote-form";
import { CONTACT, phoneHref, whatsappHref } from "@/lib/site/config";

export const metadata: Metadata = {
  title: "Request a Private Quote",
  description: "Tell us your journey and receive a tailored quote for a private chauffeur or transfer in Greece.",
  alternates: { canonical: "/contact" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 200);

export default async function ContactPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const prefill = {
    pickup: one(sp.pickup), destination: one(sp.destination), date: one(sp.date),
    adults: one(sp.adults), vehicle: one(sp.vehicle), service: one(sp.service), topic: one(sp.topic),
  };
  return (
    <>
      <PageHero
        crumbs={[{ name: "Request a Quote" }]}
        title={<>Tell us <em>your journey.</em></>}
        lede="Share where you are going, when, and who is travelling. We reply with a tailored quote — never an automatic price."
      />
      <section className="section--tight">
        <div className="wrap contact-grid">
          <div className="stack">
            <h2 className="h3">Prefer to talk?</h2>
            <ul className="contact-list">
              <li><small>WhatsApp</small>{CONTACT.whatsapp ? <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">Message us</a> : <span>Use the form — WhatsApp coming soon</span>}</li>
              {CONTACT.phone && phoneHref && <li><small>Phone</small><a href={phoneHref}>{CONTACT.phone}</a></li>}
              {CONTACT.email && <li><small>Email</small><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>}
              <li><small>Coverage</small><span>Athens and destinations across Greece</span></li>
            </ul>
          </div>
          <QuoteForm prefill={prefill} />
        </div>
      </section>
    </>
  );
}
