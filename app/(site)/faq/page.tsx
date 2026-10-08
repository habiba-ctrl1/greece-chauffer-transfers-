import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { FaqList } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { FinalCta } from "@/components/site/final-cta";
import { FAQ } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about private chauffeur service, airport and port transfers, tours and booking in Greece.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <JsonLd data={ld} />
      <PageHero crumbs={[{ name: "FAQ" }]} title={<>Frequently asked <em>questions.</em></>} />
      <section className="section--tight"><div className="wrap"><FaqList /></div></section>
      <FinalCta />
    </>
  );
}
