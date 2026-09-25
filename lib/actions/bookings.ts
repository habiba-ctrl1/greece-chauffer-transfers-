// ============================================================
// Booking Actions & Dispatch Operations
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/actions/activity";
import { BOOKING_STATUSES } from "@/lib/constants";
import type {
	Booking,
	BookingStatus,
	PaymentStatus,
	TripType,
	BookingSource,
	BookingStatusHistory,
	Driver,
	Vehicle,
} from "@/lib/schema";

export interface BookingWithDetails extends Booking {
	customer_name: string;
	customer_email: string | null;
	customer_phone: string | null;
	driver_name: string | null;
	driver_phone: string | null;
	vehicle_make: string | null;
	vehicle_model: string | null;
	vehicle_registration: string | null;
	quote_number?: string | null;
}

export interface GetBookingsFilter {
	status?: string;
	payment_status?: string;
	unassigned?: boolean;
	today_only?: boolean;
	/** Inclusive pickup_date lower bound, e.g. from operationalDate(). */
	date_from?: string;
	/** Inclusive pickup_date upper bound, e.g. from operationalDate(). */
	date_to?: string;
	search?: string;
	customer_id?: string;
	driver_id?: string;
	page?: number;
	limit?: number;
}

export interface GetBookingsResult {
	bookings: BookingWithDetails[];
	total: number;
	page: number;
	totalPages: number;
}

/**
 * Generate sequential booking number: GCS-B-YYYY-XXXX
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

	let nextNum = 1;
	if (last?.booking_number) {
		const parts = last.booking_number.split("-");
		const seq = parseInt(parts[parts.length - 1], 10);
		if (!isNaN(seq)) {
			nextNum = seq + 1;
		}
	}

	return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

/**
 * Fetch bookings with joins and filters.
 */
export async function getBookings(
	filter: GetBookingsFilter = {}
): Promise<GetBookingsResult> {
	try {
		const db = await getDb();
		const page = Math.max(1, filter.page || 1);
		const limit = Math.min(100, Math.max(1, filter.limit || 20));
		const offset = (page - 1) * limit;

		let whereClause = "WHERE 1=1";
		const params: (string | number)[] = [];

		if (filter.status && filter.status !== "all") {
			whereClause += " AND b.status = ?";
			params.push(filter.status);
		}

		if (filter.payment_status && filter.payment_status !== "all") {
			whereClause += " AND b.payment_status = ?";
			params.push(filter.payment_status);
		}

		if (filter.unassigned) {
			whereClause += " AND b.driver_id IS NULL AND b.status IN ('confirmed', 'awaiting_confirmation')";
		}

		if (filter.today_only) {
			whereClause += " AND b.pickup_date = date('now')";
		}

		if (filter.date_from) {
			whereClause += " AND b.pickup_date >= ?";
			params.push(filter.date_from);
		}

		if (filter.date_to) {
			whereClause += " AND b.pickup_date <= ?";
			params.push(filter.date_to);
		}

		if (filter.customer_id) {
			whereClause += " AND b.customer_id = ?";
			params.push(filter.customer_id);
		}

		if (filter.driver_id) {
			whereClause += " AND b.driver_id = ?";
			params.push(filter.driver_id);
		}

		if (filter.search?.trim()) {
			const term = `%${filter.search.trim()}%`;
			whereClause += ` AND (
				b.booking_number LIKE ? OR 
				c.name LIKE ? OR 
				c.phone LIKE ? OR 
				b.pickup_location LIKE ? OR 
				b.dropoff_location LIKE ? OR 
				b.flight_number LIKE ?
			)`;
			params.push(term, term, term, term, term, term);
		}

		// Count total
		const countQuery = `
			SELECT COUNT(*) as total 
			FROM bookings b
			JOIN customers c ON c.id = b.customer_id
			${whereClause}
		`;
		const countStmt = db.prepare(countQuery);
		const countRes = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ total: number }>();
		const total = countRes?.total ?? 0;

		// Select data
		const dataQuery = `
			SELECT 
				b.*,
				c.name as customer_name,
				c.email as customer_email,
				c.phone as customer_phone,
				d.name as driver_name,
				d.phone as driver_phone,
				v.make as vehicle_make,
				v.model as vehicle_model,
				v.registration as vehicle_registration
			FROM bookings b
			JOIN customers c ON c.id = b.customer_id
			LEFT JOIN drivers d ON d.id = b.driver_id
			LEFT JOIN vehicles v ON v.id = b.vehicle_id
			${whereClause}
			ORDER BY b.pickup_date DESC, b.pickup_time DESC, b.created_at DESC
			LIMIT ? OFFSET ?
		`;

		const dataParams = [...params, limit, offset];
		const dataStmt = db.prepare(dataQuery);
		const { results } = await dataStmt.bind(...dataParams).all<BookingWithDetails>();

		return {
			bookings: results || [],
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		};
	} catch (e) {
		console.error("Error in getBookings:", e);
		return { bookings: [], total: 0, page: 1, totalPages: 1 };
	}
}

