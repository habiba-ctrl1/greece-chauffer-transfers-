import Link from "next/link";
import { Photo } from "../photo";
import { JsonLd } from "../json-ld";
import { ServiceIllustration } from "./illustrations";
import { whatsappHref, CONTACT, SITE_URL } from "@/lib/site/config";
import { img } from "@/lib/site/content";
import type { ServicePage } from "@/lib/site/services/types";

export function ServiceHero({ page, shortTitle }: { page: ServicePage; shortTitle: string }) {
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: shortTitle },
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${SITE_URL}${c.href === "/" ? "" : c.href}` } : { item: `${SITE_URL}/services/${page.slug}` }),
    })),
  };
  return (
    <section className="shero" aria-labelledby="service-title">
      <JsonLd data={ld} />
      <div className="shero-media">
        <Photo src={img(page.image.src)} alt={page.image.alt} sizes="100vw" priority />
      </div>
      <div className="wrap shero-grid">
        <div className="hero-in shero-copy">
          <nav aria-label="Breadcrumb">
            <ol className="crumbs">
              {crumbs.map((c, i) => (
                <li key={c.name}>
                  {c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
                </li>
              ))}
            </ol>
          </nav>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1 id="service-title" className="h1">{page.h1}</h1>
          <p className="lede">{page.intro}</p>
          {page.heroWords && (
            <ul className="words" aria-label="The journey">
              {page.heroWords.map((w, i) => (
                <li key={w} style={{ animationDelay: `${900 + i * 450}ms` }}>{w}</li>
              ))}
            </ul>
          )}
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#quote">{page.cta}</a>
            <a
              className="btn btn-wa"
              href={whatsappHref(page.whatsappText)}
              {...(CONTACT.whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              WhatsApp Us
            </a>
          </div>
        </div>
        <aside className="shero-side" aria-label="Service summary">
          <ServiceIllustration name={page.illustration} label={`${shortTitle}: journey illustration`} />
          <ul className="facts">
            {page.facts.map((f) => (<li key={f}>{f}</li>))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
