import Link from "next/link";
import { FLEET, img, type Vehicle } from "@/lib/site/content";
import { Photo } from "./photo";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { ArrowRight } from "./icons";

export function FleetCard({ v }: { v: Vehicle }) {
  return (
    <article className="vcard">
      <Photo src={img(v.image)} alt={`${v.name} — illustrative image`} sizes="(min-width: 1000px) 30vw, 82vw" />
      <div className="vcard-in">
        <h3>{v.name}</h3>
        <dl className="specs">
          <div><dt>Passengers</dt><dd>{v.passengers}</dd></div>
          <div><dt>Luggage</dt><dd>{v.luggage}</dd></div>
          <div><dt>Comfort</dt><dd>{v.comfort}</dd></div>
        </dl>
        <p><strong style={{ color: "var(--ink)" }}>Best for:</strong> {v.bestFor}</p>
        <Link className="link-arrow" href={`/contact?vehicle=${encodeURIComponent(v.name)}#quote`} style={{ justifySelf: "start" }}>
          Quote this vehicle <ArrowRight />
        </Link>
      </div>
    </article>
  );
}

export function FleetSection() {
  return (
    <section className="section" id="fleet" aria-labelledby="fleet-title">
      <div className="wrap">
        <SectionHeading
          id="fleet-title"
          eyebrow="Fleet"
          chapter="Relax"
          lede="From refined executive sedans to spacious luxury vans, choose a vehicle that matches your group, luggage and itinerary."
        >
          The Right Vehicle <em>for the Journey.</em>
        </SectionHeading>
        <Reveal className="fleet-row">
          {FLEET.map((v) => <FleetCard key={v.id} v={v} />)}
        </Reveal>
        <p className="fine">Capacities are a guide. We confirm the exact vehicle for your group and luggage in your quote.</p>
      </div>
    </section>
  );
}
