// Editorial content + information architecture for the public site.
// Rule: nothing here may state an unverifiable fact (awards, years, ratings,
// licences, fleet makes/models, prices). Keep copy descriptive and operational.

export type ImageKey = string;
export const img = (k: ImageKey) => `/images/${k}.svg`;

export const NAV = [
  { label: "Services", href: "/services" },
  { label: "Chauffeur", href: "/services/private-chauffeur" },
  { label: "Transfers", href: "/services/airport-transfers" },
  { label: "Tours", href: "/services/private-tours" },
  { label: "Fleet", href: "/#fleet" },
  { label: "Destinations", href: "/destinations" },
  { label: "FAQ", href: "/faq" },
] as const;

export type IconName = "airport" | "port" | "chauffeur" | "intercity" | "tours" | "corporate" | "fleet" | "booking";

export interface Service {
  slug: string;
  title: string;
  short: string;
  cta: string;
  image: ImageKey;
  icon: IconName;
  intro: string;
  includes: string[];
  bestFor: string[];
  related: string[]; // destination slugs
  quoteService: string; // value used by the quote form
}

export const SERVICES: Service[] = [
  {
    slug: "airport-transfers",
    title: "Private Airport Transfers",
    short: "Athens International Airport and major Greek airports.",
    cta: "Airport Transfers",
    image: "airport",
    icon: "airport",
    intro:
      "A pre-arranged private transfer between the airport and your hotel, villa or business address. Share your flight details and we plan the pickup around your arrival.",
    includes: [
      "Pre-arranged pickup at the agreed meeting point",
      "Flight details shared with us in advance",
      "A vehicle matched to your group and luggage",
      "Direct journey to a single destination",
    ],
    bestFor: ["Couples and families", "Executives on tight schedules", "First-time visitors to Greece"],
    related: ["athens", "mykonos", "santorini", "crete"],
    quoteService: "airport",
  },
  {
    slug: "port-transfers",
    title: "Port & Cruise Transfers",
    short: "Piraeus and other major ports, timed around your itinerary.",
    cta: "Port Transfers",
    image: "piraeus",
    icon: "port",
    intro:
      "Private transfers to and from Piraeus and other Greek ports, arranged around ship and ferry timings so you are not left coordinating on the quayside.",
    includes: [
      "Pickup or drop-off at the agreed port area",
      "Timing planned around your sailing or arrival",
      "Vehicle sized for your party and luggage",
      "Optional onward sightseeing — ask us",
    ],
    bestFor: ["Cruise passengers", "Ferry connections to the islands", "Hotel-to-port departures"],
    related: ["piraeus", "athens", "mykonos", "santorini"],
    quoteService: "port",
  },
  {
    slug: "private-chauffeur",
    title: "Private Chauffeur",
    short: "A dedicated driver available for hourly or full-day journeys.",
    cta: "Private Chauffeur",
    image: "chauffeur",
    icon: "chauffeur",
    intro:
      "A driver and vehicle at your disposal for the hours or days you need — meetings, shopping, dinners, sightseeing — with the schedule shaped around you.",
    includes: [
      "A dedicated driver for the agreed period",
      "Flexible stops within your plan",
      "A vehicle chosen for your group",
      "Agreed itinerary shared in advance",
    ],
    bestFor: ["Business travel", "Special occasions", "Visitors who prefer not to drive"],
    related: ["athens", "cape-sounion", "nafplio"],
    quoteService: "chauffeur",
  },
  {
    slug: "intercity-transfers",
    title: "Intercity Transfers",
    short: "Comfortable private travel between Athens and destinations across Greece.",
    cta: "Intercity Transfers",
    image: "nafplio",
    icon: "intercity",
    intro:
      "Private road transfers between Athens and destinations such as Nafplio, Delphi and beyond — a calm alternative to coaches and rental cars.",
    includes: ["Door-to-door private transport", "Vehicle matched to passengers and luggage", "Optional photo or rest stops by arrangement"],
    bestFor: ["Peloponnese and central Greece trips", "Families with luggage", "One-way relocations between hotels"],
    related: ["nafplio", "delphi", "meteora", "athens"],
    quoteService: "intercity",
  },
  {
    slug: "private-tours",
    title: "Private Tours",
    short: "Discover Greece with a chauffeur-driven itinerary designed around your interests.",
    cta: "Private Tours",
    image: "delphi",
    icon: "tours",
    intro:
      "Day journeys to Greece's landmarks with a private vehicle and a schedule that follows your pace, not a group timetable.",
    includes: ["Private vehicle and driver for the day", "Itinerary agreed with you beforehand", "Flexibility on timing and stops"],
    bestFor: ["Cape Sounion, Delphi, Meteora and Nafplio days", "Families and small groups", "Travellers short on time"],
    related: ["cape-sounion", "delphi", "meteora", "nafplio"],
    quoteService: "tour",
  },
  {
    slug: "corporate-transportation",
    title: "Corporate & VIP Transport",
    short: "Discreet transportation for executives, events, delegations and VIP guests.",
    cta: "Corporate Services",
    image: "business",
    icon: "corporate",
    intro:
      "Coordinated, discreet ground transportation for executives, speakers, delegations and event guests, planned in advance with clear communication.",
    includes: ["Executive airport transfers", "Hotel-to-meeting movements", "Event and conference transportation", "Delegation and VIP guest transport"],
    bestFor: ["Corporate travel managers", "Event organisers", "Hotels hosting VIP guests"],
    related: ["athens", "piraeus"],
    quoteService: "corporate",
  },
];

