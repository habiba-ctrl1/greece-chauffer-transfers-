# Audit, URL plan and implementation log

Scope: repository audit (Next.js 16 on Cloudflare Workers via OpenNext). The live site and competitors were **not re-crawled in this session**; competitor notes come from the owner's supplied brief and are marked as such. No analytics, Search Console or keyword-volume data was available, so nothing below claims search volume or rankings.

## A. Current URL inventory

| URL | Type | Indexable | Notes / action |
|---|---|---|---|
| `/` | Home | Yes (sitemap) | Keep. Six-card service grid (hourly is `secondary`, hub-only). |
| `/services` | Hub | Yes | **Rebuilt** this pass: grouped by journey type, vehicle guidance, process, FAQ, CollectionPage/ItemList + FAQPage schema. |
| `/services/airport-transfers` | Service | Yes | Keep. Owns "Athens airport" intent; no separate `athens-airport-transfers`. |
| `/services/port-transfers` | Service | Yes | Keep. Owns Piraeus intent; no separate `piraeus-port-transfers`. |
| `/services/private-chauffeur` | Service | Yes | Keep; now links to hourly. |
| `/services/hourly-chauffeur` | Service | Yes | **New.** Distinct intent (block of hours, stops, waiting). |
| `/services/intercity-transfers` | Service | Yes | Keep. |
| `/services/private-tours` | Service | Yes | Keep. Owns "day trips from Athens". |
| `/services/corporate-transportation` | Service | Yes | Keep the URL (proposed `corporate-chauffeur` would need a redirect and gains nothing). |
| `/services/private-driver` | Redirect | No | 308 → `private-chauffeur`. Keep. |
| `/destinations`, `/destinations/{athens, piraeus, cape-sounion, delphi, meteora, nafplio, mykonos, santorini, crete}` | Hub + 9 | Yes | Thin shared template. P2: rewrite with destination-specific content. |
| `/faq`, `/contact` | Support | Yes | Keep. `/contact` hosts the quote form. |
| `/#fleet`, `/#tours`, `/#partners` | Anchors | n/a | No standalone pages yet. |
| `/admin/*`, `/login`, `/api/*` | App | No | Disallowed in `robots.ts`; middleware gates `/admin`. |
| `/sitemap.xml`, `/robots.txt` | Generated | n/a | Sitemap lists 21 URLs from `SERVICES` + `DESTINATIONS`. |

## B. Features that must be preserved
Quote pipeline (hero panel → `/contact` multi-step form → `submitQuoteRequest` → draft quote in admin, honeypot, no generated prices); per-service prefill via `quoteService`; WhatsApp links driven by env (hidden/fallback when unset); JSON-LD Organization/WebSite/Service/FAQPage/BreadcrumbList; `private-driver` redirect; reduced-motion handling; admin dashboard and Cloudflare deploy workflow.

## C. Proposed vs existing architecture (decisions)

| Proposed URL | Decision | Reason |
|---|---|---|
| `/services` | Improved | Hub rebuilt. |
| `/services/airport-transfers` | Exists | — |
| `/services/athens-airport-transfers` | **Merge** into airport-transfers | Same intent; a second page would cannibalise. |
| `/services/port-transfers`, `/piraeus-port-transfers` | Exists / **merge** | Piraeus is the main served port; page already differentiates it. |
| `/services/private-chauffeur` | Exists | — |
| `/services/hourly-chauffeur` | **Created** | Distinct query; owner roadmap listed it; site already offers hourly hire (see claims doc). |
| `/services/full-day-chauffeur` | **Merge** into hourly-chauffeur | Covered by the hourly vs full-day comparison; split later only if demand data supports it. |
| `/services/intercity-transfers`, `/private-tours` | Exist | — |
| `/services/day-trips-from-athens` | **Merge** into private-tours | Same intent. |
| `/services/corporate-chauffeur` | Keep existing `corporate-transportation` | Preserve URL. |
| `/services/vip-chauffeur`, `wedding-transportation`, `event-transportation`, `group-transfers` | **Deferred** | Briefs exist (`SERVICE_PAGES_PHASE2_BRIEFS.md`); need owner confirmation and real content. |
| `/services/hotel-and-villa-transfers`, `yacht-and-marina-transfers`, `multi-day-chauffeur` | **Deferred** | Not confirmed as offered; multi-day is already a section of intercity-transfers. Yacht/marina: do not publish without confirmation. |
| `/transfers/*` routes | **Deferred (P3)** | Existing roadmap uses `/routes/`; pick one convention before building. Build only with real route content. |
| `/destinations/*` | Exists (9) | Add only served places; Thessaloniki not added — no evidence of coverage. |
| `/fleet`, `/about`, `/partner-with-us`, `/faq` | `/faq` exists; others **need owner input** | `/fleet` needs real vehicles and photos; capacities in `FLEET` are placeholders. |

