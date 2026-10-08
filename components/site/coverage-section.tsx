import Link from "next/link";
import { GreeceMap } from "./greece-map";
import { Reveal } from "./reveal";
import { ArrowRight } from "./icons";

const AREAS: [string, string][] = [
  ["Athens & Attica", "Hub"],
  ["Peloponnese", "Nafplio · Argolis"],
  ["Central Greece", "Delphi · Meteora"],
  ["Northern Greece", "On request"],
  ["Crete & major islands", "On request"],
];

export function CoverageSection() {
  return (
    <section className="section on-navy" id="coverage" aria-labelledby="cov-title">
      <div className="wrap map-wrap">
        <Reveal className="stack">
          <p className="eyebrow"><span className="chapter">Depart</span><span aria-hidden="true">—</span>Coverage</p>
          <h2 id="cov-title" className="h2">One Service. <em>Many Destinations.</em></h2>
          <p className="lede">
            Athens is our hub, with private journeys across Attica, the Peloponnese, central Greece and onward to
            the islands. Tell us where you are headed and we will confirm how we can arrange it.
          </p>
          <ul className="map-list">
            {AREAS.map(([a, b]) => (<li key={a}>{a}<span>{b}</span></li>))}
          </ul>
          <Link className="btn btn-primary" style={{ justifySelf: "start" }} href="/destinations">Browse destinations <ArrowRight /></Link>
        </Reveal>
        <GreeceMap />
      </div>
    </section>
  );
}
