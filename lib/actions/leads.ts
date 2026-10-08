// ============================================================
// Public quote requests (website → operations)
// ============================================================
// Creates/reuses a customer and a DRAFT quote so the enquiry shows up in the
// admin quotes pipeline. No pricing is generated — operations quotes manually.
"use server";

import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { recordActivity } from "@/lib/actions/activity";

export interface QuoteRequestResult {
	ok: boolean;
	reference?: string;
	error?: string;
}

const TRIP_BY_SERVICE: Record<string, string> = {
	airport: "airport_transfer",
	port: "one_way",
	chauffeur: "hourly",
	intercity: "intercity",
	tour: "round_trip",
	corporate: "one_way",
};

const SERVICE_LABEL: Record<string, string> = {
	airport: "Airport transfer",
	port: "Port transfer",
	chauffeur: "Private chauffeur",
	intercity: "Intercity transfer",
	tour: "Private tour",
	corporate: "Corporate / VIP",
};

const str = (f: FormData, k: string, max = 300) =>
	String(f.get(k) ?? "").trim().slice(0, max);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitQuoteRequest(formData: FormData): Promise<QuoteRequestResult> {
	// Honeypot: real visitors never fill this field.
	if (str(formData, "company_website")) return { ok: true, reference: "GCS-Q" };

	const name = str(formData, "name", 120);
	const email = str(formData, "email", 200).toLowerCase();
	const phone = str(formData, "phone", 40);
	const whatsapp = str(formData, "whatsapp", 40);
	const pickup = str(formData, "pickup");
	const destination = str(formData, "destination");
	const date = str(formData, "date", 10);
	const time = str(formData, "time", 5);
	const service = str(formData, "service", 20);
	const adults = Math.min(60, Math.max(1, parseInt(str(formData, "adults", 3), 10) || 1));
	const children = Math.min(60, Math.max(0, parseInt(str(formData, "children", 3), 10) || 0));
	const luggage = str(formData, "luggage", 60);

	if (!name || !EMAIL_RE.test(email)) return { ok: false, error: "Please add your name and a valid email address." };
	if (!pickup || !destination || !/^\d{4}-\d{2}-\d{2}$/.test(date))
		return { ok: false, error: "Please add a pickup, a destination and a date." };

	const flight = str(formData, "flight", 40);
	const hotel = str(formData, "hotel");
	const stops = str(formData, "stops", 500);
	const requirements = str(formData, "requirements", 1000);
	const childSeat = str(formData, "childSeat", 10) === "yes";
	const vehicle = str(formData, "vehicle", 40);

	try {
		const db = await getDb();
		const now = new Date().toISOString();

		const existing = await db
			.prepare("SELECT id FROM customers WHERE lower(email) = ? LIMIT 1")
			.bind(email)
			.first<{ id: string }>();
		const customerId = existing?.id ?? generateId();
		if (!existing) {
			await db
				.prepare(
					"INSERT INTO customers (id, name, email, phone, customer_type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, 'individual', ?, ?, ?)"
				)
				.bind(customerId, name, email, phone || whatsapp || null, "Created from website quote form", now, now)
				.run();
		}

		const year = new Date().getFullYear();
		const prefix = `GCS-Q-${year}-`;
		const last = await db
			.prepare("SELECT quote_number FROM quotes WHERE quote_number LIKE ? ORDER BY quote_number DESC LIMIT 1")
			.bind(`${prefix}%`)
			.first<{ quote_number: string }>();
		const lastSeq = last ? parseInt(last.quote_number.split("-").pop() || "0", 10) : 0;
		const reference = `${prefix}${String((Number.isNaN(lastSeq) ? 0 : lastSeq) + 1).padStart(4, "0")}`;

		const request = [
			SERVICE_LABEL[service] ? `Service: ${SERVICE_LABEL[service]}` : "",
			vehicle ? `Vehicle preference: ${vehicle}` : "",
			`Passengers: ${adults} adult(s), ${children} child(ren)`,
			childSeat ? "Child seat requested" : "",
			hotel ? `Hotel / address: ${hotel}` : "",
			whatsapp ? `WhatsApp: ${whatsapp}` : "",
			requirements ? `Requirements: ${requirements}` : "",
		]
			.filter(Boolean)
			.join("\n");

		await db
			.prepare(
				`INSERT INTO quotes (id, quote_number, customer_id, status, pickup_location, dropoff_location, pickup_date, pickup_time,
				  trip_type, passenger_count, luggage_info, flight_number, additional_stops, special_requests, notes, internal_notes, created_at, updated_at)
				 VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				generateId(), reference, customerId, pickup, destination, date, time || null,
				TRIP_BY_SERVICE[service] ?? "one_way", adults + children, luggage || null, flight || null,
				stops || null, request, null, "Website enquiry — needs a manual quote", now, now
			)
			.run();

		await recordActivity("quote_requested", "quote", reference, {
			message: `Website quote request ${reference} from ${name}`,
		});

		return { ok: true, reference };
	} catch (e) {
		console.error("submitQuoteRequest failed:", e);
		return {
			ok: false,
			error: "We couldn't send your request just now. Please try again, or message us on WhatsApp.",
		};
	}
}
