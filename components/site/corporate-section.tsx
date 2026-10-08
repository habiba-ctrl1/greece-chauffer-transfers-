import Link from "next/link";
import { CORPORATE_POINTS, img } from "@/lib/site/content";
import { Photo } from "./photo";
import { Reveal } from "./reveal";
import { ArrowRight, Check } from "./icons";

export function CorporateSection() {
  return (
    <section className="section on-sand" id="corporate" aria-labelledby="corp-title">
      <div className="wrap split">
        <Reveal className="split-copy">
          <p className="eyebrow"><span className="chapter">Depart</span><span aria-hidden="true">—</span>Corporate &amp; VIP</p>
          <h2 id="corp-title" className="h2">For Business, Events <em>&amp; VIP Travel.</em></h2>
          <p className="lede">
            When timing, discretion and presentation matter, private chauffeur transportation provides a seamless
            way to move executives, speakers, guests and delegations across Greece.
          </p>
          <ul className="ticks">
            {CORPORATE_POINTS.map((p) => (<li key={p}><Check />{p}</li>))}
          </ul>
          <Link className="btn btn-primary" href="/services/corporate-transportation">Corporate Transportation <ArrowRight /></Link>
        </Reveal>
        <Reveal className="split-media" delay={120}>
          <Photo src={img("business")} alt="An executive passenger stepping into a premium vehicle at dusk" sizes="(min-width: 960px) 48vw, 100vw" />
        </Reveal>
      </div>
    </section>
  );
}
