import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/config";
import { DESTINATIONS, SERVICES } from "@/lib/site/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number) => ({ url: `${SITE_URL}${path}`, lastModified: now, priority });
  return [
    page("/", 1),
    page("/services", 0.8),
    ...SERVICES.map((s) => page(`/services/${s.slug}`, 0.7)),
    page("/destinations", 0.8),
    ...DESTINATIONS.map((d) => page(`/destinations/${d.slug}`, 0.6)),
    page("/faq", 0.5),
    page("/contact", 0.6),
  ];
}
