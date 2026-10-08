import type { ServicePage } from "./types";
import { airportTransfers } from "./airport-transfers";
import { portTransfers } from "./port-transfers";
import { privateChauffeur } from "./private-chauffeur";
import { privateTours } from "./private-tours";
import { intercityTransfers } from "./intercity-transfers";
import { corporateTransportation } from "./corporate-transportation";

/**
 * Phase 1 — the six published, deep service pages.
 * Phase 2 (vip-chauffeur, hotel-villa-transfers, wedding-event-transportation,
 * group-transportation, hourly-chauffeur) is intentionally NOT here: see
 * docs/SERVICE_PAGES_PHASE2_BRIEFS.md. Add a page by creating a data file and listing it here.
 */
export const SERVICE_PAGES: ServicePage[] = [
  airportTransfers,
  portTransfers,
  privateChauffeur,
  privateTours,
  intercityTransfers,
  corporateTransportation,
];

export const servicePageBySlug = (slug: string) => SERVICE_PAGES.find((p) => p.slug === slug);