export interface BookingDetailResult {
	booking: BookingWithDetails;
	history: BookingStatusHistory[];
}

/**
 * Get full booking detail including customer, driver, vehicle, and status timeline.
 */
export async function getBookingById(id: string): Promise<BookingDetailResult | null> {
	try {
		const db = await getDb();
		const query = `
			SELECT 
				b.*,
				c.name as customer_name,
				c.email as customer_email,
				c.phone as customer_phone,
				d.name as driver_name,
				d.phone as driver_phone,
				v.make as vehicle_make,
				v.model as vehicle_model,
				v.registration as vehicle_registration,
				q.quote_number as quote_number
			FROM bookings b
			JOIN customers c ON c.id = b.customer_id
			LEFT JOIN drivers d ON d.id = b.driver_id
			LEFT JOIN vehicles v ON v.id = b.vehicle_id
			LEFT JOIN quotes q ON q.id = b.quote_id
			WHERE b.id = ?
		`;

		const booking = await db.prepare(query).bind(id).first<BookingWithDetails>();
		if (!booking) return null;

		const { results: history } = await db
			.prepare("SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY created_at DESC")
			.bind(id)
			.all<BookingStatusHistory>();

		return {
			booking,
			history: history || [],
		};
	} catch (e) {
		console.error("Error in getBookingById:", e);
		return null;
	}
}

export interface CreateBookingData {
	customer_id: string;
	status?: BookingStatus;
	payment_status?: PaymentStatus;
	pickup_location: string;
	dropoff_location: string;
	pickup_date: string;
	pickup_time: string;
	return_date?: string | null;
	return_time?: string | null;
	trip_type?: TripType;
	vehicle_category?: string | null;
	vehicle_id?: string | null;
	driver_id?: string | null;
	passenger_count?: number;
	luggage_info?: string | null;
	flight_number?: string | null;
	airline?: string | null;
	flight_type?: "arrival" | "departure" | null;
	additional_stops?: string | null;
	waiting_requirements?: string | null;
	special_requests?: string | null;
	price?: number;
	discount_amount?: number;
	tax_amount?: number;
	total?: number;
	customer_notes?: string | null;
	internal_notes?: string | null;
	booking_source?: BookingSource;
}

export interface BookingActionResult {
	success: boolean;
	bookingId?: string;
	bookingNumber?: string;
	error?: string;
}

/**
 * Create a new booking with initial status history and activity record.
 */
