import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { ServiceHero } from "@/components/site/service/service-hero";
import { ServiceBlocks } from "@/components/site/service/blocks";
import { AnswerBlock, RelatedServices, ServiceFaq, ServiceFinalCta } from "@/components/site/service/service-footer-blocks";
import { FloatingCta } from "@/components/site/service/floating-cta";
import { SERVICE_PAGES, servicePageBySlug } from "@/lib/site/services";
import { SERVICES } from "@/lib/site/content";
import { CONTACT, SITE_URL, whatsappHref } from "@/lib/site/config";

export const dynamicParams = false;
export const generateStaticParams = () => SERVICE_PAGES.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = servicePageBySlug((await params).slug);
  if (!p) return {};
  const url = `/services/${p.slug}`;
  return {
    title: { absolute: p.meta.title },
    description: p.meta.description,
    alternates: { canonical: url },
    // No og:image yet: SVG placeholders aren't accepted by social crawlers. Add real photo exports (see docs).
    openGraph: { type: "website", url, title: p.meta.title, description: p.meta.description },
    twitter: { card: "summary_large_image", title: p.meta.title, description: p.meta.description },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const page = servicePageBySlug((await params).slug);
  if (!page) notFound();
  const svc = SERVICES.find((s) => s.slug === page.slug);
  const shortTitle = svc?.title ?? page.h1;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.h1,
      serviceType: shortTitle,
      description: page.answer,
      url: `${SITE_URL}/services/${page.slug}`,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "Greece" },
    },
    // FAQPage mirrors the visible accordion exactly.
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div data-theme={page.theme ?? "default"}>
      <JsonLd data={schema} />
      <ServiceHero page={page} shortTitle={shortTitle} />
      <AnswerBlock text={page.answer} />
      <ServiceBlocks blocks={page.blocks} slug={page.slug} />
      <ServiceFaq faq={page.faq} />
      <RelatedServices related={page.related} />
      <ServiceFinalCta page={page} />
      <FloatingCta whatsappHref={whatsappHref(page.whatsappText)} external={!!CONTACT.whatsapp} label={page.cta} />
    </div>
  );
}
