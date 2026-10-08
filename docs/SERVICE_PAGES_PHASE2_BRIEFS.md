# Service pages — Phase 2 briefs (NOT built yet)

Saved from the owner's master prompt. Build these **only when the business can genuinely serve them and there is enough real content** to make each page deep. Same design system and component set as the phase-1 pages (`lib/site/services/*`, see [SERVICE_PAGES.md](SERVICE_PAGES.md)); each needs its own hero, imagery, use cases, FAQs, internal links, illustration and conversion copy. Never reuse the same FAQ set or swap a keyword into the same template.

General rules that apply to every page: one H1; unique metadata; concise factual answer block at the top; FAQPage schema only for visible FAQs; no invented capacities, models, prices, reviews, awards, licences or years; service-specific CTA label; quote form pre-selects the relevant service.

---

## /services/hourly-chauffeur
**Intent:** chauffeur by the hour Greece · hourly chauffeur Athens · private driver by the hour Greece
**H1:** Private Chauffeur by the Hour
**Core intent:** travellers who need transportation available around their schedule rather than one fixed transfer.
**When it makes sense:** business meetings, shopping, events, sightseeing, multiple appointments, airport + meetings, flexible city travel.
**Signature element:** interactive itinerary-builder visual, e.g. 09:00 Hotel → 10:00 Meeting → 12:30 Lunch → 14:00 Shopping → 17:00 Airport. **No fabricated hourly pricing.**
**CTA:** Plan My Chauffeur Day
**Links:** /services/private-chauffeur · /services/corporate-transportation · /services/private-tours · /destinations/athens · /fleet
**Note:** confirm hourly availability operationally before publishing (the private-chauffeur page currently says "hours or full days, as quoted").

## /services/vip-chauffeur
**Intent:** VIP chauffeur Greece · VIP transportation Athens · luxury chauffeur Greece · executive chauffeur Greece
**H1:** VIP Chauffeur & Luxury Transportation in Greece
**Tone:** discreet, personal, precise, comfortable. No "ultimate", "unmatched", "best in Greece".
**Visual:** minimal dark section; premium vehicle; private arrival; hotel entrance. No cheesy gold.
**Use cases:** VIP airport arrival, executive travel, private events, luxury hotel transfers, special occasions, high-profile guests, private tours (only relevant services).
**Section:** H2 "Discretion Comes Standard." — professional communication, private transportation, attention to itinerary, quiet travel environment. **Do not claim security/protection services** unless actually provided.

## /services/hotel-villa-transfers
**Intent:** hotel transfer Greece · villa transfer Greece · private transfer to hotel Greece · luxury villa chauffeur Greece
**H1:** Private Hotel & Villa Transfers in Greece
**Visual journey:** Airport → Chauffeur → Hotel/Villa → Island/Destination; elegant hotel and villa imagery.
**Sections:** airport→hotel, port→hotel, airport→villa, port→villa, hotel→airport, villa→airport, hotel-to-hotel. Link to destination pages.
**When published:** add links to it from airport-transfers (Airport → Villa card), port-transfers (Port → Villa), and Mykonos/Santorini destination pages.

## /services/wedding-event-transportation
**Intent:** wedding transportation Greece · wedding chauffeur Greece · event transportation Athens · luxury wedding cars Greece
**H1:** Wedding & Event Transportation in Greece
**Visual:** elegant wedding arrival, vehicle, venue, guest transportation.
**Services (only actual capabilities):** bride & groom transportation, guest transfers, hotel-to-venue, airport transfers, event transportation, VIP guest transportation, multiple-vehicle coordination.
**Timeline:** Guest Arrival → Hotel → Venue → Reception → Return.
**CTA:** Plan Event Transportation

## /services/group-transportation
**Intent:** group transportation Greece · group transfer Greece · private minibus Greece · group airport transfer Greece
**H1:** Private Group Transportation in Greece
**Audience:** families, friends, tour groups, corporate groups, wedding guests, cruise groups, events.
**Vehicles (per real fleet only):** premium van, minibus, coach. **Do not publish capacity numbers until verified.**
**Sections:** passenger planning, luggage planning, pickup coordination, multi-stop journeys, group itinerary.
**CTA:** Plan Group Transportation

---

## Internal-link map additions when phase 2 ships

- Airport Transfers → Hotel & Villa Transfers
- Private Chauffeur → Hourly Chauffeur, VIP Chauffeur
- Corporate → VIP, Group, Event Transportation
- Destination pages (Mykonos, Santorini) → Hotel & Villa Transfers, VIP Chauffeur
- Remove the "published pages only" restriction in `lib/site/services/*.ts` link lists as each page goes live.

## Illustrations still to draw (phase 2)

Wedding: hotel → ceremony → reception. Group: multiple passengers → premium vehicle. Hotel/villa: airport → chauffeur → hotel/villa → island. Add to `components/site/service/illustrations.tsx` and the `IllustrationName` type.
