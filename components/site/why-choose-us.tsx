import { WHY } from "@/lib/site/content";
import { Reveal } from "./reveal";

export function WhyChooseUs() {
  return (
    <section className="section on-navy" aria-labelledby="why-title">
      <div className="wrap">
        <header className="section-head">
          <p className="eyebrow"><span className="chapter">Relax</span><span aria-hidden="true">—</span>Why travel with us</p>
          <h2 id="why-title" className="h2">The Details <em>Make the Difference.</em></h2>
        </header>
        <div className="why-grid">
          {WHY.map((w, i) => (
            <Reveal key={w.n} className="why-i" delay={i * 90}>
              <span className="n">{w.n}</span>
              <h3>{w.t}</h3>
              <p>{w.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
