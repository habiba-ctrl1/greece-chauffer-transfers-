import type { ServicePage } from "./types";

export const airportTransfers: ServicePage = {
  slug: "airport-transfers",
  quoteService: "airport",
  meta: {
    title: "Private Airport Transfers in Greece | Athens Airport Chauffeur",
    description:
      "Pre-arranged private airport transfers in Greece. Request a chauffeur and private vehicle from Athens International Airport to your hotel, villa, port or destination.",
  },
  eyebrow: "Private airport transfers · Greece",
  h1: "Private Airport Transfers in Greece",
  intro:
    "Arrive in Greece without the uncertainty of airport queues, unfamiliar roads or last-minute transportation. Enjoy a private chauffeur journey from the airport to your hotel, villa, port or destination.",
  answer:
    "Greece Chauffeur Service arranges private airport transfers for travellers arriving in or leaving Greece. You request a private vehicle and chauffeur in advance for the journey between Athens International Airport “Eleftherios Venizelos” (ATH) and your hotel, villa, port or another destination, subject to availability. Each transfer is quoted individually; there are no automatic prices on this site.",
  cta: "Request Airport Transfer",
  whatsappText: "Hello, I'd like to arrange a private airport transfer in Greece.",
  facts: ["Private vehicle", "Professional chauffeur", "Pre-arranged pickup", "Flight details shared in advance", "Luggage planned into vehicle choice"],
  image: { src: "greece-private-airport-transfer-athens", alt: "A black chauffeur vehicle waiting outside an airport terminal at Athens" },
  illustration: "airport",
  blocks: [
    {
      type: "steps",
      tone: "ivory",
      head: { eyebrow: "From landing to door", title: "A Smoother Start", em: "to Your Greek Journey", intro: "The transfer is decided before you fly, so the first hour in Greece is not spent working out the second." },
      steps: [
        { t: "Arrival", d: "You send your flight number, passenger count, luggage and destination with your request. That is all we need to plan around." },
        { t: "Pickup coordination", d: "Your quote confirms the meeting point and how to reach your chauffeur, so you are not hunting for a sign in a busy arrivals hall." },
        { t: "Meet your chauffeur", d: "One named contact for the pickup. Your chauffeur takes you to the vehicle and helps with luggage where needed." },
        { t: "Private journey", d: "A direct drive to one address. Extra stops are possible when agreed in advance; nothing is shared with other passengers." },
      ],
    },
    {
      type: "cards",
      tone: "white",
      variant: "route",
      head: { eyebrow: "Where transfers go", title: "One Arrival.", em: "Many Destinations.", intro: "Most airport journeys fall into one of these. If yours is different, tell us the address and we will confirm." },
      cards: [
        { tag: "Airport → Hotel", t: "City and coastal hotels", d: "Direct to your hotel door in central Athens or along the coast.", href: "/destinations/athens", hrefLabel: "Athens chauffeur service" },
        { tag: "Airport → Villa", t: "Private villas", d: "Give us the villa address and any access instructions from the host; we plan the route in advance." },
        { tag: "Airport → Cruise port", t: "Piraeus embarkation", d: "Straight from arrivals to your ship, timed around boarding.", href: "/services/port-transfers", hrefLabel: "Port and cruise transfers" },
        { tag: "Airport → Athens", t: "Central Athens", d: "Plaka, Syntagma, Kolonaki and neighbourhoods across the city.", href: "/destinations/athens", hrefLabel: "Athens destinations" },
        { tag: "Airport → Athens Riviera", t: "The Attica coast", d: "Coastal stays south of the city. Tell us your hotel and we plan the drive." },
        { tag: "Airport → elsewhere", t: "Other Greek destinations", d: "Onward journeys to Nafplio, Delphi and beyond are arranged as intercity transfers.", href: "/services/intercity-transfers", hrefLabel: "Intercity transfers" },
      ],
    },
    {
      type: "split",
      tone: "sand",
      head: { eyebrow: "Why pre-arrange", title: "Decisions Made", em: "Before You Land" },
      body: [
        "Athens International Airport sits roughly 35 km east of the city centre, and the drive to the centre or the port is usually between 40 minutes and an hour depending on traffic. A pre-arranged chauffeur turns that stretch into a fixed plan rather than something to organise on arrival.",
        "Because the vehicle is chosen from your passenger count and luggage, a family of five with six suitcases and a couple with one carry-on each get different cars, not the same one.",
      ],
      bullets: ["Address and vehicle confirmed in advance", "Meeting point agreed before you travel", "Fits your group, not a standard car", "Child seats can be requested with your quote"],
    },
    {
      type: "vehicles",
      tone: "ivory",
      head: { eyebrow: "Vehicles", title: "Matched to the", em: "Group and the Luggage", intro: "Executive sedans for couples and individuals, SUVs for families, vans for larger parties. Your quote confirms the exact vehicle." },
      ids: ["executive-sedan", "luxury-suv", "luxury-van", "group"],
      note: "Vehicle categories shown are indicative. Capacities and models are confirmed when you receive your quote.",
    },
    {
      type: "cards",
      tone: "white",
      variant: "plain",
      head: { eyebrow: "Who books", title: "Who an Airport", em: "Transfer Suits" },
      cards: [
        { t: "Families with luggage", d: "One vehicle, one pickup, car seats requested in advance rather than improvised." },
        { t: "Business travellers", d: "A fixed plan from arrivals to the first meeting or hotel." },
        { t: "First visits to Greece", d: "No navigating signage, ticket machines or unfamiliar roads after a long flight." },
        { t: "Groups arriving together", d: "Everyone in the same vehicle, or vehicles coordinated for a larger party." },
      ],
    },
    {
      type: "destinations",
      tone: "sand",
      head: { eyebrow: "Beyond Athens", title: "Island and Regional", em: "Arrivals", intro: "Tell us your dates and arrival details and we confirm what we can arrange at each destination." },
      items: [
        { slug: "athens", note: "Our hub for airport arrivals." },
        { slug: "piraeus", note: "Airport to port for cruises and ferries." },
        { slug: "mykonos", note: "Island arrivals: ask us about availability." },
        { slug: "santorini", note: "Airport, port and hotel journeys on request." },
        { slug: "crete", note: "Large island; share your route first." },
      ],
    },
  ],
  faq: [
    { q: "How do I book a private airport transfer in Greece?", a: "Send a quote request with your flight number, date, passenger count, luggage and destination, using the form on this page or WhatsApp. We reply with the vehicle, the details of the pickup and the quote. Nothing is charged by submitting the request." },
    { q: "Do you provide airport transfers from Athens International Airport?", a: "Yes. Athens International Airport “Eleftherios Venizelos” (ATH) is the airport we arrange transfers from most often. For other Greek airports, tell us the airport and dates and we will confirm whether we can serve it." },
    { q: "Can I book an airport transfer for my family?", a: "Yes. Tell us how many adults and children are travelling and their ages, and we recommend a suitable vehicle. Child seats can be requested in the same message." },
    { q: "Can you accommodate luggage?", a: "Luggage is part of choosing the vehicle. List your suitcases and any oversized items when you ask for a quote so the vehicle is not undersized on the day." },
    { q: "Can I provide my flight number?", a: "Please do. The quote form has a flight number field, and it lets us plan the pickup around your actual arrival rather than a guess." },
    { q: "What happens if my flight is delayed?", a: "Include your flight number with your request. How delays and waiting time are handled is confirmed in your quote, so you know before you travel rather than at the airport." },
    { q: "Where will I meet my chauffeur?", a: "The meeting point is agreed in advance and written into your confirmation, together with a contact for the pickup." },
    { q: "How far in advance should I book?", a: "As soon as your flights are fixed, especially for summer travel or groups. For short notice, message us on WhatsApp and we will tell you what is possible." },
  ],
  related: [
    { slug: "port-transfers", note: "Airport to Piraeus and ship, or back again." },
    { slug: "private-chauffeur", note: "Keep the same chauffeur for the whole day." },
    { slug: "intercity-transfers", note: "Continue from the airport to Nafplio, Delphi and beyond." },
  ],
  closing: { title: "Tell Us Where", em: "You're Landing.", text: "Send your flight, your group and your destination. We reply with a tailored quote for your airport transfer." },
};
