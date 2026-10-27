# Public site — architecture & design system

Concept: **"Luxury Greek journey editorial"** — Arrive → Relax → Explore → Depart.
Each homepage section carries a small chapter marker (Arrive / Relax / Explore / Depart).

## 1. Sitemap

| Status | Route |
|---|---|
| Built | `/` · `/services` · `/services/{airport-transfers, port-transfers, private-chauffeur, private-driver, intercity-transfers, private-tours, corporate-transportation}` · `/destinations` · `/destinations/{athens, piraeus, cape-sounion, delphi, meteora, nafplio, mykonos, santorini, crete}` · `/faq` · `/contact` (multi-step quote form) · `/sitemap.xml` · `/robots.txt` |
| Homepage anchors (no page yet) | `/#fleet` · `/#tours` · `/#partners` |
| Not built — create when real content exists | `/fleet` · `/tours` + tour pages · `/about` · `/partners` · `/privacy` · `/terms` |

Service/destination pages are generated from `lib/site/content.ts`. To add or remove one, edit that file —
the sitemap, footer, internal links and static params follow. Don't add entries you can't actually serve.

## 2. Design tokens (`app/(site)/site.css`, `:root`)

Colour: ivory `#F7F5F0` (dominant) · navy `#10252B` (sections, buttons) · ink `#162326` · muted `#667276` ·
blue `#315D68` · sand `#D8C8AA` · bronze `#A88B62` (rare) · WhatsApp green `#1F7A4D` (WhatsApp buttons only).
Type: Cormorant Garamond (display) + Manrope (body) via `next/font`, `--font-display` / `--font-body`.
H1 `clamp(2.4rem → 4.75rem)`, H2 `clamp(2.25rem → 4rem)`, body 17px, lede ≤ 56ch.
Spacing: 8-pt scale `--s1…--s8`; section padding `clamp(72px, 10vw, 144px)`; gutter 24px → 40px ≥768px.
Breakpoints: 640 (2-col forms) · 760 (service grid) · 900 (timeline, trust) · 960 (split layouts) · 1000 (fleet/destination grids) · 1080 (desktop header, mobile bar hides).

## 3. Components (`components/site/`)

Header (+mobile drawer, sticky mobile CTA bar) · Hero · QuoteWidget · TrustStrip · IntroSection · ServicesSection/ServiceCard ·
DestinationsSection/DestinationCard · JourneySwitcher · FleetSection/FleetCard · WhyChooseUs · ProcessTimeline ·
ToursSection · CorporateSection · PartnerSection · ReviewsPlaceholder · CoverageSection/GreeceMap · FaqSection/FaqList ·
FinalCta · Footer · QuoteForm · PageHero (breadcrumbs + BreadcrumbList) · SectionHeading · Photo · Reveal/Parallax · JsonLd · icons.

Only interactive pieces are client components (Header, JourneySwitcher, ProcessTimeline, GreeceMap, QuoteForm, Reveal/Parallax).

## 4. Motion

No animation library — CSS transitions + one IntersectionObserver hook (`useInView`). Hero: slow zoom (16s), staggered
fade-up (0.9s). Scroll reveal, line-draw timeline and map routes, light parallax (intro image, tours), card hovers,
tab cross-fades. Everything is disabled under `prefers-reduced-motion`. The map car drives once, not on a loop.

## 5. Images

`public/images/*.svg` are **generated art-direction placeholders** (`node scripts/generate-placeholders.mjs`), not photography.
Replace each with a real, owned/licensed photo of the same subject and update `img()` in `lib/site/content.ts`.

| Key | Brief | Size |
|---|---|---|
| `hero` | Black premium car on Aegean coastal road, golden hour | 2400×1350 AVIF/JPG, <250 KB, **only** above-the-fold image (`priority`) |
| `chauffeur`, `interior`, `business` | Chauffeur opening door; calm cabin; executive entering vehicle | 1600×2000 / 1200×1200 / 1600×1280 |
| `airport`, `piraeus`, `coast` | Arrivals; cruise port; coastline | 1600×1000 |
| `athens`, `sounion`, `delphi`, `meteora`, `nafplio`, `mykonos`, `santorini`, `crete` | Destination hero shots | 1600×1000 |
| `v-sedan … v-group` | Real photos of your actual vehicles, side/3-4 view, consistent background | 1200×750 |

Everything below the fold is lazy-loaded. Workers has no image optimiser (`images.unoptimized`), so export
pre-sized AVIF/WebP/JPG yourself (or add Cloudflare Images later).

## 6. SEO / GEO

- Home: title *Private Chauffeur Service Greece | Luxury Transfers & Drivers*, the supplied meta description, one H1.
- JSON-LD: Organization (name/url/description + only configured contact points), WebSite, Service ×6, FAQPage (home + `/faq`),
  BreadcrumbList on inner pages. **Not used:** LocalBusiness, AggregateRating, Review, address, awards.
- Internal links: home → every service and destination; services ↔ destinations both ways; descriptive anchors.
- Canonicals set per page; `sitemap.xml` and `robots.txt` generated (admin/login/api disallowed).

## 7. Quote pipeline

Hero panel (plain GET form) → `/contact` pre-fills the 5-step form → `submitInquiry` (`lib/actions/leads.ts`): server validation
(`lib/crm/inquiry-input.ts`), honeypot, D1 rate limit (8 per 10 min per IP, 5 per hour per email), inquiry saved before any success
message, reference ID returned, notification emails sent from the outbox with retry. No prices are generated. See BOOKING_SYSTEM.md.

## 8. Configuration (build-time env)

`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits, intl format), `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`.
Unset values are hidden/fall back to the quote form — nothing is invented. `NEXT_PUBLIC_*` are inlined at build, so set them
in the GitHub Actions build step.
