# Phase 1 Audit — greecechaufferservice.com

Date: 2026-10-26 · Scope: repo (branch `claude/website-service-page-plan-a38384`, HEAD 344e6c5) + unauthenticated checks of the live site.
No production code was changed. Nothing here is a ranking, traffic or conversion forecast. Items marked **[OWNER]** need a business fact.
Not run: `npm ci`/build/lint/typecheck/tests (no `node_modules` in this worktree), Lighthouse/Core Web Vitals, Search Console/analytics (no access). Treat those as open.

## 0. Headline finding (P0)

**On production, every dynamic public page returns HTTP 404**, although `/sitemap.xml`, `/services` and `/destinations` list and link to them.

| Works (200) | 404 on live |
|---|---|
| `/`, `/services`, `/destinations`, `/faq`, `/contact`, `/privacy`, `/login`, `/sitemap.xml`, `/robots.txt`; `/admin` → 307 to login; `/services/private-driver` → 308 | `/services/{airport-transfers, port-transfers, private-chauffeur, intercity-transfers, private-tours, corporate-transportation}` and `/destinations/{athens, piraeus, cape-sounion, delphi, meteora, nafplio, mykonos, santorini, crete}` (15 URLs; 11 checked directly — all 6 services plus athens, piraeus, delphi, mykonos, crete — the other 4 destinations share the same route) |

Effect: none of the six service pages or nine destination pages can be found, indexed or used today; the sitemap is advertising 15 dead URLs and the site's internal links go to 404s; the `/services/private-driver` redirect lands on a 404.
Likely cause (unconfirmed — needs a local `opennextjs-cloudflare build` and a look at the generated worker): both routes use `generateStaticParams` + `dynamicParams = false` under `(site)` route group on OpenNext/Cloudflare; the static-param pages are probably not being emitted into the worker/asset output, or the `(site)`/`(app)` dual root-layout setup interferes. Fix is a Phase A item and must precede all content work.

## 1. Stack and deployment

Next.js 16 (App Router, React 19) → `@opennextjs/cloudflare` → Cloudflare Workers; D1 (SQLite) binding `DB`; GitHub Actions deploy on push to `main` (tests → D1 migrations → deploy) plus a cron workflow hitting `/api/cron/tick`. Two route groups: `(site)` public, `(app)` admin/login. Fonts via `next/font` (Cormorant Garamond, Manrope). `images.unoptimized` (no image optimiser on Workers). Security headers set in `next.config.ts`; `/admin` and `/quote/*` are `noindex, no-store`.

## 2. URL inventory (live vs repo)

| URL | Purpose | Live | Verdict |
|---|---|---|---|
| `/` | Homepage, hero quote widget, services, fleet, tours, corporate, partner, coverage map, FAQ | 200 | Keep, improve |
| `/services` | Hub | 200 | Keep |
| `/services/airport-transfers` | Airport (Athens) | **404** | Keep slug, fix routing |
| `/services/port-transfers` | Piraeus/cruise | **404** | Keep |
| `/services/private-chauffeur` | Chauffeur / "private driver" intent | **404** | Keep (absorbs hourly/day until split) |
| `/services/intercity-transfers` | City-to-city | **404** | Keep |
| `/services/private-tours` | Driver tours | **404** | Keep |
| `/services/corporate-transportation` | Corporate | **404** | Keep (brief suggests `corporate-chauffeur`; do **not** rename — no gain) |
| `/services/private-driver` | 308 → private-chauffeur | 308→404 | Keep redirect |
| `/destinations` + 9 children | Athens, Piraeus, Cape Sounion, Delphi, Meteora, Nafplio, Mykonos, Santorini, Crete (one thin template: photo, 1 paragraph, links) | hub 200, children **404** | Keep; rebuild with real content later |
| `/faq`, `/contact` (5-step quote form), `/privacy` | Support | 200 | Keep |
| `/quote/accept/[token]` | Customer quote acceptance | 200, noindex | Preserve |
| `/login`, `/admin/*`, `/api/{health,cron/tick,webhooks/resend}` | CRM / ops | protected | Preserve |
| `/fleet`, `/partners`, `/tours`, `/about`, `/terms`, `/routes/*` | — | 404 (not built) | Proposed |