export async function createBooking(data: CreateBookingData): Promise<BookingActionResult> {
	if (!data.customer_id) {
		return { success: false, error: "Customer is required." };
	}
	if (!data.pickup_location || !data.dropoff_location) {
		return { success: false, error: "Pickup and dropoff locations are required." };
	}
	if (!data.pickup_date || !data.pickup_time) {
		return { success: false, error: "Pickup date and time are required." };
	}

	try {
		const db = await getDb();
		const user = await getCurrentUser();
		const id = generateId();
		const bookingNumber = await generateBookingNumber(db);
		const now = new Date().toISOString();

		const status = data.status || (data.driver_id ? "driver_assigned" : "confirmed");
		const paymentStatus = data.payment_status || "pending";
		const tripType = data.trip_type || "one_way";
		const passengerCount = data.passenger_count || 1;
		const price = data.price || 0;
		const discountAmount = data.discount_amount || 0;
		const taxAmount = data.tax_amount || 0;
		const total = data.total || (price - discountAmount + taxAmount);
		const bookingSource = data.booking_source || "admin";

		await db
			.prepare(
				`INSERT INTO bookings (
					id, booking_number, quote_id, customer_id, status, payment_status,
					pickup_location, dropoff_location, pickup_date, pickup_time,
					return_date, return_time, trip_type, vehicle_category, vehicle_id,
					driver_id, passenger_count, luggage_info, flight_number, airline,
					flight_type, additional_stops, waiting_requirements, special_requests,
					price, discount_amount, tax_amount, total, customer_notes, internal_notes,
					booking_source, created_by, created_at, updated_at
				) VALUES (
					?, ?, ?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, ?, ?,
					?, ?, ?, ?, ?, ?,
					?, ?, ?, ?
				)`
			)
			.bind(
				id, bookingNumber, null, data.customer_id, status, paymentStatus,
				data.pickup_location, data.dropoff_location, data.pickup_date, data.pickup_time,
				data.return_date || null, data.return_time || null, tripType, data.vehicle_category || null, data.vehicle_id || null,
				data.driver_id || null, passengerCount, data.luggage_info || null, data.flight_number || null, data.airline || null,
				data.flight_type || null, data.additional_stops || null, data.waiting_requirements || null, data.special_requests || null,
				price, discountAmount, taxAmount, total, data.customer_notes || null, data.internal_notes || null,
				bookingSource, user?.id || null, now, now
			)
			.run();

		// Record initial status history
		const historyId = generateId();
		await db
			.prepare(
				`INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, notes, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(historyId, id, null, status, user?.id || null, "Initial booking created", now)
			.run();

		await recordActivity("created", "booking", id, {
			bookingNumber,
			customer_id: data.customer_id,
			status,
			pickup_date: data.pickup_date,
		});

		return { success: true, bookingId: id, bookingNumber };
	} catch (e) {
		console.error("Error creating booking:", e);
		return { success: false, error: "Failed to create booking. Please try again." };
	}
}

/**
 * Update an existing booking.
 */
export async function updateBooking(
	id: string,
	data: Partial<CreateBookingData>
): Promise<BookingActionResult> {
	try {
		const db = await getDb();
		const now = new Date().toISOString();

		await db
			.prepare(
				`UPDATE bookings SET
					pickup_location = COALESCE(?, pickup_location),
					dropoff_location = COALESCE(?, dropoff_location),
					pickup_date = COALESCE(?, pickup_date),
					pickup_time = COALESCE(?, pickup_time),
					return_date = ?,
					return_time = ?,
					trip_type = COALESCE(?, trip_type),
					vehicle_category = ?,
					passenger_count = COALESCE(?, passenger_count),
					luggage_info = ?,
					flight_number = ?,
					airline = ?,
					flight_type = ?,
					additional_stops = ?,
					waiting_requirements = ?,
					special_requests = ?,
					price = COALESCE(?, price),
					discount_amount = COALESCE(?, discount_amount),
					tax_amount = COALESCE(?, tax_amount),
					total = COALESCE(?, total),
					customer_notes = ?,
					internal_notes = ?,
					updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				data.pickup_location ?? null,
				data.dropoff_location ?? null,
				data.pickup_date ?? null,
				data.pickup_time ?? null,
				data.return_date ?? null,
				data.return_time ?? null,
				data.trip_type ?? null,
				data.vehicle_category ?? null,
				data.passenger_count ?? null,
				data.luggage_info ?? null,
				data.flight_number ?? null,
				data.airline ?? null,
				data.flight_type ?? null,
				data.additional_stops ?? null,
				data.waiting_requirements ?? null,
				data.special_requests ?? null,
				data.price ?? null,
				data.discount_amount ?? null,
				data.tax_amount ?? null,
				data.total ?? null,
				data.customer_notes ?? null,
				data.internal_notes ?? null,
				now,
				id
			)
			.run();

		await recordActivity("updated", "booking", id, { updated_at: now });

		return { success: true, bookingId: id };
	} catch (e) {
		console.error("Error updating booking:", e);
		return { success: false, error: "Failed to update booking." };
	}
}

