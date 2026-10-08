# Service pages — architecture

Phase 1 is live in code: **airport-transfers, port-transfers, private-chauffeur, private-tours, intercity-transfers, corporate-transportation.**
Phase 2 pages are intentionally not built — see [SERVICE_PAGES_PHASE2_BRIEFS.md](SERVICE_PAGES_PHASE2_BRIEFS.md). Longer-term plan: [ROADMAP_SEO_ARCHITECTURE.md](ROADMAP_SEO_ARCHITECTURE.md). Claims to confirm: [SERVICE_CLAIMS_TO_VERIFY.md](SERVICE_CLAIMS_TO_VERIFY.md).

## How it works

One route (`app/(site)/services/[slug]/page.tsx`) renders a typed data file per service. Each page is an **ordered list of blocks**, so every service has a different information architecture while sharing one design system.

```
lib/site/services/
  types.ts                    ServicePage + Block union (split, steps, cards[route|plain|ruled], compare, vehicles, ports, tours, destinations, partners)
  airport-transfers.ts …      one file per page (copy, facts, blocks, FAQ, related, closing)
  index.ts                    SERVICE_PAGES (published list)  ← add a page here to publish it
components/site/service/
  service-hero.tsx            breadcrumb, eyebrow, H1, intro, 2 CTAs, facts + illustration panel, BreadcrumbList JSON-LD
  illustrations.tsx           6 thin-line SVG scenes (airport, port, chauffeur, intercity, tours, corporate)
  blocks.tsx                  block renderer (all section types)
  steps.tsx                   animated timeline (client)
  service-footer-blocks.tsx   AnswerBlock, ServiceFaq, RelatedServices, ServiceFinalCta (with pre-selected quote form)
  floating-cta.tsx            desktop floating WhatsApp / quote pill (hides while the form is in view)
app/(site)/service.css        service-page styles
```

Fixed page spine: **Hero → "In short" answer block → page-specific blocks → FAQ → Related services → Final CTA + quote form.**

## Page-by-page IA (what makes each different)

| Page | Search intent | Blocks (in order) | Signature |
|---|---|---|---|
| airport-transfers | private airport transfer Greece / Athens airport transfer | arrival→journey steps · route cards (Airport→Hotel/Villa/Port/Athens/Riviera/elsewhere) · "decisions before you land" · vehicles · who it suits · destinations | airport → hotel/port/villa/destination flight-path illustration |
| port-transfers | Piraeus / cruise port transfer | cruise-passenger copy · ports list (Piraeus served; others on request) · 7 port journeys · gangway→destination steps · destinations | ship → chauffeur → destination |
| private-chauffeur | private chauffeur / private driver / chauffeur hire | **chauffeur vs transfer comparison** · core experience · plan-meet-travel-adjust-return · 8 use cases · "chauffeur vs private driver" wording · vehicles · destinations | ARRIVE → MOVE → EXPLORE → RETURN hero words |
| intercity-transfers | Athens to Delphi/Nafplio transfers | journeys with approx. times · why private · **rental vs coach vs private** · multi-day · steps · destinations | route-line map illustration |
| private-tours | private chauffeur tours / day trips from Athens | 5-step plan · **8 tour cards** (duration, start, highlights) · custom-day section · vehicles · destinations | tour cards, no prices |
| corporate-transportation | corporate/executive chauffeur Athens | **ruled list** of business services · request→support workflow · single transfer vs programme · vehicles · **partners (B2B)** · destinations | architectural square-cornered theme (`data-theme="corporate"`) |

## Internal linking (published pages only — no dead links)

Service → service (in each file's `related`) and service → destination (`destinations` blocks + inline links).

```
airport-transfers   → port-transfers, private-chauffeur, intercity-transfers · athens, piraeus, mykonos, santorini, crete
port-transfers      → airport-transfers, private-chauffeur, private-tours · piraeus, athens, mykonos, santorini
private-chauffeur   → private-tours, corporate-transportation, intercity-transfers · athens, cape-sounion, nafplio, delphi
private-tours       → intercity-transfers, private-chauffeur, port-transfers · athens, cape-sounion, delphi, nafplio, meteora
intercity-transfers → private-tours, private-chauffeur, airport-transfers · nafplio, delphi, meteora, cape-sounion, athens
corporate           → airport-transfers, private-chauffeur, intercity-transfers · athens, piraeus
```

Destination pages link back via `DESTINATIONS[].services` in `lib/site/content.ts`. Links to unpublished pages (VIP, hotel & villa, group, wedding, hourly, `/fleet`, `/partners`) are deliberately omitted; vehicles link to `/#fleet`, partner CTAs go to `/contact?topic=partner`.

## SEO / GEO / AIO

- Unique `<title>` (≤ ~60 chars, absolute), meta description, canonical, Open Graph and Twitter metadata per page.
- Exactly one H1; H2s phrased as the real questions/topics.
- "In short" block at the top of every page: 2–3 factual sentences (what, where, for whom, subject to availability) for answer engines.
- Unique FAQ per page, mirrored one-to-one in **FAQPage** JSON-LD; plus **Service** and **BreadcrumbList**. No reviews, ratings, prices, awards, licences.
- `/services/private-driver` 308-redirects to `/services/private-chauffeur` (one page per intent).

## Conversion

- Hero CTA is service-specific ("Request Airport Transfer", "Plan My Port Transfer", "Request a Chauffeur", "Plan My Private Tour", "Plan My Intercity Transfer", "Request Corporate Transportation") and scrolls to the on-page quote form, which pre-selects the service. WhatsApp is the secondary CTA, with a service-specific prefilled message.
- Flight/ship field relabels by service (flight number / ship name & times).
- Mobile: global bottom bar (WhatsApp + Request Quote). Desktop: floating pill after scroll, hidden while the form is on screen.

## Motion (CSS, no animation library)

Hero zoom + staggered entrance, illustration stroke-draw (once), scroll reveals, timeline line-draw, hover states. All disabled for `prefers-reduced-motion`. (Framer Motion was not added: nothing here needs it and it would add JS weight.)

## Image requirements (replace the placeholders)

Descriptive filenames; export 2400×1350 hero (AVIF/WebP + JPG fallback, < 250 KB, only the hero is `priority`); all other images lazy.

| Placeholder file | Brief |
|---|---|
| `greece-private-airport-transfer-athens` | Premium vehicle outside a Greek airport terminal |
| `greece-private-cruise-port-transfer-piraeus` | Cruise ship at Piraeus, vehicle and luggage on the quay |
| `greece-private-chauffeur-service-athens` | Chauffeur opening the rear door of a premium vehicle |
| `greece-private-intercity-transfer-peloponnese` | Vehicle on a Peloponnese coastal/mountain road |
| `greece-private-chauffeur-tour-delphi` | Vehicle against the Delphi / central Greece landscape |
| `greece-corporate-executive-chauffeur-athens` | Executive passenger entering a vehicle, Athens business setting |

Also needed: 1200×630 OG image per page; real fleet photos for the vehicle cards; real photos for each tour card.

## Adding or changing a page

1. Copy a data file in `lib/site/services/`, write genuinely different copy, FAQs and blocks.
2. Add it to `SERVICE_PAGES` in `index.ts`, and to `SERVICES` in `lib/site/content.ts` (card on `/services`, footer, homepage) if it should appear there.
3. If it needs a new illustration, add it to `illustrations.tsx` and `IllustrationName`.
4. Update the sitemap automatically (it reads `SERVICES`) and the link lists in related pages.
