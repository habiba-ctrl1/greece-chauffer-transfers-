import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { TrustStrip } from "@/components/site/trust-strip";
import { IntroSection } from "@/components/site/intro-section";
import { ServicesSection } from "@/components/site/services-section";
import { DestinationsSection } from "@/components/site/destinations-section";
import { JourneySwitcher } from "@/components/site/journey-switcher";
import { FleetSection } from "@/components/site/fleet-section";
import { WhyChooseUs } from "@/components/site/why-choose-us";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { ToursSection } from "@/components/site/tours-section";
import { CorporateSection } from "@/components/site/corporate-section";
import { PartnerSection } from "@/components/site/partner-section";
import { ReviewsPlaceholder } from "@/components/site/reviews-placeholder";
import { CoverageSection } from "@/components/site/coverage-section";
import { FaqSection } from "@/components/site/faq";
import { FinalCta } from "@/components/site/final-cta";
import { JsonLd } from "@/components/site/json-ld";
import { BRAND, CONTACT, SITE_URL } from "@/lib/site/config";
import { FAQ, SERVICES } from "@/lib/site/content";

export const metadata: Metadata = {
  title: { absolute: "Private Chauffeur Service Greece | Luxury Transfers & Drivers" },
  description:
    "Premium private chauffeur service in Greece for airport and port transfers, executive travel, private tours and comfortable journeys across Athens and major destinations.",
  alternates: { canonical: "/" },
};

const orgId = `${SITE_URL}/#organization`;

// Organization only carries verified facts: name, URL, description and whichever
// contact points are configured. No address, ratings, awards or registration numbers.
const schema = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId,
    name: BRAND.name,
    url: SITE_URL,
    description: BRAND.tagline,
    areaServed: { "@type": "Country", name: "Greece" },
    ...(CONTACT.email || CONTACT.phone
      ? { contactPoint: [{ "@type": "ContactPoint", contactType: "customer service", ...(CONTACT.email && { email: CONTACT.email }), ...(CONTACT.phone && { telephone: CONTACT.phone }) }] }
      : {}),
  },
  { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: BRAND.name, publisher: { "@id": orgId }, inLanguage: "en" },
  ...SERVICES.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.short,
    url: `${SITE_URL}/services/${s.slug}`,
    provider: { "@id": orgId },
    areaServed: { "@type": "Country", name: "Greece" },
  })),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={schema} />
      <Hero />
      <TrustStrip />
      <IntroSection />
      <ServicesSection />
      <DestinationsSection />
      <JourneySwitcher />
      <FleetSection />
      <WhyChooseUs />
      <ProcessTimeline />
      <ToursSection />
      <CorporateSection />
      <PartnerSection />
      <ReviewsPlaceholder />
      <CoverageSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
