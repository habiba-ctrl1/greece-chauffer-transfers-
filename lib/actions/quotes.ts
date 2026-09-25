// ============================================================
// Quote Actions & Inquiry Operations
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId, operationalDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/actions/activity";
import type {
	Quote,
	QuoteItem,
	QuoteStatus,
	QuoteWithDetails,
	TripType,
} from "@/lib/schema";
import { revalidatePath } from "next/cache";

export interface GetQuotesFilter {
	status?: string;
	search?: string;
	customer_id?: string;
	page?: number;
	limit?: number;
}

export interface GetQuotesResult {
	quotes: QuoteWithDetails[];
	total: number;
	page: number;
	totalPages: number;
}

export interface CreateQuoteItemInput {
	description: string;
	quantity: number;
	unit_price: number;
}

export interface CreateQuoteInput {
	customer_id: string;
	status?: QuoteStatus;
	pickup_location?: string;
	dropoff_location?: string;
	pickup_date?: string;
	pickup_time?: string;
	return_date?: string;
	return_time?: string;
	trip_type?: TripType;
	vehicle_category?: string;
	vehicle_id?: string;
	passenger_count?: number;
	luggage_info?: string;
	flight_number?: string;
	airline?: string;
	additional_stops?: string;
	special_requests?: string;
	subtotal: number;
	discount_amount?: number;
	discount_type?: "fixed" | "percentage";
	tax_amount?: number;
	total: number;
	notes?: string;
	internal_notes?: string;
	valid_until?: string;
	items: CreateQuoteItemInput[];
}

export interface UpdateQuoteInput extends Partial<CreateQuoteInput> {
	id: string;
}

/**
 * Generate sequential quote number: GCS-Q-YYYY-XXXX
 */
async function generateQuoteNumber(db: D1Database): Promise<string> {
	const year = new Date().getFullYear();
	const prefix = `GCS-Q-${year}-`;

	const last = await db
		.prepare(
			"SELECT quote_number FROM quotes WHERE quote_number LIKE ? ORDER BY quote_number DESC LIMIT 1"
		)
		.bind(`${prefix}%`)
		.first<{ quote_number: string }>();

	let seq = 1;
	if (last?.quote_number) {
		const parts = last.quote_number.split("-");
		const lastNum = parseInt(parts[parts.length - 1], 10);
		if (!isNaN(lastNum)) seq = lastNum + 1;
	}

	return `${prefix}${seq.toString().padStart(4, "0")}`;
}

/**
 * Generate sequential booking number: GCS-B-YYYY-XXXX (for conversion)
 */
async function generateBookingNumber(db: D1Database): Promise<string> {
	const year = new Date().getFullYear();
	const prefix = `GCS-B-${year}-`;

	const last = await db
		.prepare(
			"SELECT booking_number FROM bookings WHERE booking_number LIKE ? ORDER BY booking_number DESC LIMIT 1"
		)
		.bind(`${prefix}%`)
		.first<{ booking_number: string }>();

	let seq = 1;
	if (last?.booking_number) {
		const parts = last.booking_number.split("-");
		const lastNum = parseInt(parts[parts.length - 1], 10);
		if (!isNaN(lastNum)) seq = lastNum + 1;
	}

	return `${prefix}${seq.toString().padStart(4, "0")}`;
}

/**
 * Fetch quotes with optional filtering, search, and pagination.
 */
