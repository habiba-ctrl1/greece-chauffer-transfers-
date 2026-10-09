// ============================================================
// Booking inquiry — shared definitions + server-side validation
// ============================================================
const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
const isValidEmail = (v: string) => v.length <= 254 && EMAIL_RE.test(v);

export const SERVICE_TYPES = [
	"airport_transfer",
	"hotel_transfer",
	"port_transfer",
	"point_to_point",
	"intercity_transfer",
	"hourly_chauffeur",
	"full_day_chauffeur",
	"private_tour",
	"return_transfer",
	"custom_journey",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceType, string> = {
	airport_transfer: "Airport transfer",
	hotel_transfer: "Hotel transfer",
	port_transfer: "Port transfer",
	point_to_point: "Point-to-point transfer",
	intercity_transfer: "Intercity transfer",
	hourly_chauffeur: "Hourly chauffeur",
	full_day_chauffeur: "Full-day chauffeur",
	private_tour: "Private tour",
	return_transfer: "Return transfer",
	custom_journey: "Custom journey",
};

/** Services where a drop-off is not required (time-based hire / tours). */
export const DESTINATION_OPTIONAL: ServiceType[] = ["hourly_chauffeur", "full_day_chauffeur", "private_tour", "custom_journey"];

/** Which conditional detail fields are relevant for each service. */
export const CONDITIONAL_FIELDS: Record<ServiceType, string[]> = {
	airport_transfer: ["airport", "flight_number", "airline", "arrival_details", "meet_greet", "child_seats", "child_seat_types", "stops", "special"],
	hotel_transfer: ["hotel", "child_seats", "child_seat_types", "stops", "special"],
	port_transfer: ["port", "ferry_details", "meet_greet", "child_seats", "child_seat_types", "special"],
	point_to_point: ["stops", "child_seats", "child_seat_types", "special"],
	intercity_transfer: ["stops", "child_seats", "child_seat_types", "special"],
	hourly_chauffeur: ["duration_hours", "stops", "special"],
	full_day_chauffeur: ["duration_days", "stops", "special"],
	private_tour: ["tour_preferences", "duration_hours", "stops", "special"],
	return_transfer: ["airport", "flight_number", "airline", "child_seats", "child_seat_types", "stops", "special"],
	custom_journey: ["stops", "special"],
};

const DETAIL_LIMITS: Record<string, number> = {
	airport: 120, flight_number: 20, airline: 80, arrival_details: 300, port: 120, ferry_details: 300,
	hotel: 200, child_seat_types: 200, stops: 1000, tour_preferences: 1000, special: 1000,
	duration_hours: 3, duration_days: 3, child_seats: 2, meet_greet: 5,
};

export interface InquiryInput {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	service: ServiceType;
	pickup: string;
	destination: string;
	date: string;
	time: string;
	returnDate: string;
	returnTime: string;
	returnPickup: string;
	returnDestination: string;
	adults: number;
	children: number;
	luggage: string;
	vehicle: string;
	notes: string;
	details: Record<string, string>;
	consent: boolean;
	idempotencyKey: string;
	sourcePage: string;
	utm: Record<string, string>;
}

export type ValidationResult =
	| { ok: true; data: InquiryInput }
	| { ok: false; errors: Record<string, string>; message: string };

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (v: unknown, max: number) => String(v ?? "").replace(CONTROL, "").replace(/\s+/g, " ").trim().slice(0, max);
/** Multi-line free text keeps newlines. */
const cleanText = (v: unknown, max: number) =>
	String(v ?? "").replace(CONTROL, "").replace(/\r\n?/g, "\n").trim().slice(0, max);

/** Today's date in the operating timezone (Europe/Athens), YYYY-MM-DD. */
export function athensToday(now: Date = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const isRealDate = (s: string) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const d = new Date(`${s}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
};
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function normalizePhone(raw: string): string | null {
	const s = raw.replace(/[\s\-().]/g, "");
	if (!/^\+\d{7,15}$/.test(s)) return null;
	return s;
}

/** Validate untrusted input (FormData-like record). Never throws. */
export function validateInquiry(raw: Record<string, unknown>, now: Date = new Date()): ValidationResult {
	const errors: Record<string, string> = {};
	const err = (k: string, m: string) => {
		if (!errors[k]) errors[k] = m;
	};

	const firstName = clean(raw.firstName, 60);
	const lastName = clean(raw.lastName, 60);
	if (!firstName) err("firstName", "Please enter your first name.");
	if (!lastName) err("lastName", "Please enter your last name.");

	const email = clean(raw.email, 254).toLowerCase();
	if (!email) err("email", "Please enter your email address.");
	else if (!isValidEmail(email)) err("email", "That email address doesn't look right.");

	const phone = normalizePhone(clean(raw.phone, 30));
	if (!phone) err("phone", "Please enter a phone number with country code, e.g. +44 7700 900123.");

	const service = clean(raw.service, 30) as ServiceType;
	if (!SERVICE_TYPES.includes(service)) err("service", "Please choose a service.");

	const pickup = clean(raw.pickup, 200);
	if (!pickup) err("pickup", "Please enter the pickup location.");
	const destination = clean(raw.destination, 200);
	if (SERVICE_TYPES.includes(service) && !DESTINATION_OPTIONAL.includes(service) && !destination)
		err("destination", "Please enter the drop-off location.");

	const date = clean(raw.date, 10);
	const today = athensToday(now);
	if (!isRealDate(date)) err("date", "Please choose a valid pickup date.");
	else if (date < today) err("date", "The pickup date can't be in the past.");
	else if (date > `${Number(today.slice(0, 4)) + 2}${today.slice(4)}`) err("date", "Please choose a date within the next two years.");

	const time = clean(raw.time, 5);
	if (!time) err("time", "Please choose a pickup time.");
	else if (!isTime(time)) err("time", "Please choose a valid pickup time.");

	const returnDate = clean(raw.returnDate, 10);
	const returnTime = clean(raw.returnTime, 5);
	if (service === "return_transfer") {
		if (!isRealDate(returnDate)) err("returnDate", "Please choose the return date.");
		else if (isRealDate(date) && returnDate < date) err("returnDate", "The return date can't be before the pickup date.");
		if (!isTime(returnTime)) err("returnTime", "Please choose the return time.");
	} else if (returnDate && !isRealDate(returnDate)) err("returnDate", "Please choose a valid return date.");

	const adults = Number(clean(raw.adults, 3));
	if (!Number.isInteger(adults) || adults < 1 || adults > 60) err("adults", "Passengers must be a whole number between 1 and 60.");
	const children = Number(clean(raw.children ?? "0", 3) || 0);
	if (!Number.isInteger(children) || children < 0 || children > 30) err("children", "Children must be a whole number between 0 and 30.");

	const luggage = clean(raw.luggage, 120);
	const vehicle = clean(raw.vehicle, 60);
	const notes = cleanText(raw.notes, 2000);
	if (String(raw.notes ?? "").length > 5000) err("notes", "Your notes are too long.");

	const consent = raw.consent === true || raw.consent === "true" || raw.consent === "on" || raw.consent === "yes";
	if (!consent) err("consent", "Please accept the privacy notice so we can respond to your request.");

	const details: Record<string, string> = {};
	if (SERVICE_TYPES.includes(service)) {
		for (const f of CONDITIONAL_FIELDS[service]) {
			const v = f === "stops" || f === "tour_preferences" || f === "special"
				? cleanText(raw[f], DETAIL_LIMITS[f])
				: clean(raw[f], DETAIL_LIMITS[f]);
			if (v) details[f] = v;
		}
		for (const [f, min, max] of [["child_seats", 0, 10], ["duration_hours", 1, 24], ["duration_days", 1, 30]] as const) {
			if (details[f] !== undefined) {
				const n = Number(details[f]);
				if (!Number.isInteger(n) || n < min || n > max) err(f, `Enter a whole number between ${min} and ${max}.`);
			}
		}
		if (details.flight_number && !/^[A-Za-z0-9 -]{2,20}$/.test(details.flight_number)) err("flight_number", "Please check the flight number.");
		if (service === "hourly_chauffeur" && !details.duration_hours) err("duration_hours", "How many hours do you need the chauffeur for?");
		if (service === "full_day_chauffeur" && !details.duration_days) details.duration_days = "1";
	}

	const idempotencyKey = clean(raw.idempotencyKey, 64);
	if (idempotencyKey && !/^[A-Za-z0-9_-]{8,64}$/.test(idempotencyKey)) err("idempotencyKey", "Invalid request key.");

	const utm: Record<string, string> = {};
	for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
		const v = clean(raw[k], 100);
		if (v) utm[k] = v;
	}

	if (Object.keys(errors).length) {
		return { ok: false, errors, message: Object.values(errors)[0] };
	}

	return {
		ok: true,
		data: {
			firstName, lastName, email, phone: phone!, service, pickup, destination, date, time,
			returnDate, returnTime, returnPickup: clean(raw.returnPickup, 200), returnDestination: clean(raw.returnDestination, 200),
			adults, children, luggage, vehicle, notes, details, consent,
			idempotencyKey, sourcePage: clean(raw.sourcePage, 300), utm,
		},
	};
}
