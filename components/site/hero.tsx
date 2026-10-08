import Link from "next/link";
import { Photo } from "./photo";
import { QuoteWidget } from "./quote-widget";
import { img } from "@/lib/site/content";
import { QUOTE_HREF } from "@/lib/site/config";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media">
        <Photo
          src={img("hero")}
          alt="A black chauffeur-driven sedan on a coastal road above the Aegean at golden hour"
          sizes="100vw"
          priority
        />
      </div>
      <div className="wrap hero-body">
        <div className="hero-in" style={{ display: "grid", gap: "var(--s4)", justifyItems: "start" }}>
          <p className="eyebrow">Private chauffeur service · Greece</p>
          <h1 id="hero-title" className="h1">
            <span>Your Journey Through Greece,</span>
            <span><em>Handled Beautifully.</em></span>
          </h1>
          <p className="hero-sub">Private Chauffeur &amp; Luxury Transfers Across Greece</p>
          <p className="lede">
            From airport arrivals and cruise ports to private island transfers, business travel and unforgettable
            journeys through Greece, enjoy professional chauffeur service designed around your schedule.
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-primary" href={QUOTE_HREF}>Request a Private Quote</Link>
            <Link className="btn btn-ghost" href="/services">Explore Chauffeur Services</Link>
          </div>
        </div>
        <p className="hero-trust">
          Private transfers · Professional chauffeurs · Premium vehicles · Greece-wide service
        </p>
      </div>
      <div className="wrap hero-panel-wrap" style={{ position: "relative", zIndex: 5 }}>
        <div className="hero-panel">
          <QuoteWidget />
        </div>
      </div>
    </section>
  );
}