export const serviceBySlug = (s: string) => SERVICES.find((x) => x.slug === s);

export interface Destination {
  slug: string;
  name: string;
  blurb: string;
  image: ImageKey;
  intro: string;
  services: string[]; // service slugs
  kind: "city" | "port" | "day-trip" | "island";
}

export const DESTINATIONS: Destination[] = [
  { slug: "athens", name: "Athens", blurb: "The capital, the Acropolis and your starting point.", image: "athens", kind: "city",
    intro: "Athens is where most journeys in Greece begin. We arrange private transfers from the airport and port to hotels across the city and coast, and chauffeur days around the capital.",
    services: ["airport-transfers", "private-chauffeur", "corporate-transportation"] },
  { slug: "piraeus", name: "Piraeus", blurb: "Seamless cruise-port transportation.", image: "piraeus", kind: "port",
    intro: "Piraeus is Greece's main passenger port. We plan private transfers to and from the port around ship and ferry timings.",
    services: ["port-transfers", "airport-transfers", "corporate-transportation"] },
  { slug: "cape-sounion", name: "Cape Sounion", blurb: "A scenic coastal journey to the Temple of Poseidon.", image: "sounion", kind: "day-trip",
    intro: "A private drive along the Attica coast to the Temple of Poseidon, planned at your pace — many travellers time it for the late afternoon light.",
    services: ["private-tours", "private-chauffeur", "intercity-transfers"] },
  { slug: "delphi", name: "Delphi", blurb: "Private travel to one of Greece's most important ancient sites.", image: "delphi", kind: "day-trip",
    intro: "Delphi sits in the mountains of central Greece. A private vehicle makes the journey from Athens comfortable and flexible, as a day trip or part of a longer route.",
    services: ["private-tours", "intercity-transfers"] },
  { slug: "meteora", name: "Meteora", blurb: "A comfortable journey to the dramatic monasteries.", image: "meteora", kind: "day-trip",
    intro: "Meteora lies in Thessaly, a long way from Athens. Talk to us about the best way to structure the journey for your dates.",
    services: ["private-tours", "intercity-transfers"] },
  { slug: "nafplio", name: "Nafplio", blurb: "A refined escape through the Peloponnese.", image: "nafplio", kind: "day-trip",
    intro: "Nafplio is an elegant seaside town in the Peloponnese, reachable by private transfer or as a day journey from Athens.",
    services: ["intercity-transfers", "private-tours", "private-chauffeur"] },
  { slug: "mykonos", name: "Mykonos", blurb: "Private transportation for island arrivals and stays.", image: "mykonos", kind: "island",
    intro: "For island arrivals, we can arrange transportation for your stay. Tell us your dates and arrival details and we will confirm what we can offer.",
    services: ["airport-transfers", "port-transfers", "private-chauffeur"] },
  { slug: "santorini", name: "Santorini", blurb: "Premium transfers for airport, port and hotel journeys.", image: "santorini", kind: "island",
    intro: "Airport, port and hotel journeys on Santorini. Tell us your dates and arrival details and we will confirm availability.",
    services: ["airport-transfers", "port-transfers", "private-chauffeur"] },
  { slug: "crete", name: "Crete", blurb: "Private transportation across major destinations.", image: "crete", kind: "island",
    intro: "Crete is large, and distances between its main destinations are significant. Share your route and dates and we will confirm what we can arrange.",
    services: ["airport-transfers", "intercity-transfers", "private-chauffeur"] },
];

