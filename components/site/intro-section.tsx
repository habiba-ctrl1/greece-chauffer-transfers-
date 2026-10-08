import Link from "next/link";
import { Photo } from "./photo";
import { Reveal, Parallax } from "./reveal";
import { ArrowRight } from "./icons";
import { img } from "@/lib/site/content";

export function IntroSection() {
  return (
    <section className="section" aria-labelledby="intro-title">
      <div className="wrap intro">
        <Reveal className="intro-media">
          <div className="ph main" style={{ position: "relative", overflow: "hidden" }}>
            <Parallax speed={36}>
              <Photo
                src={img("chauffeur")}
                alt="A chauffeur opening the rear door of a black car for a passenger at dusk"
                sizes="(min-width: 960px) 48vw, 100vw"
                className=""
              />
            </Parallax>
          </div>
          <Photo
            src={img("interior")}
            alt="Quiet, softly lit vehicle interior"
            sizes="(min-width: 960px) 22vw, 40vw"
            className="inset"
          />
        </Reveal>

        <Reveal className="intro-copy" delay={120}>
          <p className="eyebrow"><span className="chapter">Arrive</span><span aria-hidden="true">—</span>The Greece chauffeur experience</p>
          <h2 id="intro-title" className="h2">
            More Than a Transfer. <em>A Better Way to Travel Greece.</em>
          </h2>
          <p className="lede">Your journey should feel effortless from the moment you arrive.</p>
          <p style={{ color: "var(--muted)", maxWidth: "56ch" }}>
            Our private chauffeur service connects airports, ports, hotels, villas, business destinations and iconic
            Greek landmarks with comfortable vehicles and professional service. Whether you need a direct airport
            transfer, a dedicated chauffeur for the day or a private journey between destinations, your
            transportation is planned around you.
          </p>
          <ul className="minis">
            <li><span>i.</span> Personalised journeys</li>
            <li><span>ii.</span> Professional service</li>
            <li><span>iii.</span> Comfort from door to destination</li>
          </ul>
          <Link className="btn btn-primary" href="/services">Discover Our Services <ArrowRight /></Link>
        </Reveal>
      </div>
    </section>
  );
}
