import { FAQ as ITEMS } from "@/lib/site/content";
import { SectionHeading } from "./section-heading";

/** Native <details> accordion: keyboard + screen-reader friendly with zero JS. */
export function FaqList({ items = ITEMS }: { items?: typeof ITEMS }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p className="ans">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="wrap">
        <SectionHeading id="faq-title" eyebrow="Good to know" chapter="Depart" center>
          Frequently Asked <em>Questions</em>
        </SectionHeading>
        <FaqList />
      </div>
    </section>
  );
}
