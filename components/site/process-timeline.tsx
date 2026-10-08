"use client";

import { STEPS } from "@/lib/site/content";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "./icons";
import { useInView } from "./reveal";

export function ProcessTimeline() {
  const [ref, seen] = useInView<HTMLOListElement>(0.25);
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-title">
      <div className="wrap">
        <SectionHeading id="how-title" eyebrow="How it works" chapter="Relax">
          Four Simple Steps <em>to a Calm Journey.</em>
        </SectionHeading>
        <ol ref={ref} className={`steps ${seen ? "in" : ""}`}>
          {STEPS.map((s) => (
            <li key={s.n} className="step">
              <ServiceIcon name={s.icon} className="ic" />
              <span className="n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
