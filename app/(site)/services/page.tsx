import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { FinalCta } from "@/components/site/final-cta";
import { FaqList } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { ArrowRight } from "@/components/site/icons";
import { FLEET, SERVICES, STEPS } from "@/lib/site/content";
import { SITE_URL } from "@/lib/site/config";

export const metadata: Metadata = {
  title: "Private Chauffeur & Transfer Services in Greece",
  description:
    "Airport and port transfers, private chauffeur and hourly hire, intercity journeys, private tours and corporate transportation across Greece. Choose your journey and request a quote.",
  alternates: { canonical: "/services" },
  openGraph: { type: "website", url: "/services", title: "Private Chauffeur & Transfer Services in Greece" },
};

// Services grouped by what the traveller is trying to do. Only published pages may be listed.
const GROUPS: { label: string; title: string; text: string; slugs: { slug: string; when: string }[] }[] = [
  {
    label: "Arriving & departing",
    title: "Getting to and from Greece",
    text: "One journey between an airport or port and where you are staying.",
    slugs: [
      { slug: "airport-transfers", when: "You have a flight and need to reach a hotel, villa or office." },
      { slug: "port-transfers", when: "You are arriving or leaving by cruise or ferry, mainly through Piraeus." },
    ],
  },
  {
    label: "Around the city",
    title: "A chauffeur for your day",
    text: "A driver and vehicle reserved for your plan, with several stops.",
    slugs: [
      { slug: "private-chauffeur", when: "You want a dedicated driver and are weighing chauffeur against a transfer." },
      { slug: "hourly-chauffeur", when: "You know roughly how many hours you need and the places you will visit." },
    ],
  },
  {
    label: "Beyond Athens",
    title: "Travelling across Greece",
    text: "Longer road journeys, as a one-way transfer or a full day out.",
    slugs: [
      { slug: "intercity-transfers", when: "You are moving from one destination to another, such as Athens to Nafplio." },
      { slug: "private-tours", when: "You want a day of sightseeing, for example Cape Sounion or Delphi." },
    ],
  },
  {
    label: "For business",
    title: "Corporate and group travel",
    text: "Coordinated transport for executives, delegations and events.",
    slugs: [{ slug: "corporate-transportation", when: "You are arranging transport for staff, guests or an event programme." }],
  },
];

const FAQS = [
  { q: "Which service should I choose?", a: "Choose a transfer for one journey between two places, a chauffeur when your plan has several stops, and a tour when sightseeing is the purpose. If you are unsure, describe your plan in the quote form and we will suggest the right format." },
  { q: "Do you show prices online?", a: "No. Every journey depends on the route, date, vehicle and waiting time, so we reply with a tailored quote. No payment is taken when you request one." },
  { q: "How far ahead should I request a quote?", a: "As early as your plans are fixed, especially for peak season, groups and tours. For shorter notice, message us and we will tell you what is possible." },
  { q: "What do I need to include in my request?", a: "Pickup and destination, date and time, number of passengers and suitcases, and flight or ship details if relevant. For chauffeur bookings, add your stops and the hours you need." },
  { q: "Can I combine services?", a: "Yes. A common example is an airport transfer followed by a chauffeur day, or a port transfer with a stop at the Acropolis. Describe the whole plan in one request." },
];

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Private chauffeur and transfer services in Greece",
    url: `${SITE_URL}/services`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: SERVICES.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.title,
        url: `${SITE_URL}/services/${s.slug}`,
      })),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

export default function ServicesIndex() {
  const bySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
  return (
    <>
      <JsonLd data={SCHEMA} />
      <PageHero
        crumbs={[{ name: "Services" }]}
        title={<>Choose the journey, <em>we plan the rest.</em></>}
        lede="Private airport and port transfers, chauffeur hire, intercity journeys, tours and corporate transport across Greece. Every service is arranged in advance and quoted individually."
      />

      <section className="section--tight" aria-labelledby="hub-journeys">
        <div className="wrap">
          <SectionHeading id="hub-journeys" eyebrow="Find your service" lede="Start with what you are trying to do. Each service has its own page with the questions, routes and planning details that matter for it.">
            Services by <em>Journey Type</em>
          </SectionHeading>
          <div className="hub-groups">
            {GROUPS.map((g, gi) => (
              <Reveal key={g.label} className="hub-group">
                <div className="hub-group-head">
                  <p className="eyebrow">{g.label}</p>
                  <h3>{g.title}</h3>
                  <p>{g.text}</p>
                </div>
                <ol className="ruled">
                  {g.slugs.map(({ slug, when }, si) => {
                    const s = bySlug(slug);
                    if (!s) return null;
                    return (
                      <li key={slug}>
                        <span className="idx">{String(GROUPS.slice(0, gi).reduce((a, x) => a + x.slugs.length, 0) + si + 1).padStart(2, "0")}</span>
                        <h3>{s.title}</h3>
                        <p>{when}</p>
                        <Link className="link-arrow" href={`/services/${slug}`}>{s.cta} <ArrowRight /></Link>
                      </li>
                    );
                  })}
                </ol>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section on-sand" aria-labelledby="hub-vehicles">
        <div className="wrap">
          <SectionHeading id="hub-vehicles" eyebrow="Choosing a vehicle" lede="The right vehicle depends on how many people are travelling, how much luggage they carry and how long the journey is. Tell us both numbers and we recommend one for your dates.">
            Match the Vehicle <em>to the Journey</em>
          </SectionHeading>
          <div className="pcards">
            {FLEET.slice(0, 4).map((v, i) => (
              <Reveal key={v.id} className="pc" delay={(i % 4) * 70}>
                <h3>{v.name}</h3>
                <p>{v.bestFor}</p>
              </Reveal>
            ))}
          </div>
          <p className="fine" style={{ marginTop: 20 }}>Exact capacity depends on the vehicle available for your dates and is confirmed in your quote.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="hub-process">
        <div className="wrap">
          <SectionHeading id="hub-process" eyebrow="How it works">
            From Enquiry <em>to Journey</em>
          </SectionHeading>
          <ol className="ruled">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="idx">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <span />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section on-white" aria-labelledby="hub-faq">
        <div className="wrap">
          <SectionHeading id="hub-faq" eyebrow="Before you choose" center>
            Questions <em>About Our Services</em>
          </SectionHeading>
          <FaqList items={FAQS} />
          <p className="fine" style={{ textAlign: "center", marginTop: 24 }}>
            More answers on the <Link href="/faq" className="link-arrow">full FAQ</Link>, or explore <Link href="/destinations" className="link-arrow">destinations we serve</Link>.
          </p>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
