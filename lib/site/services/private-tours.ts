import type { ServicePage } from "./types";

export const privateTours: ServicePage = {
  slug: "private-tours",
  quoteService: "tour",
  meta: {
    title: "Private Chauffeur Tours in Greece | Day Trips from Athens",
    description:
      "Private chauffeur-driven day trips from Athens to Cape Sounion, Delphi, Meteora and Nafplio, planned around your pace. Request a private tour quote.",
  },
  eyebrow: "Private chauffeur tours · Greece",
  h1: "Private Chauffeur Tours in Greece",
  intro:
    "Discover Greece at your own pace with private transportation, flexible timing and an itinerary built around the places you want to experience.",
  answer:
    "A private chauffeur tour in Greece is a day journey in a private vehicle with a professional chauffeur, planned around your chosen destination and timing. Greece Chauffeur Service arranges chauffeur-driven day trips from Athens to places such as Cape Sounion, Delphi, Nafplio and Argolis, and can discuss Meteora as a longer journey. It is private transportation; ask us if you would also like a guide arranged.",
  cta: "Plan My Private Tour",
  whatsappText: "Hello, I'd like to plan a private chauffeur tour in Greece.",
  facts: ["Private vehicle and chauffeur", "Itinerary agreed with you", "Flexible timing", "Starts from your hotel", "Day trips from Athens"],
  image: { src: "greece-private-chauffeur-tour-delphi", alt: "A chauffeur vehicle parked below the mountains near Delphi at golden hour" },
  illustration: "tours",
  blocks: [
    {
      type: "steps",
      tone: "ivory",
      head: { eyebrow: "How a tour is planned", title: "Choose, Travel,", em: "Explore, Return" },
      steps: [
        { t: "Choose your destination", d: "Pick from the examples below or tell us what you want to see." },
        { t: "Choose your pace", d: "Early start or late; long lunch or quick stop. The day follows you." },
        { t: "Travel privately", d: "Your chauffeur collects you from your hotel in a vehicle sized to your group." },
        { t: "Explore", d: "Your chauffeur drops you at the sites and meets you at the agreed time." },
        { t: "Return comfortably", d: "Back to your hotel at the end of the day, whenever that is." },
      ],
    },
    {
      type: "tours",
      tone: "white",
      head: { eyebrow: "Example tours", title: "Days Out", em: "from Athens", intro: "Suggested durations include driving and a typical visit, and are a starting point, not a fixed programme." },
      tours: [
        { name: "Athens city day", slug: "athens", image: "athens", duration: "Half day or full day", start: "Your Athens hotel", highlights: ["Acropolis area", "Neighbourhoods and viewpoints", "Lunch at your pace"] },
        { name: "Cape Sounion", slug: "cape-sounion", image: "sounion", duration: "Half day, about 4–5 hours", start: "Your Athens hotel", highlights: ["Temple of Poseidon", "Attica coast road", "Time for sunset if you wish"] },
        { name: "Delphi", slug: "delphi", image: "delphi", duration: "Full day, about 9–11 hours", start: "Your Athens hotel", highlights: ["Ancient sanctuary and museum", "Mountain scenery", "Optional village stop on the way"] },
        { name: "Nafplio", slug: "nafplio", image: "nafplio", duration: "Full day, about 8–10 hours", start: "Your Athens hotel", highlights: ["Old town streets", "Palamidi fortress", "Seafront promenade"] },
        { name: "Argolis", slug: "nafplio", image: "crete", duration: "Full day, about 9–11 hours", start: "Your Athens hotel", highlights: ["Ancient theatre of Epidaurus", "Mycenae", "Combined with Nafplio"] },
        { name: "Meteora", slug: "meteora", image: "meteora", duration: "Long day or overnight", start: "Your Athens hotel", highlights: ["Clifftop monasteries", "Kalambaka area", "Ask us how to plan it"] },
        { name: "Athens Riviera", image: "coast", duration: "Half day", start: "Your Athens hotel", highlights: ["Coastal drive", "Beaches and bays", "Seaside lunch"] },
        { name: "Custom private itinerary", image: "interior", duration: "As agreed", start: "Wherever you stay", highlights: ["Your places, your order", "Stops for photographs and meals", "Multiple destinations where possible"] },
      ],
      note: "Admission tickets and guided visits are not part of the transport. Tell us if you would like them arranged and we confirm what is possible.",
    },
    {
      type: "split",
      tone: "sand",
      head: { eyebrow: "Make it yours", title: "Your Day. Your Route.", em: "Your Greece." },
      body: [
        "The tours above are starting points. Many days work better as a mix: one big site, a quiet village, a long lunch with a view.",
        "Tell us what matters, and we shape the day around it, and say honestly when something will not fit in the time you have.",
      ],
      bullets: ["Custom stops, agreed in advance", "Photography and viewpoint stops", "Lunch stops at your own pace", "Combine nearby destinations", "Start and finish times that suit you"],
    },
    {
      type: "vehicles",
      tone: "ivory",
      head: { eyebrow: "Vehicles", title: "A Vehicle for", em: "Long Days", intro: "For day trips, comfort matters more than anything: legroom, space for bags and a calm cabin." },
      ids: ["executive-sedan", "luxury-suv", "luxury-van", "executive-minivan"],
    },
    {
      type: "destinations",
      tone: "white",
      head: { eyebrow: "Destinations", title: "Where Tours Begin,", em: "and What They Reach" },
      items: [
        { slug: "athens", note: "Your starting point." },
        { slug: "cape-sounion", note: "The classic coastal half-day." },
        { slug: "delphi", note: "History in the mountains." },
        { slug: "nafplio", note: "A refined Peloponnese town." },
        { slug: "meteora", note: "A longer journey north." },
      ],
    },
  ],
  faq: [
    { q: "What is a private chauffeur tour in Greece?", a: "A day journey in a private vehicle with a professional chauffeur, planned around the place you want to visit and your timing, instead of a fixed group schedule." },
    { q: "Is the chauffeur also a tour guide?", a: "Our service is private transportation. If you would like a guide at a site, tell us and we confirm what can be arranged." },
    { q: "Which day trips from Athens are most popular?", a: "Cape Sounion for a half day, and Delphi and Nafplio for full days. Meteora is much longer and usually works better with an overnight stay." },
    { q: "How long is a private day tour?", a: "It depends on the destination: roughly four to five hours for Cape Sounion, and eight to eleven for Delphi, Nafplio and Argolis. We confirm timings in your quote." },
    { q: "Can I add my own stops?", a: "Yes, additional stops can be agreed in advance. List them with your request so the schedule is realistic." },
    { q: "Can we combine two destinations in a day?", a: "Nearby destinations can often be combined, such as Nafplio with Epidaurus or Mycenae. We tell you if a day is too ambitious." },
    { q: "Are entrance tickets included?", a: "Tickets are not part of the transport. Ask us if you would like help arranging them." },
    { q: "Can a tour start from the cruise port?", a: "Yes, port days can be turned into private tours when timed around your ship. Tell us the ship name and times." },
  ],
  related: [
    { slug: "intercity-transfers", note: "One-way journeys without a full tour." },
    { slug: "private-chauffeur", note: "A flexible chauffeur day in and around Athens." },
    { slug: "port-transfers", note: "Combine a port call with a private tour." },
  ],
  closing: { title: "Tell Us What", em: "You'd Like to See.", text: "Share the destination, the date and your group. We reply with a tailored quote for your private tour." },
};
