import type { ServicePage } from "./types";

export const hourlyChauffeur: ServicePage = {
  slug: "hourly-chauffeur",
  quoteService: "chauffeur",
  meta: {
    title: "Hourly Chauffeur Hire in Athens & Greece | Private Driver by the Hour",
    description:
      "Book a private chauffeur by the hour or for a full day in Athens and beyond. Plan your stops, waiting time and return, then request a tailored quote.",
  },
  eyebrow: "Hourly chauffeur hire · Athens & Greece",
  h1: "Hourly Chauffeur Hire in Athens and Greece",
  intro:
    "A private vehicle and chauffeur reserved for the hours you need, so meetings, shopping, sightseeing and dinners connect without taxis, parking or waiting for a pickup.",
  answer:
    "Hourly chauffeur hire means a professional driver and a private vehicle reserved for you for an agreed number of hours, rather than a single transfer between two addresses. Greece Chauffeur Service arranges hourly and full-day chauffeur bookings mainly in and around Athens, subject to availability. You share the date, start time, stops and duration, and the quote is confirmed before you travel.",
  cta: "Plan My Chauffeur Day",
  whatsappText: "Hello, I'd like to arrange a private chauffeur by the hour in Athens.",
  facts: ["Booked by the hour or day", "Multiple stops", "Waiting built into the plan", "Quote confirmed in advance"],
  image: { src: "greece-private-chauffeur-service-athens", alt: "A chauffeur opening the rear door of a black vehicle for a passenger at dusk in Athens" },
  illustration: "chauffeur",
  blocks: [
    {
      type: "steps",
      tone: "ivory",
      head: { eyebrow: "A day, sketched out", title: "From the First Pickup", em: "to the Last Drop-off" },
      steps: [
        { t: "09:00 Hotel", d: "Your chauffeur collects you at the agreed address and time." },
        { t: "10:00 Meeting", d: "Drop-off at the venue. The vehicle waits or returns at a time you set." },
        { t: "12:30 Lunch", d: "A restaurant booked by you, with the next leg already planned." },
        { t: "14:00 Shopping", d: "Bags stay in the vehicle while you move between stops." },
        { t: "17:00 Airport", d: "Back to the hotel or straight to the departures terminal." },
      ],
    },
    {
      type: "compare",
      tone: "white",
      head: { eyebrow: "Choosing the format", title: "Transfer, Hourly Hire", em: "or Full Day?" },
      columns: [
        { label: "Single transfer", title: "One journey", lines: ["Two addresses, one trip", "Best for airport, port or hotel moves", "Quoted for the route"] },
        { label: "Hourly chauffeur", title: "A block of hours", lines: ["Several stops inside a set window", "Best for city days and meetings", "Quoted for the hours and plan"], highlight: true },
        { label: "Full-day chauffeur", title: "A whole day", lines: ["Longer plans, with or without leaving Athens", "Best for sightseeing and events", "Quoted for the day and route"] },
      ],
    },
    {
      type: "cards",
      tone: "ivory",
      variant: "plain",
      head: { eyebrow: "Plan your booking", title: "What to Tell Us", em: "for an Accurate Quote" },
      cards: [
        { t: "Date and start time", d: "Where the day begins and when you want the chauffeur there." },
        { t: "Number of hours", d: "A realistic estimate. Tell us if the finish time is flexible." },
        { t: "Your stops", d: "The places you plan to visit, in order if you know it." },
        { t: "Waiting periods", d: "Meetings or visits where the vehicle should wait, and for how long." },
        { t: "Passengers and luggage", d: "So we can suggest a suitable vehicle for the whole day." },
        { t: "Where it ends", d: "Hotel, airport, port or another address." },
      ],
    },
    {
      type: "cards",
      tone: "sand",
      variant: "route",
      head: { eyebrow: "Typical bookings", title: "What People Book", em: "by the Hour For" },
      cards: [
        { tag: "Business", t: "Several appointments", d: "A fixed window across Athens with waiting planned between meetings.", href: "/services/corporate-transportation", hrefLabel: "Corporate transportation" },
        { tag: "Sightseeing", t: "Athens at your own pace", d: "The Acropolis, the coast and lunch, without a group timetable.", href: "/destinations/athens", hrefLabel: "Athens" },
        { tag: "Shopping", t: "Stop-to-stop days", d: "Bags stay in the vehicle between stops." },
        { tag: "Arrival day", t: "Airport plus meetings", d: "Land, drop your bags and head straight to the first appointment.", href: "/services/airport-transfers", hrefLabel: "Airport transfers" },
        { tag: "Evenings", t: "Dinner and return", d: "Door-to-door for an evening, with the return arranged." },
        { tag: "Longer plans", t: "Beyond Athens", d: "Cape Sounion or Nafplio as a chauffeur-driven day.", href: "/services/private-tours", hrefLabel: "Private tours" },
      ],
    },
    {
      type: "vehicles",
      tone: "ivory",
      head: { eyebrow: "Vehicles", title: "Choose the Vehicle", em: "for Your Day" },
      ids: ["executive-sedan", "luxury-suv", "luxury-van"],
    },
    {
      type: "destinations",
      tone: "white",
      head: { eyebrow: "Where it starts", title: "Beginning in Athens,", em: "Reaching Further" },
      items: [
        { slug: "athens", note: "City days, meetings and evenings out." },
        { slug: "cape-sounion", note: "A coastal half day to the Temple of Poseidon." },
        { slug: "nafplio", note: "A longer day into the Peloponnese." },
      ],
    },
  ],
  faq: [
    { q: "How does hourly chauffeur hire work?", a: "You tell us the date, start time, the places you want to visit and roughly how long you need. We propose a vehicle and a schedule, and confirm the quote before you travel." },
    { q: "Is there a minimum number of hours?", a: "Minimum durations are confirmed in your quote, as they depend on the date and the plan. Tell us what you have in mind and we will say what is possible." },
    { q: "Does the chauffeur wait while I am in a meeting?", a: "Waiting is part of the agreed plan. List your meetings or visits with rough times so the quote reflects the real day." },
    { q: "What if my plans run late?", a: "Tell us in advance how flexible your finish time is. Extensions on the day depend on the chauffeur's following commitments and are confirmed with us." },
    { q: "What is the difference between hourly and full-day hire?", a: "Hourly hire suits a defined window with several stops. A full day suits longer plans, including travel outside Athens. Both are quoted individually." },
    { q: "Can I use an hourly chauffeur for a day trip?", a: "Yes, for journeys such as Cape Sounion or Nafplio. Our private tours page explains how these days are planned." },
    { q: "Does the quote include a guide or entry tickets?", a: "No. The service is a chauffeur and private vehicle. Guides and tickets are arranged separately; ask us if you would like help with this." },
  ],
  related: [
    { slug: "private-chauffeur", note: "The wider chauffeur service, and how it differs from a transfer." },
    { slug: "corporate-transportation", note: "Executive itineraries and multi-vehicle programmes." },
    { slug: "private-tours", note: "A chauffeur-driven day to landmarks beyond Athens." },
  ],
  closing: { title: "Tell Us", em: "How Your Day Runs.", text: "Send the date, your stops and the hours you need. We reply with a tailored quote for your chauffeur." },
};