/**
 * Transition booking status and record in history.
 */
export async function updateBookingStatus(
	id: string,
	newStatus: BookingStatus,
	notes?: string
): Promise<BookingActionResult> {
	try {
		const db = await getDb();
		const user = await getCurrentUser();
		const now = new Date().toISOString();

		// Get current status
		const current = await db
			.prepare("SELECT status, booking_number FROM bookings WHERE id = ?")
			.bind(id)
			.first<{ status: BookingStatus; booking_number: string }>();

		if (!current) {
			return { success: false, error: "Booking not found." };
		}

		if (current.status === newStatus) {
			return { success: true, bookingId: id };
		}

		// Update booking status
		await db
			.prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?")
			.bind(newStatus, now, id)
			.run();

		// Add status history entry
		const historyId = generateId();
		await db
			.prepare(
				`INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, notes, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(historyId, id, current.status, newStatus, user?.id || null, notes || null, now)
			.run();

		await recordActivity("status_changed", "booking", id, {
			bookingNumber: current.booking_number,
			from: current.status,
			to: newStatus,
			notes,
		});

		return { success: true, bookingId: id };
	} catch (e) {
		console.error("Error updating booking status:", e);
		return { success: false, error: "Failed to update status." };
	}
}

/**
 * Assign or reassign driver and vehicle to a booking.
 */
export async function assignBookingDriverAndVehicle(
	id: string,
	driverId: string | null,
	vehicleId: string | null
): Promise<BookingActionResult> {
	try {
		const db = await getDb();
		const user = await getCurrentUser();
		const now = new Date().toISOString();

		const current = await db
			.prepare("SELECT status, booking_number, driver_id, vehicle_id FROM bookings WHERE id = ?")
			.bind(id)
			.first<{ status: BookingStatus; booking_number: string; driver_id: string | null; vehicle_id: string | null }>();

		if (!current) {
			return { success: false, error: "Booking not found." };
		}

		// If driver is assigned and status was confirmed/awaiting_confirmation, advance to driver_assigned
		let targetStatus = current.status;
		if (driverId && (current.status === "confirmed" || current.status === "awaiting_confirmation")) {
			targetStatus = "driver_assigned";
		} else if (!driverId && current.status === "driver_assigned") {
			targetStatus = "confirmed";
		}

		await db
			.prepare(
				"UPDATE bookings SET driver_id = ?, vehicle_id = ?, status = ?, updated_at = ? WHERE id = ?"
			)
			.bind(driverId || null, vehicleId || null, targetStatus, now, id)
			.run();

		if (targetStatus !== current.status) {
			const historyId = generateId();
			await db
				.prepare(
					`INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, notes, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					historyId,
					id,
					current.status,
					targetStatus,
					user?.id || null,
					driverId ? "Driver and vehicle assigned" : "Driver unassigned",
					now
				)
				.run();
		}

		await recordActivity("assigned", "booking", id, {
			bookingNumber: current.booking_number,
			driver_id: driverId,
			vehicle_id: vehicleId,
		});

		return { success: true, bookingId: id };
	} catch (e) {
		console.error("Error assigning driver and vehicle:", e);
		return { success: false, error: "Failed to assign driver or vehicle." };
	}
}

/**
 * Fetch active drivers for dispatch assignment dropdowns.
 */
