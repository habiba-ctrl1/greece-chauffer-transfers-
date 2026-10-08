import Link from "next/link";
import { PARTNER_TYPES } from "@/lib/site/content";
import { Reveal } from "./reveal";
import { ArrowRight } from "./icons";

export function PartnerSection() {
  return (
    <section className="section--tight" id="partners" aria-labelledby="partner-title">
      <div className="wrap">
        <Reveal className="partners">
          <div className="stack">
            <p className="eyebrow">Hotel &amp; travel partners</p>
            <h2 id="partner-title" className="h2">A Reliable Ground <em>Transportation Partner.</em></h2>
          </div>
          <div className="stack">
            <p style={{ color: "rgba(247,245,240,.78)" }}>
              Hotels, travel agencies, villa managers, event planners and concierge teams can rely on coordinated
              private transportation for their guests.
            </p>
            <ul className="chips">
              {PARTNER_TYPES.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <Link className="btn btn-primary" style={{ justifySelf: "start" }} href="/contact?topic=partner#quote">
              Partner With Us <ArrowRight />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
