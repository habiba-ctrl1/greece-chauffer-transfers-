import type { ServicePage } from "./types";

export const portTransfers: ServicePage = {
  slug: "port-transfers",
  quoteService: "port",
  meta: {
    title: "Private Port & Cruise Transfers Greece | Piraeus Chauffeur",
    description:
      "Private chauffeur transfers between the ship, Piraeus port, hotel, airport and destination, arranged around your sailing schedule. Request a port transfer quote.",
  },
  eyebrow: "Private port & cruise transfers · Greece",
  h1: "Private Port & Cruise Transfers in Greece",
  intro:
    "Travel from ship to hotel, airport or destination with a private chauffeur arranged around your sailing schedule.",
  answer:
    "Greece Chauffeur Service arranges private transfers to and from Piraeus, Greece's main passenger port, for cruise and ferry passengers. You share your ship name and timings, and we plan a private vehicle and chauffeur for the journey to or from your hotel, the airport or a sightseeing stop, subject to availability. Other Greek ports can be discussed on request.",
  cta: "Plan My Port Transfer",
  whatsappText: "Hello, I'd like to plan a private port or cruise transfer in Greece.",
  facts: ["Private vehicle", "Professional chauffeur", "Timed around your sailing", "Piraeus and cruise terminals", "Direct ship-to-destination journey"],
  image: { src: "greece-private-cruise-port-transfer-piraeus", alt: "A chauffeur vehicle on the quay beside a cruise ship in the port of Piraeus" },
  illustration: "port",
  blocks: [
    {
      type: "split",
      tone: "ivory",
      head: { eyebrow: "For cruise passengers", title: "Your Time Ashore", em: "Should Feel Effortless" },
      body: [
        "A cruise day in Athens is short and fixed at both ends: the ship arrives when it arrives and leaves when it leaves. A private transfer is planned backwards from the all-aboard time, so the hours in between are yours.",
        "You tell us the ship, the port and your times. We agree the pickup point with you, choose a vehicle for your party and luggage, and drive directly to where you are going: no waiting for others, no shared stops.",
      ],
      bullets: ["Pickup coordinated around docking and embarkation", "Luggage considered when choosing the vehicle", "Direct journey in a private vehicle", "Stops along the way where agreed in advance"],
    },
    {
      type: "ports",
      tone: "white",
      head: { eyebrow: "Ports", title: "Where We Collect", em: "and Deliver", intro: "We only list a port as served when we can actually serve it." },
      ports: [
        { name: "Piraeus", status: "Served", note: "Greece's main passenger port for cruise ships and island ferries. Pickup points are agreed with you for your terminal.", href: "/destinations/piraeus" },
        { name: "Other Greek ports", status: "On request", note: "If you are sailing from or arriving at another port, tell us the port and date and we will confirm whether we can serve it." },
      ],
    },
    {
      type: "cards",
      tone: "sand",
      variant: "route",
      head: { eyebrow: "Port journeys", title: "Seven Ways to Use", em: "a Port Day" },
      cards: [
        { tag: "Ship → Hotel", t: "Cruise arrival", d: "Straight from the quay to your hotel to start a pre- or post-cruise stay." },
        { tag: "Hotel → Ship", t: "Cruise departure", d: "Collected from the hotel at an agreed time and delivered to your terminal." },
        { tag: "Port → Port", t: "Ferry connection", d: "Between Piraeus and your onward ferry or hotel, with luggage considered." },
        { tag: "Port → Airport", t: "Disembark, then fly", d: "From the ship to Athens International Airport on departure day.", href: "/services/airport-transfers", hrefLabel: "Airport transfers" },
        { tag: "Airport → Port", t: "Fly in, then sail", d: "From arrivals to embarkation, timed to boarding." },
        { tag: "Port → Villa", t: "Private stays", d: "To a villa or apartment, with the address and access details shared in advance." },
        { tag: "Port → Tour", t: "A day beyond the quay", d: "Turn the port call into a private day of sightseeing with a chauffeur.", href: "/services/private-tours", hrefLabel: "Private tours" },
      ],
    },
    {
      type: "steps",
      tone: "ivory",
      head: { eyebrow: "How it works", title: "From Gangway", em: "to Destination" },
      steps: [
        { t: "Share the ship", d: "Ship name, port, arrival and departure times, number of guests and luggage." },
        { t: "Agree the pickup", d: "We confirm the meeting point near your terminal and who your contact is." },
        { t: "Meet your chauffeur", d: "Your chauffeur is there at the agreed time and takes you to the vehicle." },
        { t: "Travel on", d: "Direct to the hotel, airport or first stop, with the return planned if you need it." },
      ],
    },
    {
      type: "destinations",
      tone: "white",
      head: { eyebrow: "Connected places", title: "Port Transfers", em: "and Where They Lead" },
      items: [
        { slug: "piraeus", note: "The port itself: terminals, ferries and cruises." },
        { slug: "athens", note: "Hotels and landmarks a short drive from the port." },
        { slug: "mykonos", note: "Island arrivals by ferry: ask for availability." },
        { slug: "santorini", note: "Port and hotel journeys on request." },
      ],
    },
  ],
  faq: [
    { q: "What information do you need for a cruise port transfer?", a: "The ship name and cruise line, the port, the date, arrival or departure time, the number of guests and luggage, and the destination. The more exact the times, the better we can plan the pickup." },
    { q: "Do you provide transfers from Piraeus cruise port?", a: "Yes. Piraeus is the port we arrange transfers for. We agree the pickup point for your terminal in advance." },
    { q: "Can I go from the ship straight to the airport?", a: "Yes, on departure day a transfer can run from the ship to Athens International Airport. Share your flight time with the request so the pickup is planned around it." },
    { q: "Can I add a sightseeing stop between the ship and the airport?", a: "Stops can be built into the plan when agreed in advance. Tell us what you would like to see and how much time you have, and we say what is realistic." },
    { q: "What if the ship docks early or late?", a: "Ship times can change. Give us the scheduled times with your request; how changes on the day are handled is confirmed in your quote." },
    { q: "Can a group from the same cruise travel together?", a: "Yes. Tell us the group size and we recommend one larger vehicle or coordinate several." },
    { q: "Do you serve ports other than Piraeus?", a: "Possibly, depending on the port and date. Send the details and we will confirm instead of promising something we cannot deliver." },
  ],
  related: [
    { slug: "airport-transfers", note: "Airport to port, or port to airport." },
    { slug: "private-chauffeur", note: "A dedicated chauffeur for your whole stay in Athens." },
    { slug: "private-tours", note: "Use the port day for a private tour." },
  ],
  closing: { title: "Tell Us Which", em: "Ship You're On.", text: "Share the ship, the times and where you are going. We reply with a tailored quote for your port transfer." },
};