export async function getActiveDrivers(): Promise<Driver[]> {
	try {
		const db = await getDb();
		const { results } = await db
			.prepare("SELECT id, name, phone, email, status, driver_type FROM drivers WHERE status = 'active' ORDER BY name ASC")
			.all<Driver>();
		return results || [];
	} catch {
		return [];
	}
}

/**
 * Fetch active/available vehicles for dispatch assignment dropdowns.
 */
export async function getAvailableVehicles(): Promise<Vehicle[]> {
	try {
		const db = await getDb();
		const { results } = await db
			.prepare("SELECT id, make, model, year, category, registration, status FROM vehicles WHERE status IN ('available', 'assigned') ORDER BY category ASC, make ASC")
			.all<Vehicle>();
		return results || [];
	} catch {
		return [];
	}
}

/**
 * Fetch a joined, dispatch-ready booking list for a fixed pickup_date range
 * (inclusive), ordered for an operations board. Used by the dashboard for
 * both "Today's Operations" (fromDate === toDate) and "Upcoming Transfers".
 * Excludes cancelled/declined so the board only shows live work.
 */
export async function getScheduleBookings(
	fromDate: string,
	toDate: string,
	limit = 50
): Promise<BookingWithDetails[]> {
	try {
		const db = await getDb();
		const { results } = await db
			.prepare(
				`SELECT
					b.*,
					c.name as customer_name,
					c.email as customer_email,
					c.phone as customer_phone,
					d.name as driver_name,
					d.phone as driver_phone,
					v.make as vehicle_make,
					v.model as vehicle_model,
					v.registration as vehicle_registration
				FROM bookings b
				JOIN customers c ON c.id = b.customer_id
				LEFT JOIN drivers d ON d.id = b.driver_id
				LEFT JOIN vehicles v ON v.id = b.vehicle_id
				WHERE b.pickup_date >= ? AND b.pickup_date <= ?
					AND b.status NOT IN ('cancelled', 'declined')
				ORDER BY b.pickup_date ASC, b.pickup_time ASC
				LIMIT ?`
			)
			.bind(fromDate, toDate, limit)
			.all<BookingWithDetails>();
		return results || [];
	} catch (e) {
		console.error("Error in getScheduleBookings:", e);
		return [];
	}
}

/**
 * Count live bookings per status for the dashboard pipeline strip.
 * Always returns every known status (zero-filled) so the UI doesn't have
 * to guard against missing keys.
 */
export async function getBookingPipelineCounts(): Promise<Record<BookingStatus, number>> {
	const zeroed = Object.fromEntries(
		BOOKING_STATUSES.map((s) => [s, 0])
	) as Record<BookingStatus, number>;

	try {
		const db = await getDb();
		const { results } = await db
			.prepare("SELECT status, COUNT(*) as count FROM bookings GROUP BY status")
			.all<{ status: BookingStatus; count: number }>();

		for (const row of results || []) {
			if (row.status in zeroed) {
				zeroed[row.status] = row.count;
			}
		}
		return zeroed;
	} catch (e) {
		console.error("Error in getBookingPipelineCounts:", e);
		return zeroed;
	}
}

export interface PendingSettlementBooking {
	id: string;
	booking_number: string;
	customer_name: string;
	total: number;
	pickup_date: string | null;
}

/**
 * Completed trips whose payment is still pending or partial — the
 * "trip finished, money not settled" gap the audit flagged (no Payments
 * UI exists yet, so this is the closest real signal available today).
 */
export async function getPendingSettlementBookings(limit = 50): Promise<PendingSettlementBooking[]> {
	try {
		const db = await getDb();
		const { results } = await db
			.prepare(
				`SELECT b.id, b.booking_number, c.name as customer_name, b.total, b.pickup_date
				 FROM bookings b
				 JOIN customers c ON c.id = b.customer_id
				 WHERE b.status = 'completed' AND b.payment_status IN ('pending', 'partially_paid')
				 ORDER BY b.pickup_date DESC
				 LIMIT ?`
			)
			.bind(limit)
			.all<PendingSettlementBooking>();
		return results || [];
	} catch (e) {
		console.error("Error in getPendingSettlementBookings:", e);
		return [];
	}
}

