import Link from "next/link";
import { FaqList } from "../faq";
import { Photo } from "../photo";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";
import { ArrowRight, WhatsAppGlyph } from "../icons";
import { QuoteForm } from "../quote-form";
import { CONTACT, phoneHref, whatsappHref } from "@/lib/site/config";
import { SERVICES, img } from "@/lib/site/content";
import type { ServicePage } from "@/lib/site/services/types";

export function AnswerBlock({ text }: { text: string }) {
  return (
    <section className="answer" aria-label="Service summary">
      <div className="wrap">
        <Reveal className="answer-in">
          <p className="eyebrow">In short</p>
          <p className="answer-text">{text}</p>
        </Reveal>
      </div>
    </section>
  );
}

export function ServiceFaq({ faq }: { faq: ServicePage["faq"] }) {
  return (
    <section className="section" id="faq" aria-labelledby="sfaq-t">
      <div className="wrap">
        <SectionHeading id="sfaq-t" eyebrow="Questions" center>
          Questions <em>Travellers Ask</em>
        </SectionHeading>
        <FaqList items={faq} />
      </div>
    </section>
  );
}

export function RelatedServices({ related }: { related: ServicePage["related"] }) {
  const items = related
    .map((r) => ({ ...r, s: SERVICES.find((x) => x.slug === r.slug) }))
    .filter((r): r is typeof r & { s: NonNullable<typeof r.s> } => !!r.s);
  return (
    <section className="section on-sand" aria-labelledby="rel-t">
      <div className="wrap">
        <SectionHeading id="rel-t" eyebrow="Related services">
          Often Booked <em>Alongside</em>
        </SectionHeading>
        <div className="relsvc">
          {items.map(({ s, note }) => (
            <Link key={s.slug} href={`/services/${s.slug}`} className="tile">
              <Photo src={img(s.image)} alt={`${s.title}: illustrative image`} sizes="(min-width:900px) 30vw, 100vw" />
              <div className="tile-in">
                <h3>{s.title}</h3>
                <p>{note}</p>
                <span className="go">{s.cta} <ArrowRight /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServiceFinalCta({ page }: { page: ServicePage }) {
  return (
    <section className="section on-navy sfinal" aria-labelledby="sfinal-t">
      <div className="wrap sfinal-grid">
        <Reveal className="stack">
          <p className="eyebrow">Request a quote</p>
          <h2 id="sfinal-t" className="h2">{page.closing.title} <em>{page.closing.em}</em></h2>
          <p className="lede">{page.closing.text}</p>
          <div className="hero-ctas">
            <a
              className="btn btn-wa"
              href={whatsappHref(page.whatsappText)}
              {...(CONTACT.whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <WhatsAppGlyph /> WhatsApp Us
            </a>
            {CONTACT.phone && phoneHref && <a className="btn btn-ghost" href={phoneHref}>{CONTACT.phone}</a>}
          </div>
          <p className="fine" style={{ color: "rgba(247,245,240,.6)" }}>No payment is taken when you request a quote.</p>
        </Reveal>
        <div className="qf-on-navy"><QuoteForm prefill={{ service: page.quoteService }} /></div>
      </div>
    </section>
  );
}
