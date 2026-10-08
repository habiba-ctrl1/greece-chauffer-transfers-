import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "./json-ld";
import { SITE_URL } from "@/lib/site/config";

export interface Crumb { name: string; href?: string }

export function PageHero({ crumbs, title, lede }: { crumbs: Crumb[]; title: ReactNode; lede?: ReactNode }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...crumbs];
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${SITE_URL}${c.href === "/" ? "" : c.href}` } : {}),
    })),
  };
  return (
    <section className="page-hero">
      <JsonLd data={ld} />
      <div className="wrap">
        <nav aria-label="Breadcrumb">
          <ol className="crumbs">
            {all.map((c, i) => (
              <li key={c.name}>
                {c.href && i < all.length - 1 ? <Link href={c.href}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="h1" style={{ maxWidth: "18ch" }}>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
    </section>
  );
}