export interface OperationalConflict {
	resourceType: "driver" | "vehicle";
	resourceName: string;
	pickupDate: string;
	pickupTime: string | null;
	bookingAId: string;
	bookingANumber: string;
	bookingBId: string;
	bookingBNumber: string;
}

/**
 * Flag bookings where the same driver or vehicle is committed to two
 * different live bookings at the exact same pickup date+time. This is a
 * deliberately conservative check: the schema has no trip-duration or
 * dropoff-time field, so a reliable "overlapping window" conflict check
 * (e.g. a 09:00 and 09:30 pickup with the same driver) isn't possible
 * without guessing a trip duration. Only exact-time double-bookings —
 * which are unambiguous — are reported. Read-only: never changes an
 * assignment.
 */
export async function getOperationalConflicts(limit = 10): Promise<OperationalConflict[]> {
	try {
		const db = await getDb();
		const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		const liveExclusion = "('cancelled', 'declined', 'completed', 'no_show')";

		const [driverRes, vehicleRes] = await Promise.all([
			db
				.prepare(
					`SELECT
						b1.id as bookingAId, b1.booking_number as bookingANumber,
						b2.id as bookingBId, b2.booking_number as bookingBNumber,
						d.name as resourceName, b1.pickup_date as pickupDate, b1.pickup_time as pickupTime
					FROM bookings b1
					JOIN bookings b2
						ON b1.driver_id = b2.driver_id
						AND b1.pickup_date = b2.pickup_date
						AND b1.pickup_time = b2.pickup_time
						AND b1.id < b2.id
					JOIN drivers d ON d.id = b1.driver_id
					WHERE b1.driver_id IS NOT NULL
						AND b1.pickup_date >= ?
						AND b1.status NOT IN ${liveExclusion}
						AND b2.status NOT IN ${liveExclusion}
					ORDER BY b1.pickup_date ASC, b1.pickup_time ASC
					LIMIT ?`
				)
				.bind(fromDate, limit)
				.all<{
					bookingAId: string; bookingANumber: string;
					bookingBId: string; bookingBNumber: string;
					resourceName: string; pickupDate: string; pickupTime: string | null;
				}>(),
			db
				.prepare(
					`SELECT
						b1.id as bookingAId, b1.booking_number as bookingANumber,
						b2.id as bookingBId, b2.booking_number as bookingBNumber,
						(v.make || ' ' || v.model) as resourceName, b1.pickup_date as pickupDate, b1.pickup_time as pickupTime
					FROM bookings b1
					JOIN bookings b2
						ON b1.vehicle_id = b2.vehicle_id
						AND b1.pickup_date = b2.pickup_date
						AND b1.pickup_time = b2.pickup_time
						AND b1.id < b2.id
					JOIN vehicles v ON v.id = b1.vehicle_id
					WHERE b1.vehicle_id IS NOT NULL
						AND b1.pickup_date >= ?
						AND b1.status NOT IN ${liveExclusion}
						AND b2.status NOT IN ${liveExclusion}
					ORDER BY b1.pickup_date ASC, b1.pickup_time ASC
					LIMIT ?`
				)
				.bind(fromDate, limit)
				.all<{
					bookingAId: string; bookingANumber: string;
					bookingBId: string; bookingBNumber: string;
					resourceName: string; pickupDate: string; pickupTime: string | null;
				}>(),
		]);

		const conflicts: OperationalConflict[] = [
			...(driverRes.results || []).map((r) => ({ ...r, resourceType: "driver" as const })),
			...(vehicleRes.results || []).map((r) => ({ ...r, resourceType: "vehicle" as const })),
		];

		return conflicts.slice(0, limit);
	} catch (e) {
		console.error("Error in getOperationalConflicts:", e);
		return [];
	}
}
