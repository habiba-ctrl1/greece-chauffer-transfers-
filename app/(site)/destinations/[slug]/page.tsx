import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/site/photo";
import { FinalCta } from "@/components/site/final-cta";
import { ArrowRight } from "@/components/site/icons";
import { DESTINATIONS, destinationBySlug, img, serviceBySlug } from "@/lib/site/content";

export const dynamicParams = false;
export const generateStaticParams = () => DESTINATIONS.map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = destinationBySlug((await params).slug);
  if (!d) return {};
  return { title: `Private Chauffeur & Transfers — ${d.name}`, description: `${d.blurb} ${d.intro}`.slice(0, 300), alternates: { canonical: `/destinations/${d.slug}` } };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = destinationBySlug((await params).slug);
  if (!d) notFound();
  const services = d.services.map(serviceBySlug).filter((s): s is NonNullable<typeof s> => !!s);
  const others = DESTINATIONS.filter((x) => x.slug !== d.slug).slice(0, 5);
  return (
    <>
      <PageHero crumbs={[{ name: "Destinations", href: "/destinations" }, { name: d.name }]} title={d.name} lede={d.blurb} />
      <section className="section--tight">
        <div className="wrap page-grid">
          <div>
            <Photo src={img(d.image)} alt={`${d.name} — illustrative image`} sizes="(min-width: 960px) 60vw, 100vw" className="page-img" />
            <div className="stack">
              <p className="lede" style={{ maxWidth: "62ch" }}>{d.intro}</p>
              <h2>Ways to travel to and around {d.name}</h2>
              <div className="rel">
                {services.map((s) => <Link key={s.slug} href={`/services/${s.slug}`}>{s.cta}</Link>)}
              </div>
              <h2>More destinations</h2>
              <div className="rel">
                {others.map((o) => <Link key={o.slug} href={`/destinations/${o.slug}`}>{o.name}</Link>)}
              </div>
            </div>
          </div>
          <aside className="aside">
            <h2 className="h3">Travelling to {d.name}?</h2>
            <p style={{ color: "var(--muted)" }}>Tell us your dates and group and we&apos;ll confirm what we can arrange.</p>
            <Link className="btn btn-primary" href={`/contact?destination=${encodeURIComponent(d.name)}#quote`}>Request a Private Quote <ArrowRight /></Link>
          </aside>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
