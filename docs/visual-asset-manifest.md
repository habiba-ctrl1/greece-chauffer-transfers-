# Visual asset manifest

Full detail (dimensions, mobile crop, alt text, filename, Gemini prompt, search query, licensing, status) is in [visual-asset-manifest.csv](visual-asset-manifest.csv). Summary:

| ID | Page | Asset | Size | Status |
|---|---|---|---|---|
| IMG-HUB-01 | /services | Hero + OG photo, coastal road, golden hour | 2400×1350 / 1200×630 | Required |
| IMG-AIR-01 / 02 | /services/airport-transfers | Arrivals-kerb photo; arrival→destination SVG | 2400×1350 / SVG | Replace placeholder / optional |
| IMG-PORT-01 | /services/port-transfers | Cruise ship at quay with vehicle | 2400×1350 | Replace placeholder |
| IMG-CHF-01 | /services/private-chauffeur | Chauffeur opening rear door, Athens dusk | 2400×1350 | Replace placeholder |
| IMG-HRL-01 / 02 | /services/hourly-chauffeur | Vehicle outside Athens hotel; day-timeline SVG | 2400×1350 / SVG | Required / optional (currently reuses the chauffeur placeholder) |
| IMG-INT-01 / 02 | /services/intercity-transfers | Peloponnese road photo; routes SVG (served routes only) | 2400×1350 / SVG | Replace placeholder / optional |
| IMG-TUR-01…08 | /services/private-tours | Hero + one photo per tour card | 1600×1000 | Required (real landmark photography) |
| IMG-COR-01 | /services/corporate-transportation | Executive entering vehicle | 2400×1350 | Replace placeholder |
| IMG-FLT-01…06 | Fleet | Real vehicle photos | 1200×750 | Required (must be real vehicles) |
| IMG-DST-01…09 | /destinations/* | One photo per destination | 1600×1000 | Replace placeholders |
| IMG-OG-ALL | All pages | 1200×630 JPG share image | 1200×630 | Required |

Rules: AI images are for conceptual or atmospheric use only, never as proof of real vehicles, staff or customers; use licensed real photography for landmarks and for the fleet. Existing placeholders in `public/images/` remain in place so no page references a missing file.