export const destinationBySlug = (s: string) => DESTINATIONS.find((x) => x.slug === s);

export interface Vehicle {
  id: string;
  name: string;
  passengers: string;
  luggage: string;
  bestFor: string;
  comfort: string;
  image: ImageKey;
  category: string;
}

// Capacities are indicative planning guides, not model specifications.
export const FLEET: Vehicle[] = [
  { id: "executive-sedan", name: "Executive Sedan", passengers: "Up to 3 passengers", luggage: "2–3 suitcases", bestFor: "Airport transfers, couples and executive travel.", comfort: "Refined", image: "v-sedan", category: "sedan" },
  { id: "premium-sedan", name: "Premium Sedan", passengers: "Up to 3 passengers", luggage: "2–3 suitcases", bestFor: "Occasions where presentation matters.", comfort: "Premium", image: "v-premium", category: "luxury" },
  { id: "luxury-suv", name: "Luxury SUV", passengers: "Up to 4 passengers", luggage: "3–4 suitcases", bestFor: "Families, longer routes and extra luggage.", comfort: "Spacious", image: "v-suv", category: "suv" },
  { id: "luxury-van", name: "Luxury Van", passengers: "Up to 7 passengers", luggage: "6–7 suitcases", bestFor: "Groups, private tours and island arrivals.", comfort: "Spacious", image: "v-van", category: "van" },
  { id: "executive-minivan", name: "Executive Minivan", passengers: "Up to 6 passengers", luggage: "5–6 suitcases", bestFor: "Delegations and executive groups.", comfort: "Executive", image: "v-minivan", category: "van" },
  { id: "group", name: "Group Transportation", passengers: "Larger groups on request", luggage: "Arranged per group", bestFor: "Weddings, events and large parties.", comfort: "Arranged per group", image: "v-group", category: "minibus" },
];

export const TRUST = [
  { title: "Private & pre-arranged", text: "Professional chauffeur service" },
  { title: "Airport & port pickups", text: "Smooth arrivals and departures" },
  { title: "Premium vehicles", text: "Comfort for individuals and groups" },
  { title: "Greece-wide coverage", text: "Athens and major destinations" },
  // Only keep a "24/7" claim here if round-the-clock support is operationally true.
  { title: "Responsive support", text: "Assistance when you need it" },
];

export const JOURNEYS = [
  { id: "arrive", label: "Arrive", sub: "Airport & Port Transfers", image: "airport", title: "Land in Greece. Your driver is already there.",
    text: "Private airport and port pickups, planned around your flight or sailing, straight to your hotel or villa.", cta: "Airport & port transfers", href: "/services/airport-transfers" },
  { id: "explore", label: "Explore", sub: "Private Tours & Day Trips", image: "delphi", title: "See the landmarks at your own pace.",
    text: "Cape Sounion, Delphi, Meteora, Nafplio — a private vehicle and an itinerary that follows you.", cta: "Private tours", href: "/services/private-tours" },
  { id: "move", label: "Move", sub: "Chauffeur & Intercity Travel", image: "coast", title: "A driver for the day, or the whole route.",
    text: "Hourly and full-day chauffeur service, plus comfortable private transfers between destinations.", cta: "Chauffeur & intercity", href: "/services/private-chauffeur" },
];

export const WHY = [
  { n: "01", t: "Personal service", d: "Your journey is arranged around your schedule, not the other way around." },
  { n: "02", t: "Professional chauffeurs", d: "Polite, punctual and service-minded drivers focused on a smooth experience." },
  { n: "03", t: "Comfort & privacy", d: "Premium vehicles and a calm environment throughout your journey." },
  { n: "04", t: "Clear communication", d: "Simple booking, clear trip details and responsive support." },
];

