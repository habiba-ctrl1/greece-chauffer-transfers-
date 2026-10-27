import { SERVICES } from "@/lib/site/content";
import { SectionHeading } from "./section-heading";
import { ServiceCard } from "./service-card";
import { Reveal } from "./reveal";

export function ServicesSection() {
  return (
    <section className="section on-sand" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <SectionHeading
          id="services-title"
          eyebrow="Services"
          chapter="Arrive"
          lede="Private airport and port transfers, chauffeur hire, intercity journeys, tours and corporate transport — arranged by one team."
        >
          One Chauffeur Service. <em>Every Way You Need to Travel.</em>
        </SectionHeading>
        <div className="svc-grid">
          {SERVICES
            .filter((s) => !s.secondary)
            .map((s, i) => (
              <Reveal key={s.slug} delay={(i % 2) * 100} className="svc-cell">
                <ServiceCard service={s} index={i} />
              </Reveal>
            ))}
        </div>
      </div>
    </section>
  );
}