## 3. Functionality that must be preserved

- Public quote pipeline: `components/site/quote-form.tsx` → `submitInquiry` (`lib/actions/leads.ts`): server validation (`lib/crm/inquiry-input.ts`), honeypot, D1 rate limit (8/10 min per IP, 5/h per email), durable save before success message, reference ID, outbox email with retry (Resend), attribution capture. Error path returns an honest failure. *(Note: `docs/SITE_ARCHITECTURE.md` §7 still describes the older `submitQuoteRequest`/no-rate-limit pipeline — stale doc.)*
- CRM: inquiries, quotes + builder + PDF, follow-ups, customers, drivers, bookings, invoices, emails/outbox, reports, settings; cron tick; Resend webhook (Svix signature); password auth + session guard; tests in `tests/` (money, queries, security, workflow, sample PDF).
- Config via env: `NEXT_PUBLIC_{SITE_URL, WHATSAPP_NUMBER, PHONE, CONTACT_EMAIL}`, `BOOKING_NOTIFICATION_EMAIL`, etc. Contact email in use: greecechauffertransfers@gmail.com.

## 4. Defects, ranked

**P0**
1. All 15 dynamic pages 404 in production (§0). Sitemap lists them (search engines will see soft failures/404s).

**P1**
2. **No WhatsApp or phone on the live site** — only `mailto:` is rendered. `NEXT_PUBLIC_WHATSAPP_NUMBER`/`PHONE` are build-time and apparently unset in the deploy workflow (the workflow has no `env:` for them). "WhatsApp Us" CTAs currently fall back to `/contact#quote`. **[OWNER]** supply number; add to build env.
3. **All imagery is generated SVG placeholders**; no `og:image`/Twitter image anywhere (social shares have no preview image); homepage fleet capacities are placeholders (per `SERVICE_CLAIMS_TO_VERIFY.md`). **[OWNER]** real photos/licences.
4. **Sitemap `lastmod` is the build time for every URL** (`new Date()`), which makes the signal meaningless; no `priority` use is harmful but pointless.
5. **No analytics / conversion events / Search Console verification** exist in code. Cannot measure qualified enquiries. Needs consent decision.
6. Destination pages are one template with one paragraph and an `illustrative image` alt → thin-content/duplication risk; title pattern `Private Chauffeur & Transfers — {Name}` repeats across 9 pages. Also no Service/FAQ schema, no OG data, `Piraeus` destination overlaps `/services/port-transfers`.
7. Several operational claims unverified (documented in `SERVICE_CLAIMS_TO_VERIFY.md`): flight-delay/waiting policy, hourly availability, driving times, Delphi/Meteora timings, tickets/guides, invoicing, child seats.

**P2**
8. Organization JSON-LD is minimal (no logo, no sameAs); correct to avoid LocalBusiness/rating without facts. Service JSON-LD lacks `serviceType` variants per route; FAQPage on every page is fine only while FAQs are visible and unique — review for duplicates between home and `/faq` (Google limits FAQ rich results anyway; no ranking benefit assumed).
9. Home canonical has no trailing path variant issue but `alternates.canonical: "./"` in layout is relative — verify it resolves per page for `/faq`, `/contact`, `/privacy` (they set none of their own except via layout).
10. `/contact` should probably be indexable but its query-param variants (`?destination=`, `?topic=`) need canonical to base URL — confirm.
11. Header/footer link to `/#fleet`, `/#tours`, `/#partners` anchors rather than pages.
12. No `hreflang`/multi-language; target audience is international English only — acceptable, note.
13. Possible performance risks to measure: parallax/reveal JS on first view, Google Fonts via `next/font` (self-hosted, fine), large hero images once real photos land (budget < 250 KB hero).
14. Unconfirmed accessibility: form validation announcements, mobile drawer focus trap, contrast of bronze/sand on ivory — test in Phase A.

## 5. Gaps against the brief