export async function getQuotes(
	filter: GetQuotesFilter = {}
): Promise<GetQuotesResult> {
	const db = await getDb();
	const page = Math.max(1, filter.page || 1);
	const limit = Math.min(100, Math.max(1, filter.limit || 20));
	const offset = (page - 1) * limit;

	const conditions: string[] = [];
	const bindings: unknown[] = [];

	if (filter.status && filter.status !== "all") {
		if (filter.status === "active") {
			conditions.push("q.status IN ('draft', 'sent', 'viewed')");
		} else if (filter.status === "closed") {
			conditions.push("q.status IN ('accepted', 'rejected', 'expired', 'cancelled')");
		} else {
			conditions.push("q.status = ?");
			bindings.push(filter.status);
		}
	}

	if (filter.customer_id) {
		conditions.push("q.customer_id = ?");
		bindings.push(filter.customer_id);
	}

	if (filter.search?.trim()) {
		const query = `%${filter.search.trim()}%`;
		conditions.push(
			"(q.quote_number LIKE ? OR c.name LIKE ? OR c.email LIKE ? OR q.pickup_location LIKE ? OR q.dropoff_location LIKE ?)"
		);
		bindings.push(query, query, query, query, query);
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	// Count total
	const countResult = await db
		.prepare(
			`SELECT COUNT(*) as count 
			 FROM quotes q
			 LEFT JOIN customers c ON c.id = q.customer_id
			 ${whereClause}`
		)
		.bind(...bindings)
		.first<{ count: number }>();

	const total = countResult?.count || 0;

	// Query quotes with customer details and converted booking if any
	const query = `
		SELECT 
			q.*,
			c.name as customer_name,
			c.email as customer_email,
			c.phone as customer_phone,
			c.company_name as customer_company,
			b.id as converted_booking_id,
			b.booking_number as converted_booking_number
		FROM quotes q
		LEFT JOIN customers c ON c.id = q.customer_id
		LEFT JOIN bookings b ON b.quote_id = q.id
		${whereClause}
		ORDER BY q.created_at DESC
		LIMIT ? OFFSET ?
	`;

	const rows = await db
		.prepare(query)
		.bind(...bindings, limit, offset)
		.all<QuoteWithDetails>();

	return {
		quotes: rows.results || [],
		total,
		page,
		totalPages: Math.ceil(total / limit) || 1,
	};
}

/**
 * Get a single quote by ID with full customer, items, and linked booking.
 */
export async function getQuoteById(id: string): Promise<QuoteWithDetails | null> {
	const db = await getDb();

	const quote = await db
		.prepare(
			`SELECT 
				q.*,
				c.name as customer_name,
				c.email as customer_email,
				c.phone as customer_phone,
				c.company_name as customer_company,
				b.id as converted_booking_id,
				b.booking_number as converted_booking_number
			FROM quotes q
			LEFT JOIN customers c ON c.id = q.customer_id
			LEFT JOIN bookings b ON b.quote_id = q.id
			WHERE q.id = ?`
		)
		.bind(id)
		.first<QuoteWithDetails>();

	if (!quote) return null;

	// Fetch line items
	const items = await db
		.prepare("SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC")
		.bind(id)
		.all<QuoteItem>();

	return {
		...quote,
		items: items.results || [],
	};
}

/**
 * Create a new quote with line items and audit log.
 */
export async function createQuote(
	data: CreateQuoteInput
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
	try {
		const db = await getDb();
		const currentUser = await getCurrentUser();
		const quoteId = generateId();
		const quoteNumber = await generateQuoteNumber(db);

		const validUntil =
			data.valid_until ||
			new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

		// 1. Insert Quote
		await db
			.prepare(
				`INSERT INTO quotes (
					id, quote_number, customer_id, status,
					pickup_location, dropoff_location, pickup_date, pickup_time,
					return_date, return_time, trip_type, vehicle_category, vehicle_id,
					passenger_count, luggage_info, flight_number, airline,
					additional_stops, special_requests, subtotal, discount_amount,
					discount_type, tax_amount, total, notes, internal_notes,
					valid_until, created_by, created_at, updated_at
				) VALUES (
					?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, datetime('now'), datetime('now')
				)`
			)
			.bind(
				quoteId,
				quoteNumber,
				data.customer_id,
				data.status || "draft",
				data.pickup_location || null,
				data.dropoff_location || null,
				data.pickup_date || null,
				data.pickup_time || null,
				data.return_date || null,
				data.return_time || null,
				data.trip_type || "one_way",
				data.vehicle_category || null,
				data.vehicle_id || null,
				data.passenger_count || 1,
				data.luggage_info || null,
				data.flight_number || null,
				data.airline || null,
				data.additional_stops || null,
				data.special_requests || null,
				data.subtotal || 0,
				data.discount_amount || 0,
				data.discount_type || null,
				data.tax_amount || 0,
				data.total || 0,
				data.notes || null,
				data.internal_notes || null,
				validUntil,
				currentUser?.id || null
			)
			.run();

		// 2. Insert line items
		if (data.items && data.items.length > 0) {
			for (let i = 0; i < data.items.length; i++) {
				const item = data.items[i];
				const itemId = generateId();
				const itemTotal = Number((item.quantity * item.unit_price).toFixed(2));

				await db
					.prepare(
						`INSERT INTO quote_items (
							id, quote_id, description, quantity, unit_price, total, sort_order
						) VALUES (?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						itemId,
						quoteId,
						item.description,
						item.quantity || 1,
						item.unit_price || 0,
						itemTotal,
						i
					)
					.run();
			}
		}

		// 3. Record Activity
		await recordActivity(
			"quote.created",
			"quote",
			quoteId,
			{ message: `Created quote ${quoteNumber} totaling €${data.total}` }
		);

		const created = await getQuoteById(quoteId);

		revalidatePath("/admin/quotes");
		revalidatePath(`/admin/customers/${data.customer_id}`);
		revalidatePath("/admin/dashboard");

		return { success: true, quote: created || undefined };
	} catch (e) {
		console.error("Error creating quote:", e);
		return { success: false, error: (e as Error).message || "Failed to create quote" };
	}
}

/**
 * Update an existing quote, replacing line items if provided.
 */
export async function updateQuote(
	id: string,
	data: Partial<CreateQuoteInput>
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
	try {
		const db = await getDb();
		const current = await getQuoteById(id);
		if (!current) {
			return { success: false, error: "Quote not found" };
		}

		// Update fields
		await db
			.prepare(
				`UPDATE quotes SET
					pickup_location = ?,
					dropoff_location = ?,
					pickup_date = ?,
					pickup_time = ?,
					return_date = ?,
					return_time = ?,
					trip_type = ?,
					vehicle_category = ?,
					passenger_count = ?,
					luggage_info = ?,
					flight_number = ?,
					airline = ?,
					additional_stops = ?,
					special_requests = ?,
					subtotal = ?,
					discount_amount = ?,
					discount_type = ?,
					tax_amount = ?,
					total = ?,
					notes = ?,
					internal_notes = ?,
					valid_until = ?,
					updated_at = datetime('now')
				WHERE id = ?`
			)
			.bind(
				data.pickup_location !== undefined ? data.pickup_location : current.pickup_location,
				data.dropoff_location !== undefined ? data.dropoff_location : current.dropoff_location,
				data.pickup_date !== undefined ? data.pickup_date : current.pickup_date,
				data.pickup_time !== undefined ? data.pickup_time : current.pickup_time,
				data.return_date !== undefined ? data.return_date : current.return_date,
				data.return_time !== undefined ? data.return_time : current.return_time,
				data.trip_type !== undefined ? data.trip_type : current.trip_type,
				data.vehicle_category !== undefined ? data.vehicle_category : current.vehicle_category,
				data.passenger_count !== undefined ? data.passenger_count : current.passenger_count,
				data.luggage_info !== undefined ? data.luggage_info : current.luggage_info,
				data.flight_number !== undefined ? data.flight_number : current.flight_number,
				data.airline !== undefined ? data.airline : current.airline,
				data.additional_stops !== undefined ? data.additional_stops : current.additional_stops,
				data.special_requests !== undefined ? data.special_requests : current.special_requests,
				data.subtotal !== undefined ? data.subtotal : current.subtotal,
				data.discount_amount !== undefined ? data.discount_amount : current.discount_amount,
				data.discount_type !== undefined ? data.discount_type : current.discount_type,
				data.tax_amount !== undefined ? data.tax_amount : current.tax_amount,
				data.total !== undefined ? data.total : current.total,
				data.notes !== undefined ? data.notes : current.notes,
				data.internal_notes !== undefined ? data.internal_notes : current.internal_notes,
				data.valid_until !== undefined ? data.valid_until : current.valid_until,
				id
			)
			.run();

		// Replace items if provided
		if (data.items) {
			await db.prepare("DELETE FROM quote_items WHERE quote_id = ?").bind(id).run();

			for (let i = 0; i < data.items.length; i++) {
				const item = data.items[i];
				const itemId = generateId();
				const itemTotal = Number((item.quantity * item.unit_price).toFixed(2));

				await db
					.prepare(
						`INSERT INTO quote_items (
							id, quote_id, description, quantity, unit_price, total, sort_order
						) VALUES (?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						itemId,
						id,
						item.description,
						item.quantity || 1,
						item.unit_price || 0,
						itemTotal,
						i
					)
					.run();
			}
		}

		await recordActivity(
			"quote.updated",
			"quote",
			id,
			{ message: `Updated quote details for ${current.quote_number}` }
		);

		const updated = await getQuoteById(id);

		revalidatePath("/admin/quotes");
		revalidatePath(`/admin/quotes/${id}`);
		revalidatePath(`/admin/customers/${current.customer_id}`);

		return { success: true, quote: updated || undefined };
	} catch (e) {
		console.error("Error updating quote:", e);
		return { success: false, error: (e as Error).message || "Failed to update quote" };
	}
}

/**
 * Update quote status (sent, accepted, rejected, expired, cancelled).
 */
export async function updateQuoteStatus(
	id: string,
	newStatus: QuoteStatus,
	notes?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const db = await getDb();
		const quote = await getQuoteById(id);
		if (!quote) return { success: false, error: "Quote not found" };

		await db
			.prepare("UPDATE quotes SET status = ?, updated_at = datetime('now') WHERE id = ?")
			.bind(newStatus, id)
			.run();

		await recordActivity(
			"quote.status_changed",
			"quote",
			id,
			{ message: `Status changed from ${quote.status} to ${newStatus}`, notes: notes || null }
		);

		revalidatePath("/admin/quotes");
		revalidatePath(`/admin/quotes/${id}`);
		revalidatePath(`/admin/customers/${quote.customer_id}`);
		revalidatePath("/admin/dashboard");

		return { success: true };
	} catch (e) {
		console.error("Error updating quote status:", e);
		return { success: false, error: (e as Error).message || "Failed to update status" };
	}
}

/**
 * Convert an approved/accepted quote into a confirmed booking.
 * Transforms quote into booking, sets quote status to accepted, records activity,
 * and returns the new booking ID.
 */
export async function convertQuoteToBooking(
	quoteId: string
): Promise<{ success: boolean; bookingId?: string; bookingNumber?: string; error?: string }> {
	try {
		const db = await getDb();
		const quote = await getQuoteById(quoteId);

		if (!quote) {
			return { success: false, error: "Quote not found" };
		}

		// Check if quote has already been converted
		const existingBooking = await db
			.prepare("SELECT id, booking_number FROM bookings WHERE quote_id = ?")
			.bind(quoteId)
			.first<{ id: string; booking_number: string }>();

		if (existingBooking) {
			return {
				success: true,
				bookingId: existingBooking.id,
				bookingNumber: existingBooking.booking_number,
			};
		}

		const currentUser = await getCurrentUser();
		const bookingId = generateId();
		const bookingNumber = await generateBookingNumber(db);

		// 1. Create Booking
		await db
			.prepare(
				`INSERT INTO bookings (
					id, booking_number, quote_id, customer_id, status, payment_status,
					pickup_location, dropoff_location, pickup_date, pickup_time,
					return_date, return_time, trip_type, vehicle_category, vehicle_id,
					passenger_count, luggage_info, flight_number, airline,
					additional_stops, special_requests, price, discount_amount,
					tax_amount, total, customer_notes, internal_notes,
					booking_source, created_by, created_at, updated_at
				) VALUES (
					?, ?, ?, ?, 'confirmed', 'pending',
					?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?,
					'admin', ?, datetime('now'), datetime('now')
				)`
			)
			.bind(
				bookingId,
				bookingNumber,
				quoteId,
				quote.customer_id,
				quote.pickup_location,
				quote.dropoff_location,
				quote.pickup_date,
				quote.pickup_time,
				quote.return_date,
				quote.return_time,
				quote.trip_type || "one_way",
				quote.vehicle_category,
				quote.vehicle_id,
				quote.passenger_count || 1,
				quote.luggage_info,
				quote.flight_number,
				quote.airline,
				quote.additional_stops,
				quote.special_requests,
				quote.subtotal || 0,
				quote.discount_amount || 0,
				quote.tax_amount || 0,
				quote.total || 0,
				quote.notes,
				quote.internal_notes,
				currentUser?.id || null
			)
			.run();

		// 2. Initial Booking Status History
		const historyId = generateId();
		await db
			.prepare(
				`INSERT INTO booking_status_history (
					id, booking_id, from_status, to_status, changed_by, notes, created_at
				) VALUES (?, ?, NULL, 'confirmed', ?, ?, datetime('now'))`
			)
			.bind(
				historyId,
				bookingId,
				currentUser?.id || null,
				`Converted from Quote ${quote.quote_number}`
			)
			.run();

		// 3. Mark Quote as Accepted
		await db
			.prepare("UPDATE quotes SET status = 'accepted', updated_at = datetime('now') WHERE id = ?")
			.bind(quoteId)
			.run();

		// 4. Record Activity Logs
		await recordActivity(
			"quote.converted",
			"quote",
			quoteId,
			{ message: `Converted quote ${quote.quote_number} to booking ${bookingNumber}`, bookingId, bookingNumber }
		);
		await recordActivity(
			"booking.created_from_quote",
			"booking",
			bookingId,
			{ message: `Booking ${bookingNumber} created from quote ${quote.quote_number}`, quoteId, quoteNumber: quote.quote_number }
		);

		revalidatePath("/admin/quotes");
		revalidatePath(`/admin/quotes/${quoteId}`);
		revalidatePath("/admin/bookings");
		revalidatePath(`/admin/customers/${quote.customer_id}`);
		revalidatePath("/admin/dashboard");

		return {
			success: true,
			bookingId,
			bookingNumber,
		};
	} catch (e) {
		console.error("Error converting quote to booking:", e);
		return { success: false, error: (e as Error).message || "Conversion failed" };
	}
}

/**
 * Generate and link an official Quotation from an existing Booking/Inquiry.
 */
export async function createQuoteFromBooking(
	bookingId: string
): Promise<{ success: boolean; quoteId?: string; quoteNumber?: string; error?: string }> {
	try {
		const db = await getDb();
		const currentUser = await getCurrentUser();

		// Fetch booking
		const booking = await db
			.prepare("SELECT * FROM bookings WHERE id = ?")
			.bind(bookingId)
			.first<{
				id: string;
				booking_number: string;
				quote_id: string | null;
				customer_id: string;
				pickup_location: string | null;
				dropoff_location: string | null;
				pickup_date: string | null;
				pickup_time: string | null;
				return_date: string | null;
				return_time: string | null;
				trip_type: string | null;
				vehicle_category: string | null;
				vehicle_id: string | null;
				passenger_count: number;
				luggage_info: string | null;
				flight_number: string | null;
				airline: string | null;
				additional_stops: string | null;
				special_requests: string | null;
				price: number;
				discount_amount: number;
				tax_amount: number;
				total: number;
				customer_notes: string | null;
				internal_notes: string | null;
			}>();

		if (!booking) {
			return { success: false, error: "Booking not found" };
		}

		// If quote already exists, return existing
		if (booking.quote_id) {
			const existingQuote = await getQuoteById(booking.quote_id);
			if (existingQuote) {
				return {
					success: true,
					quoteId: existingQuote.id,
					quoteNumber: existingQuote.quote_number,
				};
			}
		}

		const quoteId = generateId();
		const quoteNumber = await generateQuoteNumber(db);
		const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

		// 1. Insert Quote
		await db
			.prepare(
				`INSERT INTO quotes (
					id, quote_number, customer_id, status,
					pickup_location, dropoff_location, pickup_date, pickup_time,
					return_date, return_time, trip_type, vehicle_category, vehicle_id,
					passenger_count, luggage_info, flight_number, airline,
					additional_stops, special_requests, subtotal, discount_amount,
					discount_type, tax_amount, total, notes, internal_notes,
					valid_until, created_by, created_at, updated_at
				) VALUES (
					?, ?, ?, 'draft',
					?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?,
					'fixed', ?, ?, ?, ?,
					?, ?, datetime('now'), datetime('now')
				)`
			)
			.bind(
				quoteId,
				quoteNumber,
				booking.customer_id,
				booking.pickup_location,
				booking.dropoff_location,
				booking.pickup_date,
				booking.pickup_time,
				booking.return_date,
				booking.return_time,
				booking.trip_type || "one_way",
				booking.vehicle_category,
				booking.vehicle_id,
				booking.passenger_count || 1,
				booking.luggage_info,
				booking.flight_number,
				booking.airline,
				booking.additional_stops,
				booking.special_requests,
				booking.price || booking.total,
				booking.discount_amount || 0,
				booking.tax_amount || 0,
				booking.total,
				booking.customer_notes,
				booking.internal_notes,
				validUntil,
				currentUser?.id || null
			)
			.run();

		// 2. Insert itemized line item
		const itemId = generateId();
		const desc = `${booking.vehicle_category ? booking.vehicle_category.toUpperCase() : "CHAUFFEUR"} TRANSFER: ${booking.pickup_location || "Athens"} → ${booking.dropoff_location || "Destination"}`;

		await db
			.prepare(
				`INSERT INTO quote_items (
					id, quote_id, description, quantity, unit_price, total, sort_order
				) VALUES (?, ?, ?, 1, ?, ?, 0)`
			)
			.bind(
				itemId,
				quoteId,
				desc,
				booking.price || booking.total,
				booking.price || booking.total
			)
			.run();

		// 3. Link booking to quote & update status if inquiry
		await db
			.prepare("UPDATE bookings SET quote_id = ?, updated_at = datetime('now') WHERE id = ?")
			.bind(quoteId, bookingId)
			.run();

		// 4. Record Activity
		await recordActivity(
			"quote.created_from_booking",
			"quote",
			quoteId,
			{ message: `Generated quote ${quoteNumber} from booking ${booking.booking_number}` }
		);

		revalidatePath("/admin/bookings");
		revalidatePath(`/admin/bookings/${bookingId}`);
		revalidatePath("/admin/quotes");
		revalidatePath(`/admin/quotes/${quoteId}`);

		return {
			success: true,
			quoteId,
			quoteNumber,
		};
	} catch (e) {
		console.error("Error creating quote from booking:", e);
		return { success: false, error: (e as Error).message || "Failed to create quote from booking" };
	}
}

export interface QuoteAttentionResult {
	/** Sent/viewed quotes still waiting on the client, oldest first (capped sample). */
	pendingResponse: QuoteWithDetails[];
	pendingResponseTotal: number;
	/** Sent/viewed quotes whose valid_until falls within the next 48 hours (capped sample). */
	expiringSoon: QuoteWithDetails[];
	expiringSoonTotal: number;
}

/**
 * Dashboard "Quote Attention" data: quotes awaiting a client response and
 * quotes about to lapse. Both reuse the same customer join as getQuotes().
 */
export async function getQuoteAttention(limit = 5): Promise<QuoteAttentionResult> {
	try {
		const db = await getDb();
		const today = operationalDate(0);
		const soon = operationalDate(2);

		const baseSelect = `
			SELECT
				q.*,
				c.name as customer_name,
				c.email as customer_email,
				c.phone as customer_phone,
				c.company_name as customer_company
			FROM quotes q
			LEFT JOIN customers c ON c.id = q.customer_id
		`;

		const [pendingRes, pendingCountRes, expiringRes, expiringCountRes] = await Promise.all([
			db
				.prepare(
					`${baseSelect}
					WHERE q.status IN ('sent', 'viewed')
					ORDER BY q.created_at ASC
					LIMIT ?`
				)
				.bind(limit)
				.all<QuoteWithDetails>(),
			db
				.prepare("SELECT COUNT(*) as count FROM quotes WHERE status IN ('sent', 'viewed')")
				.first<{ count: number }>(),
			db
				.prepare(
					`${baseSelect}
					WHERE q.status IN ('sent', 'viewed')
						AND q.valid_until IS NOT NULL
						AND q.valid_until >= ?
						AND q.valid_until <= ?
					ORDER BY q.valid_until ASC
					LIMIT ?`
				)
				.bind(today, soon, limit)
				.all<QuoteWithDetails>(),
			db
				.prepare(
					`SELECT COUNT(*) as count FROM quotes
					 WHERE status IN ('sent', 'viewed') AND valid_until IS NOT NULL AND valid_until >= ? AND valid_until <= ?`
				)
				.bind(today, soon)
				.first<{ count: number }>(),
		]);

		return {
			pendingResponse: pendingRes.results || [],
			pendingResponseTotal: pendingCountRes?.count ?? 0,
			expiringSoon: expiringRes.results || [],
			expiringSoonTotal: expiringCountRes?.count ?? 0,
		};
	} catch (e) {
		console.error("Error in getQuoteAttention:", e);
		return { pendingResponse: [], pendingResponseTotal: 0, expiringSoon: [], expiringSoonTotal: 0 };
	}
}

