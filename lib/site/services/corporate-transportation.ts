import type { ServicePage } from "./types";

export const corporateTransportation: ServicePage = {
  slug: "corporate-transportation",
  quoteService: "corporate",
  theme: "corporate",
  meta: {
    title: "Corporate & Executive Chauffeur Transportation in Greece",
    description:
      "Executive airport transfers, meeting transport, conferences and event transportation across Athens and Greece, planned in advance. Request corporate transportation.",
  },
  eyebrow: "Corporate transportation · Greece",
  h1: "Corporate & Executive Chauffeur Transportation in Greece",
  intro:
    "When timing, discretion and presentation matter, private chauffeur transportation moves executives, speakers, guests and delegations across Greece on a plan agreed in advance.",
  answer:
    "Greece Chauffeur Service provides corporate and executive chauffeur transportation in Athens and across Greece: executive airport transfers, transport between hotels and meetings, conference and event movements and delegation transfers, subject to availability. Programmes are planned with the organiser before travel, with one point of contact, and quoted individually.",
  cta: "Request Corporate Transportation",
  whatsappText: "Hello, I'd like to discuss corporate transportation in Greece.",
  facts: ["Planned in advance", "One point of contact", "Professional chauffeurs", "Single vehicles or coordinated groups", "Quoted per programme"],
  image: { src: "greece-corporate-executive-chauffeur-athens", alt: "An executive passenger stepping into a premium vehicle outside an Athens hotel at dusk" },
  illustration: "corporate",
  blocks: [
    {
      type: "cards",
      tone: "ivory",
      variant: "ruled",
      head: { eyebrow: "Business services", title: "Where Executive", em: "Transport Fits" },
      cards: [
        { t: "Executive airport transfers", d: "Arrivals and departures planned around flights and first or last meetings.", href: "/services/airport-transfers", hrefLabel: "Airport transfers" },
        { t: "Business meetings", d: "A chauffeur for a day of appointments, with waiting built into the plan.", href: "/services/private-chauffeur", hrefLabel: "Private chauffeur" },
        { t: "Conference transportation", d: "Moving speakers and attendees between hotels and the venue." },
        { t: "Event transportation", d: "Guest movements on an event day, arranged with the organiser." },
        { t: "Delegation transportation", d: "Groups moving together, with timing agreed in advance." },
        { t: "Executive hotel transfers", d: "Between hotels, offices and meeting venues." },
        { t: "Multi-vehicle coordination", d: "Several vehicles on one schedule, coordinated through a single contact." },
      ],
    },
    {
      type: "steps",
      tone: "white",
      head: { eyebrow: "Workflow", title: "From Request", em: "to Return" },
      steps: [
        { t: "Request", d: "Send the programme: dates, locations, number of travellers, any VIP requirements." },
        { t: "Plan", d: "We propose vehicles, timings and pickup points, and flag anything that does not fit." },
        { t: "Coordinate", d: "Pickups, flight details and contacts are confirmed with you before travel." },
        { t: "Travel", d: "Chauffeurs meet your guests at the agreed points, on the agreed schedule." },
        { t: "Support", d: "You have a contact for the trip. How changes are handled on the day is agreed in the plan." },
      ],
    },
    {
      type: "compare",
      tone: "sand",
      head: { eyebrow: "Scale", title: "A Single Transfer,", em: "or a Programme" },
      columns: [
        { label: "One traveller", title: "A single executive transfer", lines: ["Airport to hotel, or hotel to meeting", "One vehicle, one chauffeur", "Quoted per journey"] },
        { label: "A team or event", title: "A coordinated programme", lines: ["Several vehicles on one timetable", "One organiser contact for all movements", "Quoted for the programme as a whole"], highlight: true },
      ],
    },
    {
      type: "vehicles",
      tone: "ivory",
      head: { eyebrow: "Vehicles", title: "Vehicles for", em: "Executives and Groups" },
      ids: ["executive-sedan", "premium-sedan", "luxury-suv", "executive-minivan", "group"],
      note: "Vehicle categories shown are indicative; we confirm the exact vehicles for your programme.",
    },
    {
      type: "partners",
      tone: "navy",
      head: { eyebrow: "Partners", title: "Working with Organisers,", em: "Not Just Travellers", intro: "Hotels, agencies and planners can rely on one coordinated ground partner for their guests." },
      who: ["Hotels & concierge teams", "Travel agencies", "Event planners", "DMCs", "Corporate travel managers"],
      cta: { label: "Become a Partner", href: "/contact?topic=partner#quote" },
    },
    {
      type: "destinations",
      tone: "white",
      head: { eyebrow: "Where we operate", title: "Business Travel", em: "Starts in Athens" },
      items: [
        { slug: "athens", note: "Meetings, conferences and hotels." },
        { slug: "piraeus", note: "Port arrivals for visiting delegations." },
      ],
    },
  ],
  faq: [
    { q: "What does corporate chauffeur transportation include?", a: "Executive airport transfers, transport between hotels and meetings, conference and event movements and delegation transfers. The scope is agreed with you for each programme." },
    { q: "Can you coordinate several vehicles for an event?", a: "Yes. Send the schedule, the number of guests and the locations, and we propose how many vehicles are needed and how they run together." },
    { q: "Can we book transport for our guests under one request?", a: "Yes. Give us the guest list details we need, such as arrival times and hotels, and we plan their movements together." },
    { q: "Do you offer invoicing for companies?", a: "Billing and invoicing arrangements can be discussed when you request a quote, so they are clear before travel." },
    { q: "How far in advance should we book for a conference?", a: "As early as dates are known. Multi-vehicle programmes need more planning, so earlier is better." },
    { q: "Can you arrange transport for a delegation arriving on different flights?", a: "Yes. Share the flight details and we plan pickups to suit the arrivals, either individually or grouped." },
    { q: "Can hotels and agencies partner with you?", a: "Yes. Contact us with your needs and we discuss how a partnership could work." },
  ],
  related: [
    { slug: "airport-transfers", note: "Executive arrivals and departures." },
    { slug: "private-chauffeur", note: "A chauffeur for a day of meetings." },
    { slug: "intercity-transfers", note: "Journeys between cities for teams." },
  ],
  closing: { title: "Tell Us About", em: "Your Programme.", text: "Send the dates, the locations and the number of travellers. We reply with a tailored quote for your corporate transportation." },
};
