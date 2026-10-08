import Link from "next/link";
import { DESTINATIONS, img, type Destination } from "@/lib/site/content";
import { Photo } from "./photo";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function DestinationCard({ d, big }: { d: Destination; big?: boolean }) {
  return (
    <Link href={`/destinations/${d.slug}`} className="dest">
      <Photo
        src={img(d.image)}
        alt={`${d.name} — illustrative image`}
        sizes={big ? "(min-width: 1000px) 50vw, 80vw" : "(min-width: 1000px) 25vw, 80vw"}
      />
      <div className="dest-in">
        <h3>{d.name}</h3>
        <p>{d.blurb}</p>
      </div>
    </Link>
  );
}

export function DestinationsSection() {
  return (
    <section className="section" id="destinations" aria-labelledby="dest-title">
      <div className="wrap">
        <SectionHeading
          id="dest-title"
          eyebrow="Featured destinations"
          chapter="Explore"
          lede="Start in Athens, then go further — coastal Attica, the Peloponnese, central Greece and the islands."
        >
          From Athens to the Aegean. <em>Travel Greece Your Way.</em>
        </SectionHeading>
        <Reveal className="dest-grid">
          {DESTINATIONS.map((d, i) => (
            <DestinationCard key={d.slug} d={d} big={i === 0} />
          ))}
        </Reveal>
        <p className="dest-note">
          Looking for somewhere else? <Link className="link-arrow" href="/destinations">See all destinations</Link>
        </p>
      </div>
    </section>
  );
}
