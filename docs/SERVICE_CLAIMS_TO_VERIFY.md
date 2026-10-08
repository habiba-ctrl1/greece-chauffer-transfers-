# Service pages — claims the owner must verify before launch

The copy is written to avoid unsupported claims, but several sentences describe how the service works. Confirm each against real operations, then edit the matching file in `lib/site/services/`. Delete this list's items as they're confirmed.

## Applies to all pages
- **Quote-only model:** "no automatic prices", "no payment taken when you request a quote".
- **Child seats can be requested** (airport, homepage FAQ).
- **Fleet categories and "best for" text** come from `lib/site/content.ts` (FLEET). Passenger/luggage numbers on the *homepage* fleet cards are placeholders — replace with real data. Service pages deliberately show no capacities or models.
- **"Subject to availability"** wording is used throughout.

## airport-transfers
- Athens International Airport transfers are served. Other airports are "ask us".
- A named chauffeur/contact and an agreed **meeting point** are given in the confirmation.
- Chauffeur "helps with luggage where needed".
- **Flight delays / waiting time:** page says handling is "confirmed in your quote". Decide the real policy and state it.
- Airport ~35 km from centre, 40–60 min drive: general knowledge, traffic-dependent. Keep or soften.
- Athens Riviera and villa journeys are served.

## port-transfers
- **Piraeus is served; other ports "on request".** Rafina / Lavrio were named in the brief as examples and are intentionally *not* listed. Add them only if actually served.
- Pickup points near each terminal are agreed per booking.
- Ship early/late handling is "confirmed in your quote". State the real policy.
- Airport → Port and Port → Airport, Port → Villa are served.

## private-chauffeur
- **Hours or full days as quoted** — confirm hourly availability (page avoids promising it outright).
- Waiting between stops is part of the agreed plan.
- Same chauffeur and vehicle throughout the booking.
- Out-of-Athens journeys (Cape Sounion, Nafplio, Delphi) are available.
- `/services/private-driver` now redirects here (301/308); "private driver" intent is addressed in a section on this page.

## intercity-transfers
- **Driving times are approximate general knowledge** (Nafplio 1.5–2 h, Delphi 2.5–3 h, Meteora 4–5 h, Sounion 1–1.5 h). Verify against your operating experience.
- Multi-day custom itineraries can be discussed — confirm you offer this.
- Stops along the way "agreed in advance".
- Routes listed are examples; the page says unlisted routes are confirmed per request.

## private-tours
- **Tour durations are suggestions** (Sounion half day; Delphi/Nafplio/Argolis full day; Meteora long day/overnight). Adjust to real practice.
- **The service is transport, not a guided tour** — page says tickets/guides are not included and "ask us". Confirm this is accurate, or add guide options.
- Combination days (Nafplio + Epidaurus/Mycenae), "Athens Riviera" and "custom itinerary" tours are offered.
- Starting point is the customer's hotel.

## corporate-transportation
- Capabilities listed (conference, event, delegation, multi-vehicle coordination) are all actually offered.
- A single point of contact / on-the-day support exists.
- Invoicing can be discussed for companies.
- Partner programme exists (CTA goes to `/contact?topic=partner` until `/partners` is built).

## Not yet possible (needs real assets)
- **OG / Twitter images:** none set. Social crawlers don't accept SVG. Export real photos (1200×630 JPG) per page and add `openGraph.images` in `app/(site)/services/[slug]/page.tsx`.
- **Hero photos:** all are generated placeholders (see SERVICE_PAGES.md → Image requirements).
- **Reviews / ratings / awards:** none used anywhere; no review schema.