| Brief item | Status |
|---|---|
| Hourly chauffeur / full-day | Folded into `private-chauffeur`; no dedicated pages. Needs owner decision on hourly rules. |
| Wedding / events / group | Not built; only mentioned in corporate. **[OWNER]** confirm operational availability. |
| Luxury / VIP | Not built (brief in `SERVICE_PAGES_PHASE2_BRIEFS.md`). |
| Cross-border | Not built. Do not build until feasibility proven. |
| Hotel/villa transfers | Not built; Airport/Port pages mention villa journeys. |
| `/fleet`, `/partners`, `/about`, `/terms` | Missing. Fleet needs real vehicle facts. |
| Routes (`/routes/*`) | None. Intercity page lists routes as cards only. |
| Reviews/trust | Honest placeholder; no verified credentials. Good. |
| Island coverage (Mykonos/Santorini/Crete) | Pages exist but **[OWNER]** must confirm real coverage (island drivers/partners). |

## 6. Competitor observations (limited — one standard search, not a full study)

Search results for "private chauffeur Athens / airport transfer / hourly" show marketplace and aggregator style players (Blacklane, Transfeero, travel-platform listings) leading, with common patterns: hourly pages that spell out included km per hour and overtime rules, same-city return rules, airport pages with free waiting/grace periods, tiered vehicle classes, and fixed-price language. Implication: niche players should differentiate with specific operating rules (stated once verified), real route facts and honest quote process rather than generic claims. A proper competitor sweep (top 10 SERPs per target query + page structure) is a Phase A.5 task once Search Console data is available; I have not verified any volumes.

## 7. Proposed keyword-intent map and URL architecture

Principle: keep existing slugs; add pages only for distinct intent. Existing → proposed:

| Proposed URL | Intent type | Action | Notes |
|---|---|---|---|
| `/services` | Commercial hub | Keep | Link to every service |
| `/services/airport-transfers` | Transactional | Keep/fix | Athens airport; later per-airport only if served |
| `/services/port-transfers` | Transactional | Keep/fix | Piraeus first; Rafina/Lavrio only if served |
| `/services/private-chauffeur` | Commercial | Keep | Stays the umbrella for "private driver/chauffeur Greece" |
| `/services/hourly-chauffeur` | Transactional | **New, P1** | Distinct: duration-based, stops, overtime. Needs owner rules. |
| `/services/full-day-chauffeur` | — | **Do not create**; merge into hourly page as a "full-day" section | Same intent/cannibalisation risk; revisit with data |
| `/services/intercity-transfers` | Transactional | Keep | Route cards link to route pages once built |
| `/services/private-tours` | Commercial investigation | Keep | Transport-only unless guides confirmed |
| `/services/corporate-transportation` | B2B | Keep (no rename) | |
| `/services/wedding-event-transportation` | Transactional/B2B | New, after owner confirms | Brief proposed separate wedding/events pages; recommend ONE page initially to avoid thin duplicates |
| `/services/luxury-vip-chauffeur` | Commercial | New P2 | Only with real fleet |
| `/services/cross-border-transfers` | Informational/feasibility | New P2, **gated** | |
| `/destinations/{athens,mykonos,santorini,crete,…}` | Commercial/local | Rebuild with distinct content | Merge `piraeus` into `/services/port-transfers` or keep as local hub with unique content |
| `/routes/athens-to-{delphi,meteora,nafplio,thessaloniki,cape-sounion}` | Transactional route | New P1/P2 | Replaces thin destination pages for day-trip places; 301 `/destinations/{delphi,meteora,nafplio,cape-sounion}` → routes only if routes ship with equal/better content |
| `/fleet` | Commercial investigation | New P1 | Real data only |
| `/partners` | B2B | New P1 | Replaces `/#partners` anchor and `/contact?topic=partner` |
| `/about`, `/terms` | Trust/legal | New | **[OWNER]** company facts |

Per-page documentation (primary query, secondary terms, parent hub, links, conversion action) will be produced for the approved launch set in Phase A/B; I have deliberately not invented search volumes.

## 8. Page-by-page section specifications (summary)