export const STEPS: { n: string; t: string; d: string; icon: IconName }[] = [
  { n: "01", t: "Tell us your journey", d: "Share pickup, destination, date and passenger details.", icon: "booking" },
  { n: "02", t: "Receive your quote", d: "We recommend the appropriate vehicle and provide your trip details.", icon: "fleet" },
  { n: "03", t: "Meet your chauffeur", d: "Your driver arrives at the agreed pickup point.", icon: "chauffeur" },
  { n: "04", t: "Enjoy Greece", d: "Relax and travel comfortably.", icon: "tours" },
];

export const TOUR_ROUTES = [
  { to: "Cape Sounion", slug: "cape-sounion" },
  { to: "Delphi", slug: "delphi" },
  { to: "Meteora", slug: "meteora" },
  { to: "Nafplio", slug: "nafplio" },
  { to: "Argolis", slug: "nafplio" },
];

export const CORPORATE_POINTS = [
  "Executive airport transfers",
  "Conference transportation",
  "Hotel-to-meeting transfers",
  "Event transportation",
  "Delegation movements",
  "VIP guest transportation",
];

export const PARTNER_TYPES = ["Hotel & Concierge", "Travel Agencies", "Villa Managers", "Event Planners"];

// FAQ answers describe how the service is arranged in general terms.
// Owner: verify each answer against real operating policy before launch.
export const FAQ = [
  { q: "What is included in a private chauffeur service in Greece?",
    a: "A private vehicle and a professional driver for your agreed journey or time period. Your quote confirms the vehicle, the route or hours, and what is covered, so there are no surprises on the day." },
  { q: "Do you provide airport transfers from Athens Airport?",
    a: "Yes. Private transfers between Athens International Airport and hotels, villas or business addresses can be arranged in advance. Share your flight details when you request a quote." },
  { q: "Can I book a private chauffeur by the hour?",
    a: "Yes. A dedicated driver can be arranged for an hourly or full-day period. Tell us the date, the hours and the places you plan to visit, and we will confirm the details in your quote." },
  { q: "Do you provide transfers from Piraeus cruise port?",
    a: "Yes. Transfers to and from Piraeus can be arranged around your ship's arrival or departure. Include your ship name and timings in your request." },
  { q: "Can I book transportation for a family or group?",
    a: "Yes. Tell us how many adults, children and suitcases are travelling and we will recommend a suitable vehicle, from sedans to vans, or arrange larger group transportation on request." },
  { q: "Do you provide private tours in Greece?",
    a: "Yes. We arrange chauffeur-driven day journeys to destinations such as Cape Sounion, Delphi, Meteora and Nafplio, planned around your interests and pace." },
  { q: "Can I arrange transportation between Greek destinations?",
    a: "Yes, intercity transfers can be arranged between Athens and destinations across Greece. Send us your route and dates and we will confirm what we can offer." },
  { q: "Can you provide child seats?",
    a: "Child seats can be requested when you ask for a quote. Please tell us the children's ages so the correct seat can be prepared." },
  { q: "How far in advance should I book?",
    a: "As early as your plans are fixed — especially in peak season and for groups or tours. For last-minute needs, message us and we will tell you what is possible." },
  { q: "How do I request a quote?",
    a: "Use the quote form on this site, message us on WhatsApp, or call. Tell us where you are going, when, and who is travelling, and we will reply with a tailored quote — we do not show automatic prices." },
];

// Conceptual coverage map (not geographic). Coordinates are in a 600x520 canvas.
export const MAP_NODES = [
  { id: "athens", label: "Athens", x: 320, y: 262, hub: true },
  { id: "attica", label: "Attica", x: 385, y: 232 },
  { id: "central", label: "Central Greece", x: 285, y: 160 },
  { id: "north", label: "Northern Greece", x: 265, y: 62 },
  { id: "pelo", label: "Peloponnese", x: 200, y: 335 },
  { id: "islands", label: "Major Islands", x: 470, y: 345 },
  { id: "crete", label: "Crete", x: 345, y: 455 },
];
