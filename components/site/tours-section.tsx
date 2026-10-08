import Link from "next/link";
import { TOUR_ROUTES, img } from "@/lib/site/content";
import { Photo } from "./photo";
import { Parallax, Reveal } from "./reveal";
import { ArrowRight } from "./icons";

export function ToursSection() {
  return (
    <section className="section tours" id="tours" aria-labelledby="tours-title">
      <div className="tours-bg" aria-hidden="true">
        <Parallax speed={60}>
          <Photo src={img("sounion")} alt="" sizes="100vw" />
        </Parallax>
      </div>
      <div className="wrap tours-in">
        <Reveal className="tours-copy">
          <p className="eyebrow"><span className="chapter">Explore</span><span aria-hidden="true">—</span>Private tours</p>
          <h2 id="tours-title" className="h2">See More of Greece. <em>Without Watching the Clock.</em></h2>
          <p className="lede">
            Turn a day of sightseeing into a private experience. Travel comfortably between Greece&apos;s historic
            landmarks, coastal landscapes and cultural destinations with a chauffeur who works around your itinerary.
          </p>
          <Link className="btn btn-primary" href="/services/private-tours">Explore Private Tours <ArrowRight /></Link>
        </Reveal>
        <Reveal delay={150}>
          <ul className="routes" aria-label="Example private tour routes from Athens">
            {TOUR_ROUTES.map((r) => (
              <li key={r.to}>
                <Link href={`/destinations/${r.slug}`}>
                  <span><small>Athens →</small><br />{r.to}</span>
                  <ArrowRight />
                </Link>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "0.82rem", opacity: 0.65, marginTop: 16 }}>Example routes — every itinerary is tailored to you.</p>
        </Reveal>
      </div>
    </section>
  );
}
