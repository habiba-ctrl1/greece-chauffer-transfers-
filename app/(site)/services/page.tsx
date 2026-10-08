import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { ServiceCard } from "@/components/site/service-card";
import { FinalCta } from "@/components/site/final-cta";
import { SERVICES } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Private Chauffeur & Transfer Services in Greece",
  description: "Airport and port transfers, private chauffeur, intercity journeys, private tours and corporate transportation across Greece.",
  alternates: { canonical: "/services" },
};

export default function ServicesIndex() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Services" }]}
        title={<>Every way you need <em>to travel.</em></>}
        lede="Private airport and port transfers, chauffeur hire, intercity journeys, tours and corporate transport across Greece."
      />
      <section className="section--tight">
        <div className="wrap svc-grid">
          {SERVICES.map((s, i) => <div key={s.slug} className="svc-cell"><ServiceCard service={s} index={i} /></div>)}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
