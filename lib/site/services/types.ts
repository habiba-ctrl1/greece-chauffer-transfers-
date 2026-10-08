// Service-page content model.
// Every page is an ordered list of typed blocks, so each service gets its own
// information architecture while sharing one design system and one component set.
// RULE: copy here must stay true to real operations. Anything the owner still
// has to confirm is listed in docs/SERVICE_CLAIMS_TO_VERIFY.md.

export type Tone = "ivory" | "white" | "sand" | "navy";

export interface Head {
  eyebrow: string;
  title: string;
  /** italic second half of the heading */
  em?: string;
  intro?: string;
}

export interface TourCard {
  name: string;
  slug?: string; // destination page, when it exists
  image: string;
  duration: string;
  start: string;
  highlights: string[];
}

export type Block =
  | { type: "split"; tone: Tone; head: Head; body: string[]; bullets?: string[]; image?: { src: string; alt: string }; flip?: boolean }
  | { type: "steps"; tone: Tone; head: Head; steps: { t: string; d: string }[] }
  | { type: "cards"; tone: Tone; head: Head; variant: "route" | "plain" | "ruled"; cards: { t: string; d: string; tag?: string; href?: string; hrefLabel?: string }[] }
  | { type: "compare"; tone: Tone; head: Head; columns: { label: string; title: string; lines: string[]; highlight?: boolean }[] }
  | { type: "vehicles"; tone: Tone; head: Head; ids: string[]; note?: string }
  | { type: "ports"; tone: Tone; head: Head; ports: { name: string; status: string; note: string; href?: string }[] }
  | { type: "tours"; tone: Tone; head: Head; tours: TourCard[]; note?: string }
  | { type: "destinations"; tone: Tone; head: Head; items: { slug: string; note: string }[] }
  | { type: "partners"; tone: Tone; head: Head; who: string[]; cta: { label: string; href: string } };

export type IllustrationName = "airport" | "port" | "chauffeur" | "intercity" | "tours" | "corporate";

export interface ServicePage {
  slug: string;
  /** value understood by the quote form's service step */
  quoteService: "airport" | "port" | "chauffeur" | "intercity" | "tour" | "corporate";
  meta: { title: string; description: string };
  eyebrow: string;
  h1: string;
  intro: string;
  /** Concise, factual answer block for AI/answer-engine extraction */
  answer: string;
  cta: string;
  whatsappText: string;
  facts: string[];
  image: { src: string; alt: string };
  illustration: IllustrationName;
  /** optional one-time staggered words under the intro (chauffeur page) */
  heroWords?: string[];
  theme?: "default" | "corporate";
  blocks: Block[];
  faq: { q: string; a: string }[];
  related: { slug: string; note: string }[];
  closing: { title: string; em: string; text: string };
}
