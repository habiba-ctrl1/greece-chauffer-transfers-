import type { ServicePage } from "./types";

export const intercityTransfers: ServicePage = {
  slug: "intercity-transfers",
  quoteService: "intercity",
  meta: {
    title: "Private Intercity Transfers in Greece | City-to-City Chauffeur",
    description:
      "Private chauffeur transfers between Athens and Delphi, Nafplio, Meteora and other Greek destinations. Door-to-door, flexible stops. Request an intercity quote.",
  },
  eyebrow: "Private intercity transfers · Greece",
  h1: "Private Intercity Transfers Across Greece",
  intro:
    "Travel between Greek cities, airports, ports and destinations without the complexity of driving unfamiliar roads or coordinating multiple connections.",
  answer:
    "An intercity transfer is a private, one-way or return road journey between two places in Greece, such as Athens to Nafplio or Athens to Delphi, in a vehicle with a professional chauffeur. Greece Chauffeur Service plans the route, stops and vehicle with you in advance, subject to availability. Longer or multi-day journeys can be discussed as custom itineraries.",
  cta: "Plan My Intercity Transfer",
  whatsappText: "Hello, I'd like a quote for a private intercity transfer in Greece.",
  facts: ["Door-to-door", "Private vehicle", "Stops agreed in advance", "Luggage-friendly", "One chauffeur, no connections"],
  image: { src: "greece-private-intercity-transfer-peloponnese", alt: "A chauffeur vehicle on a road above the sea in the Peloponnese" },
  illustration: "intercity",
  blocks: [
    {
      type: "cards",
      tone: "ivory",
      variant: "route",
      head: { eyebrow: "Popular journeys", title: "Routes Travellers", em: "Ask for Most", intro: "Examples from Athens. Driving times are approximate, without stops, and vary with traffic. Tell us your route if it is not here." },
      cards: [
        { tag: "Athens → Nafplio", t: "Into the Peloponnese", d: "About 1.5–2 hours by road. A seaside town of old streets and fortress views.", href: "/destinations/nafplio", hrefLabel: "Nafplio" },
        { tag: "Athens → Delphi", t: "Into central Greece", d: "About 2.5–3 hours by road, climbing into the mountains around Parnassus.", href: "/destinations/delphi", hrefLabel: "Delphi" },
        { tag: "Athens → Meteora", t: "To Thessaly", d: "A long drive of roughly 4–5 hours each way. Often best planned with an overnight stay; ask us.", href: "/destinations/meteora", hrefLabel: "Meteora" },
        { tag: "Athens → Cape Sounion", t: "Down the Attica coast", d: "About 1–1.5 hours along the coast road to the Temple of Poseidon.", href: "/destinations/cape-sounion", hrefLabel: "Cape Sounion" },
        { tag: "Airport ↔ City", t: "Airport links", d: "Between Athens International Airport and your hotel.", href: "/services/airport-transfers", hrefLabel: "Airport transfers" },
        { tag: "City ↔ Port", t: "Port links", d: "Between Athens and Piraeus for ferries and cruises.", href: "/services/port-transfers", hrefLabel: "Port transfers" },
      ],
    },
    {
      type: "cards",
      tone: "white",
      variant: "plain",
      head: { eyebrow: "Why private", title: "Why Go City-to-City", em: "Privately" },
      cards: [
        { t: "Door-to-door", d: "Collected where you are, delivered where you are staying; no station or car-rental counter." },
        { t: "Your luggage stays with you", d: "No lifting bags between connections." },
        { t: "Stops on your terms", d: "Coffee, a viewpoint or an ancient site on the way, agreed in advance." },
        { t: "One vehicle, one plan", d: "Fewer moving parts than coach times, ferries and transfers strung together." },
        { t: "A direct journey", d: "The route is yours alone, so the schedule follows your group." },
      ],
    },
    {
      type: "compare",
      tone: "sand",
      head: { eyebrow: "Choosing how to travel", title: "Private Transfer,", em: "Rental Car or Coach?" },
      columns: [
        { label: "Rental car", title: "You drive", lines: ["Full control, but you navigate and park", "Unfamiliar roads and tolls", "Return the car at the end"] },
        { label: "Coach or bus", title: "Shared timetable", lines: ["Fixed departure times and stops", "Often needs a transfer at both ends", "Economical for solo travellers"] },
        { label: "Private transfer", title: "A chauffeur and vehicle", lines: ["Door-to-door, on your schedule", "Flexible stops agreed in advance", "No driving, parking or returns"], highlight: true },
      ],
    },
    {
      type: "split",
      tone: "ivory",
      head: { eyebrow: "Longer trips", title: "Multi-Day", em: "Journeys" },
      body: [
        "Some routes are better as a connected itinerary than as separate transfers, for example Athens to Nafplio, a night in the Peloponnese, then onward to Delphi.",
        "If you are planning something like this, tell us the places and dates. We confirm what we can arrange and propose a sensible sequence, rather than promising a programme before we know it works.",
      ],
      bullets: ["Share the places and dates", "We propose a sequence and vehicle", "You confirm before anything is booked"],
    },
    {
      type: "steps",
      tone: "white",
      head: { eyebrow: "How it works", title: "From Request", em: "to Arrival" },
      steps: [
        { t: "Share your route", d: "Where you start, where you are going, when, and how many of you." },
        { t: "Agree stops and timing", d: "We suggest a realistic schedule and any stops worth making." },
        { t: "Travel privately", d: "Your chauffeur meets you at the agreed point and drives directly." },
        { t: "Arrive", d: "Dropped at the door, with the return leg arranged if you need one." },
      ],
    },
    {
      type: "destinations",
      tone: "sand",
      head: { eyebrow: "Destinations", title: "Where Intercity", em: "Journeys End" },
      items: [
        { slug: "nafplio", note: "Peloponnese seaside town." },
        { slug: "delphi", note: "Ancient site in the mountains." },
        { slug: "meteora", note: "Clifftop monasteries in Thessaly." },
        { slug: "cape-sounion", note: "Temple of Poseidon on the coast." },
        { slug: "athens", note: "The usual starting point." },
      ],
    },
  ],
  faq: [
    { q: "Can I travel between cities with a private chauffeur?", a: "Yes. Intercity transfers are private road journeys with a chauffeur between Athens and other destinations in Greece. Send your route and dates and we confirm what we can arrange." },
    { q: "How long does a private transfer from Athens to Delphi take?", a: "Roughly 2.5 to 3 hours each way by road, depending on traffic and stops. We plan the schedule with you." },
    { q: "How long is the drive from Athens to Nafplio?", a: "Around 1.5 to 2 hours. It works well as a one-way transfer or a full day out and back." },
    { q: "Is Meteora realistic as a day trip from Athens?", a: "It is possible but long, at roughly four to five hours each way. Many travellers prefer an overnight stay; tell us your dates and we suggest what works." },
    { q: "Can we make stops along the way?", a: "Yes, stops can be agreed in advance and built into the schedule. Say what you would like to see." },
    { q: "Can you arrange a multi-day journey?", a: "Longer journeys can be discussed as custom itineraries. Share the places and dates and we confirm whether and how we can do it." },
    { q: "Do you serve every city in Greece?", a: "Not automatically. Tell us your route and we confirm instead of listing places we cannot reliably serve." },
  ],
  related: [
    { slug: "private-tours", note: "A full day of sightseeing with a chauffeur." },
    { slug: "private-chauffeur", note: "Keep a chauffeur with you at the destination." },
    { slug: "airport-transfers", note: "Start the journey straight from arrivals." },
  ],
  closing: { title: "Tell Us Where", em: "You're Heading.", text: "Send your route, your dates and your group. We reply with a tailored quote for your intercity transfer." },
};