## D. Technical SEO / design audit
Good: absolute unique titles, canonicals, one H1 per page, FAQPage mirrors visible FAQs, no invented ratings/prices, semantic `<details>` FAQ, no animation library, reduced-motion respected.
Issues:
1. **No og:image on any page** — all imagery is SVG placeholder art (P0 for sharing, needs real photos).
2. **All images are generated placeholders**; no real photography or fleet photos.
3. Sitemap `lastModified` is the build time for every URL (misleading); acceptable but could use per-page dates.
4. `NEXT_PUBLIC_WHATSAPP_NUMBER/PHONE/EMAIL/SITE_URL` must be set in the deploy workflow or WhatsApp CTAs fall back to the quote form and Organization has no contact point.
5. No `/fleet`, `/about`, privacy or terms pages (trust and legal gap).
6. Quote form has no rate limiting beyond the honeypot; no analytics events (no analytics configured, so none added).
7. Palette differs from the brief (existing: ivory `#F7F5F0`, navy `#10252B`, bronze `#A88B62`; brief: navy `#102A43`, champagne `#B89A68`). Left unchanged to avoid a site-wide restyle; switching is a token change in `site.css` if wanted.
8. `npm run lint` has 2 pre-existing errors (`cloudflare-env.d.ts` empty interface, generated file) unrelated to this work.

## E. Competitor comparison (from the owner's brief; not independently re-verified)
Chauffeur Greece separates airport/port/intercity, tours, hourly, corporate and occasions; Athens Transfer Service offers hourly hire, tailored journeys, FAQs and clear booking CTAs; My Greece Chauffeur is broad (tours, cruise, islands, events, groups). Gap to exploit: each page here carries its own decision aid, planning checklist and unique FAQs rather than a repeated template, with honest "subject to availability / confirmed in quote" language. Do not copy fixed-price, live-tracking or guaranteed-wait claims unless operations support them.

## F. Prioritised plan
- **P0 (needs owner):** real hero/OG photography; set contact env vars; confirm claims in `SERVICE_CLAIMS_TO_VERIFY.md`; `/fleet` with real vehicles.
- **P1 (done this pass):** services hub, hourly-chauffeur page, cross-links, sitemap/footer pick-up automatically.
- **P2:** destination pages with distinct content (Athens, Piraeus first); `/about`; breadcrumb-linked fleet; illustrations for hourly/phase-2 services.
- **P3:** `vip-chauffeur`, `group`, `wedding-event`, `hotel-villa` pages after confirmation; route pages only with route-specific content and demand evidence.

## Keyword / intent map (hypotheses, no volume data)

| URL | Primary intent | Theme | Cannibalisation risk |
|---|---|---|---|
| airport-transfers | Book a private transfer from/to Athens airport | Athens airport transfer, private airport transfer Greece | Low if `athens-airport-*` pages are not created |
| port-transfers | Piraeus/cruise transfer | Piraeus cruise port transfer | Low |
| private-chauffeur | Understand/hire a chauffeur vs transfer | private chauffeur Greece, private driver | **Medium vs hourly** — private-chauffeur explains the concept; hourly targets "by the hour / full day" |
| hourly-chauffeur | Hire a driver for set hours | hourly chauffeur Athens | See above |
| intercity-transfers | One-way Athens → another city | Athens to Nafplio/Delphi transfer | Medium vs private-tours for Delphi |
| private-tours | Sightseeing day with driver | private tours from Athens, day trips | Medium vs destination pages — keep destinations as guides, tours as bookable |
| corporate-transportation | Business transport | corporate chauffeur Athens | Low |

## Internal linking matrix (service → service; destinations noted in each page's blocks)

| From \ To | airport | port | private-chauffeur | hourly | intercity | tours | corporate | hub |
|---|---|---|---|---|---|---|---|---|
| hub | ● | ● | ● | ● | ● | ● | ● | — |
| airport | | ● | ● | | ● | | | crumb |
| port | ● | | ● | | | ● | | crumb |
| private-chauffeur | | | | ● | | ● | ● | crumb |
| hourly | ● (inline) | | ● | | | ● (inline) | ● | crumb |
| intercity | ● | | ● | | | ● | | crumb |
| tours | | ● | ● | | ● | | | crumb |
| corporate | ● | | ● | | ● | | | crumb |

Every service also links to the destination pages listed in its `destinations` block, and destinations link back via `DESTINATIONS[].services`. The hub link is via breadcrumb and footer ("All services"). Homepage links to six services and the hub; hourly is reachable from the hub, footer, private-chauffeur and corporate-adjacent pages.

## Implementation log (this pass)
- `lib/site/services/hourly-chauffeur.ts` (new) · `lib/site/services/index.ts` (publish) · `lib/site/content.ts` (`SERVICES` entry, `secondary` flag) · `components/site/services-section.tsx` (homepage shows non-secondary only) · `app/(site)/services/page.tsx` (hub rebuilt) · `app/(site)/service.css` (hub styles) · `lib/site/services/private-chauffeur.ts` (related link) · docs.
- Verified: `tsc` clean, `next build` succeeds, hub + hourly return 200 with one H1, every internal link in the sitemap pages resolves (200), no console errors, no horizontal overflow on hourly at 390 px. Not verified: hub visual QA at mobile/desktop (the preview pane would not render screenshots), Lighthouse/Core Web Vitals, structured-data validator, deployed behaviour. Nothing was deployed.
