import { TRUST } from "@/lib/site/content";

export function TrustStrip() {
  return (
    <section className="trust below-hero" aria-label="Why travellers choose private transfers">
      <div className="wrap">
        <ul>
          {TRUST.map((t) => (
            <li key={t.title}>
              <b>{t.title}</b>
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
