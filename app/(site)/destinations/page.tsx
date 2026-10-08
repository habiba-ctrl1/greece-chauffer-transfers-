import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { DestinationCard } from "@/components/site/destinations-section";
import { FinalCta } from "@/components/site/final-cta";
import { DESTINATIONS } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Chauffeur Destinations in Greece",
  description: "Private transfers and chauffeur-driven journeys to Athens, Piraeus, Cape Sounion, Delphi, Meteora, Nafplio and the islands.",
  alternates: { canonical: "/destinations" },
};

export default function DestinationsIndex() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Destinations" }]}
        title={<>From Athens to <em>the Aegean.</em></>}
        lede="Private journeys from the capital to coastal Attica, the Peloponnese, central Greece and the islands."
      />
      <section className="section--tight">
        <div className="wrap">
          <div className="dest-grid" style={{ gridAutoRows: 300 }}>
            {DESTINATIONS.map((d) => <DestinationCard key={d.slug} d={d} />)}
          </div>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
