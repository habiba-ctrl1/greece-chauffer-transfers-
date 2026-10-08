import type { ServicePage } from "./types";

export const privateChauffeur: ServicePage = {
  slug: "private-chauffeur",
  quoteService: "chauffeur",
  meta: {
    title: "Private Chauffeur Service in Greece | Chauffeur & Driver Hire",
    description:
      "A dedicated chauffeur and private vehicle in Greece for business, sightseeing and special occasions. Request a private chauffeur quote for Athens and beyond.",
  },
  eyebrow: "Private chauffeur service · Greece",
  h1: "Private Chauffeur Service in Greece",
  intro:
    "A professional vehicle and chauffeur dedicated to your journey, whether you're moving between meetings, exploring a destination or spending the day on your own itinerary.",
  answer:
    "A private chauffeur service in Greece means a professional driver and a private vehicle reserved for you for an agreed time or route, instead of a single point-to-point ride. Greece Chauffeur Service arranges this for business travel, sightseeing, shopping, events and multi-stop days, mainly around Athens and on journeys from Athens, subject to availability. The plan and quote are agreed before you travel.",
  cta: "Request a Chauffeur",
  whatsappText: "Hello, I'd like to arrange a private chauffeur in Greece.",
  facts: ["Dedicated chauffeur", "Private vehicle", "Itinerary agreed in advance", "Hours or full days, as quoted", "Quiet, private travel"],
  image: { src: "greece-private-chauffeur-service-athens", alt: "A chauffeur opening the rear door of a black vehicle for a passenger at dusk in Athens" },
  illustration: "chauffeur",
  heroWords: ["Arrive", "Move", "Explore", "Return"],
  blocks: [
    {
      type: "compare",
      tone: "ivory",
      head: { eyebrow: "Chauffeur or transfer?", title: "Two Different Things", em: "People Search For" },
      columns: [
        { label: "Standard transfer", title: "Point A → Point B", lines: ["One journey between two addresses", "Fixed start and finish", "Best when you only need to get somewhere", "Pickup, drive, drop-off"] },
        { label: "Private chauffeur", title: "A vehicle and driver for your plan", lines: ["Reserved for the hours or route you agree", "Several stops, waiting and returns built in", "Best when your day has more than one place in it", "The same chauffeur and vehicle throughout"], highlight: true },
      ],
    },
    {
      type: "cards",
      tone: "white",
      variant: "plain",
      head: { eyebrow: "What you get", title: "The Core of", em: "the Service" },
      cards: [
        { t: "A dedicated chauffeur", d: "One professional driver for your whole booking, who knows your plan." },
        { t: "A private vehicle", d: "Chosen for your party, kept with you between stops so luggage and coats stay in the car." },
        { t: "A flexible itinerary", d: "The route and timing are agreed beforehand; discuss in advance how much room you want to adjust." },
        { t: "Professional service", d: "Punctual, polite, and focused on keeping the day running smoothly." },
        { t: "Quiet and private", d: "No other passengers and no shared route; useful for calls, conversation or rest." },
      ],
    },
    {
      type: "steps",
      tone: "sand",
      head: { eyebrow: "A chauffeur day", title: "Plan, Meet, Travel,", em: "Adjust, Return" },
      steps: [
        { t: "Plan", d: "Send your date, start time, places and how long you need. We propose a vehicle and a realistic schedule." },
        { t: "Meet", d: "Your chauffeur collects you from the agreed address at the agreed time." },
        { t: "Travel", d: "Stop to stop, with waiting built into the plan so you are never rushing back to the car." },
        { t: "Adjust", d: "Tell us in advance how flexible you want the day to be, and we confirm what is possible." },
        { t: "Return", d: "Back to the hotel, the airport or wherever the day ends." },
      ],
    },
    {
      type: "cards",
      tone: "ivory",
      variant: "route",
      head: { eyebrow: "Use cases", title: "What People Use", em: "a Chauffeur For" },
      cards: [
        { tag: "Business", t: "Meetings across the city", d: "Several appointments in a day without parking or taxis in between.", href: "/services/corporate-transportation", hrefLabel: "Corporate transportation" },
        { tag: "Sightseeing", t: "A day around Athens", d: "The Acropolis, the coast and lunch at your own pace.", href: "/destinations/athens", hrefLabel: "Athens chauffeur service" },
        { tag: "Shopping", t: "Multiple stops", d: "Bags stay in the vehicle while you move between places." },
        { tag: "Occasions", t: "Dinners and celebrations", d: "Door-to-door for an evening, with the return arranged." },
        { tag: "Multi-stop", t: "Hotel, venue, airport", d: "A single chauffeur for a day of connected moves." },
        { tag: "Day trips", t: "Out of the city", d: "Cape Sounion, Nafplio and Delphi with a private vehicle.", href: "/services/private-tours", hrefLabel: "Private chauffeur tours" },
        { tag: "Events", t: "Guests and hosts", d: "Moving people between hotel and venue on a set programme." },
        { tag: "Hotel stays", t: "Transport throughout a stay", d: "Several outings arranged in advance from one booking." },
      ],
    },
    {
      type: "split",
      tone: "white",
      head: { eyebrow: "Words matter", title: "Chauffeur, Private Driver,", em: "Driver with a Car" },
      body: [
        "Travellers search for a private driver, chauffeur hire or a car with driver, and in practice these mean the same thing: a professional driver and a private vehicle reserved for you.",
        "We use “chauffeur” for the service because the emphasis is on the way it is run: a dedicated person, a prepared vehicle and an agreed plan, not just somebody at the wheel.",
      ],
    },
    {
      type: "vehicles",
      tone: "ivory",
      head: { eyebrow: "Vehicles", title: "Choose the Vehicle", em: "for Your Day" },
      ids: ["executive-sedan", "premium-sedan", "luxury-suv", "luxury-van"],
    },
    {
      type: "destinations",
      tone: "sand",
      head: { eyebrow: "Where chauffeurs go", title: "Beginning in Athens,", em: "Reaching Further" },
      items: [
        { slug: "athens", note: "City days, meetings and evenings out." },
        { slug: "cape-sounion", note: "Coastal drive to the Temple of Poseidon." },
        { slug: "nafplio", note: "The Peloponnese by private vehicle." },
        { slug: "delphi", note: "A longer day into central Greece." },
      ],
    },
  ],
  faq: [
    { q: "What is a private chauffeur service in Greece?", a: "A professional driver and a private vehicle reserved for you for an agreed time or route. Unlike a single transfer, the chauffeur stays with you across several stops." },
    { q: "What is the difference between a chauffeur and a taxi?", a: "A taxi takes you from one place to another. A chauffeur is arranged in advance, with a named vehicle and driver planned around your itinerary, including waiting and return legs." },
    { q: "Can I book a private driver for several hours?", a: "Yes, tell us the date, start time and how long you need, and we confirm the details in your quote. Hourly or full-day arrangements are agreed individually." },
    { q: "Does the chauffeur wait while I'm at a meeting or visit?", a: "Waiting is part of the plan we agree with you. List your stops and rough times so the quote reflects the real day." },
    { q: "Can I change the route on the day?", a: "Tell us in advance how flexible you would like the day to be. Small adjustments are usually a conversation with your chauffeur; larger changes affect timing and should be agreed beforehand." },
    { q: "Can the chauffeur take me outside Athens?", a: "Yes, journeys from Athens to places such as Cape Sounion, Nafplio or Delphi can be arranged. Send your route and we confirm what we can offer." },
    { q: "Can I request a specific vehicle?", a: "You can state a vehicle category preference in your request. We confirm what is available for your dates and group." },
  ],
  related: [
    { slug: "private-tours", note: "A chauffeur-driven day to landmarks beyond Athens." },
    { slug: "corporate-transportation", note: "Executive travel and multi-vehicle programmes." },
    { slug: "intercity-transfers", note: "One-way journeys between cities." },
  ],
  closing: { title: "Tell Us About", em: "Your Day.", text: "Send the date, the places and the hours you need. We reply with a tailored quote for your chauffeur." },
};
