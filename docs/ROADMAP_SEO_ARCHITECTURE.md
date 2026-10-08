# Roadmap — SEO architecture & entity graph (NOT built yet)

Saved from the owner's brief. Only the **service pages** are being built right now; everything below is the plan for later phases.

## Core principle

Do **not** generate dozens of thin "SEO pages". Build a smaller set of very strong commercial service pages, each with a **different search intent**, then connect them through destinations, fleet and tour clusters.

**DEPTH > PAGE COUNT · AUTHORITY > KEYWORD STUFFING · USER EXPERIENCE > TEMPLATE REPETITION · CONVERSION > DECORATION · REAL INFORMATION > AI FILLER**

## The most important SEO rule

Don't do this (a programmatic-SEO mess where pages compete with each other):

```
/services/athens-airport-transfer
/services/athens-airport-chauffeur
/services/athens-airport-car-service
/services/athens-airport-private-driver
```

Do this instead — one authoritative page per intent, then a graph:

```
Service  →  Destination  →  Route
/services/airport-transfers → /destinations/athens → /routes/athens-airport-to-piraeus
```

Route pages are created **only** when there is genuine search/commercial value and real content.

## Entity graph

```
                    GREECE CHAUFFEUR SERVICE
                              │
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
       SERVICES          DESTINATIONS           FLEET
          │                   │                   │
     ┌────┼────┐         ┌────┼────┐        Sedan / SUV
     ↓    ↓    ↓         ↓    ↓    ↓        Van / Minibus
 Airport Port Chauffeur Athens Mykonos        ...
     │              │      Santorini
     ↓              ↓      Crete
   ROUTES         TOURS     Delphi
     │              │       Meteora
     ↓              ↓
 ATH → Piraeus   Cape Sounion
 ATH → Hotel     Delphi
 ATH → Villa     Meteora
```

Semantic chain: Greece → Service → Destination → Tour / Route → Fleet.
This is stronger for SEO + GEO + AIO + LLM retrieval than keyword-variant pages.

Competitors already cover the obvious (airport transfers, fixed-price language, flight monitoring, port transfers, Mercedes fleet, private tours). Don't win by repeating the same claims 100 times — win with fewer pages, better topical depth, UX, entity relationships and conversion paths.

## Target final architecture

```
/
├── services/
│   ├── airport-transfers            ← built (phase 1)
│   ├── port-transfers               ← built (phase 1)
│   ├── private-chauffeur            ← built (phase 1)
│   ├── private-tours                ← built (phase 1)
│   ├── intercity-transfers          ← built (phase 1)
│   ├── corporate-transportation     ← built (phase 1)
│   ├── hourly-chauffeur             ← phase 2 (see SERVICE_PAGES_PHASE2_BRIEFS.md)
│   ├── vip-chauffeur                ← phase 2
│   ├── hotel-villa-transfers        ← phase 2
│   ├── wedding-event-transportation ← phase 2
│   └── group-transportation         ← phase 2
├── destinations/   athens, piraeus, mykonos, santorini, crete, delphi, meteora, nafplio, cape-sounion
├── tours/          athens, cape-sounion, delphi, meteora, nafplio, custom-private-tours
├── fleet/
├── routes/         [ONLY high-value routes, later]
├── partners/
├── about/
├── faq/
└── contact/
```

Current state: services (6) and destinations (9, thin template) and `/faq`, `/contact` exist. `/tours`, `/fleet`, `/routes`, `/partners`, `/about` do not.

## Destination pages (future — make them lavish and *different*)

Each destination should have its own visual character, not one template:

| Destination | Feel |
|---|---|
| Athens | Urban / editorial |
| Mykonos | Island / luxury |
| Santorini | Volcanic / coastal |
| Delphi | Historical |
| (others) | Define per place — Meteora dramatic/monastic, Nafplio refined/neoclassical, Cape Sounion golden-hour coastal, Crete expansive, Piraeus maritime/port |

Destination → service links (examples from the brief):
- **Athens:** Airport Transfers, Port Transfers, Private Chauffeur, Corporate Transportation, Private Tours
- **Mykonos:** Airport Transfers, Port Transfers, Hotel & Villa Transfers, VIP Chauffeur, Private Tours

Link only to services that are actually published and operationally true. Service pages already link out to destinations; destination pages must link back.

## Anchor text

Avoid "click here / learn more / read more". Prefer descriptive, natural variants: "Private airport transfers in Greece", "Private chauffeur service", "Piraeus port transfers", "Private tours from Athens", "Corporate transportation in Greece", "Luxury hotel and villa transfers". Don't force exact-match anchors repeatedly.

## Next layers, in order

1. Phase 2 service pages (only those the business can really serve).
2. Destination pages rebuilt to the same depth as the services (distinct art direction each).
3. `/tours` hub + individual tour pages (Athens, Cape Sounion, Delphi, Meteora, Nafplio, custom).
4. `/fleet` with real vehicle data and photos.
5. `/partners` (B2B), `/about`, privacy/terms.
6. `/routes/*` — only when search + commercial value is proven.