Existing six pages use a typed block model (`lib/site/services/*.ts`), so new pages are data files, not new templates. Specs for new pages:
- **Hourly chauffeur:** hero + itinerary-builder visual; hourly vs transfer comparison; what's included (only after rules verified); minimum hours, km, overtime, return rules **[OWNER]**; vehicle classes; FAQ; quote form with hours/stops fields.
- **Wedding & events:** schedule timeline (arrival → hotel → venue → reception → return); bridal car vs guest vans; multi-vehicle proposal form (date, venue, guests, vehicles). Gate: **[OWNER]** confirms.
- **Fleet:** class cards with verified seats/luggage, "or similar" wording, quote CTA.
- **Route pages:** distances/timings checked against routing data, stops worth making, vehicle suitability, quote form prefilled; each must have unique practical content.
- **Cross-border:** feasibility checklist, per-country requirements, enquiry-only form; no instant booking.
- **Partners:** B2B proposition, what partners get, enquiry form.

## 9. Asset requirements

Inventory: 26 SVG placeholders in `public/images` (hero, destinations, vehicle classes, 6 service art). None are real photography; none usable as proof of fleet. Needed: real hero (2400×1350, <250 KB), service heroes (1600×1000), vehicle photos (1200×750, consistent angle), destination photos, OG images 1200×630 per key page, logo/favicon check. Original SVGs I can build: booking-process, hourly itinerary, route maps, vehicle class diagrams, comparison infographics. **[OWNER]** to provide/license photography; generated art must stay labelled illustrative.

## 10. Questions for the owner

1. WhatsApp number, phone number, business hours, response time you can honestly state.
2. Legal/operating entity name, licence/insurance you can publicly claim, address (only if you want LocalBusiness schema).
3. Real fleet: models, seats, luggage, whether owned or partner-supplied; photos you own.
4. Hourly rules: minimum hours, km included, overtime, return-to-city rule, waiting.
5. Airport/port policy: meet-and-greet, flight monitoring, free waiting time, child seats.
6. Which locations you truly serve: Athens only? Thessaloniki, islands (who drives there), other airports/ports?
7. Weddings/events/group: do you take them, how many vehicles?
8. Cross-border: any routes already run, with which vehicles/insurance/partners?
9. Cancellation and payment terms; invoicing for corporate.
10. Any real reviews/testimonials with permission; any partner logos you may show.
11. Analytics preference (GA4 / Plausible / none) and cookie-consent approach.
12. Is Search Console set up? Can you grant access or export top queries?

## 11. Phased plan, dependencies, risks, acceptance

| Phase | Scope | Likely files | Acceptance |
|---|---|---|---|
| **A** (first) | Reproduce and fix the 404s; verify deploy; fix sitemap lastmod; wire WhatsApp/phone env into deploy workflow; fix stale docs; OG image plumbing; run lint/typecheck/tests; basic a11y + CWV baseline | `app/(site)/*`, `next.config.ts`, `open-next.config.ts`, `app/sitemap.ts`, `.github/workflows/deploy.yml`, docs | All 15 URLs return 200 on a preview/prod deploy; sitemap URLs all 200; build/lint/test pass |
| **B** | Hourly page, fleet, partners, quote-form conditional fields (hours/stops, event, corporate) + server validation in `inquiry-input.ts`; WhatsApp prefill; analytics events (if approved) | `lib/site/services/`, `components/site/quote-form.tsx`, `lib/crm/inquiry-input.ts`, `lib/actions/leads.ts` | Forms save and email; honest error states; tests extended |
| **C** | Destination rebuild + 4–6 route pages with verified route data and per-page art direction | `lib/site/content.ts`, `app/(site)/{destinations,routes}`, new SVGs | Unique content each; link matrix validated; redirects only if content replaced |
| **D** | Wedding/event, VIP, corporate refinement (owner-gated) | services data files | Owner sign-off on claims |
| **E** | Cross-border (feasibility-gated, enquiry-only) | new page + form | Per-route feasibility documented |
| **F** | Internal-link refinement, SEO/CRO tests, reporting | various | Link matrix, CWV report |

Risks: owner facts blocking B–E; real photography blocking visual quality and OG; the 404 root cause may touch deployment config shared with the CRM; D1 migrations run in every deploy (any schema change must be backward compatible).
Dependencies: A before everything; owner answers before B (hours/airport rules), D, E.

## Approval requested

Please confirm: (1) go-ahead to start **Phase A** (investigating and fixing the 404s first), (2) the keyword/URL decisions in §7 — especially *not* creating `full-day-chauffeur` and *not* renaming `corporate-transportation`, (3) answers (even partial) to §10.
