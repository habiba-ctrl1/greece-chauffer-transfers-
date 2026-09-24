// ============================================================
// Driver Actions & Data Access
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { recordActivity } from "@/lib/actions/activity";
import type { Driver, DriverStatus } from "@/lib/schema";

export interface DriverWithStats extends Driver {
	total_trips: number;
	completed_trips: number;
}

export interface GetDriversOptions {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
}

export interface GetDriversResult {
	drivers: DriverWithStats[];
	total: number;
	page: number;
	totalPages: number;
}

/**
 * Fetch paginated driver directory with search & status filters.
 */
export async function getDrivers(
	options: GetDriversOptions = {}
): Promise<GetDriversResult> {
	try {
		const db = await getDb();
		const page = Math.max(1, options.page || 1);
		const limit = Math.min(100, Math.max(1, options.limit || 20));
		const offset = (page - 1) * limit;

		let whereClause = "WHERE 1=1";
		const params: (string | number)[] = [];

		if (options.search?.trim()) {
			const term = `%${options.search.trim()}%`;
			whereClause += " AND (d.name LIKE ? OR d.phone LIKE ? OR d.email LIKE ? OR d.license_number LIKE ?)";
			params.push(term, term, term, term);
		}

		if (options.status && options.status !== "all") {
			whereClause += " AND d.status = ?";
			params.push(options.status);
		}

		const countQuery = `SELECT COUNT(*) as total FROM drivers d ${whereClause}`;
		const countStmt = db.prepare(countQuery);
		const countRes = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ total: number }>();
		const total = countRes?.total ?? 0;

		const dataQuery = `
			SELECT
				d.*,
				COUNT(b.id) as total_trips,
				COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_trips
			FROM drivers d
			LEFT JOIN bookings b ON b.driver_id = d.id
			${whereClause}
			GROUP BY d.id
			ORDER BY d.created_at DESC
			LIMIT ? OFFSET ?
		`;

		const dataParams = [...params, limit, offset];
		const { results } = await db.prepare(dataQuery).bind(...dataParams).all<DriverWithStats>();

		return {
			drivers: results || [],
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		};
	} catch (e) {
		console.error("Error in getDrivers:", e);
		return { drivers: [], total: 0, page: 1, totalPages: 1 };
	}
}

/**
 * Get a single driver by ID with trip statistics.
 */
export async function getDriverById(id: string): Promise<DriverWithStats | null> {
	try {
		const db = await getDb();
		const query = `
			SELECT
				d.*,
				COUNT(b.id) as total_trips,
				COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_trips
			FROM drivers d
			LEFT JOIN bookings b ON b.driver_id = d.id
			WHERE d.id = ?
			GROUP BY d.id
		`;
		const row = await db.prepare(query).bind(id).first<DriverWithStats>();
		return row || null;
	} catch (e) {
		console.error("Error in getDriverById:", e);
		return null;
	}
}

export interface DriverFormData {
	name: string;
	email?: string | null;
	phone?: string | null;
	address?: string | null;
	license_number?: string | null;
	license_expiry?: string | null;
	status?: DriverStatus;
	driver_type?: "company" | "partner";
	emergency_contact_name?: string | null;
	emergency_contact_phone?: string | null;
	notes?: string | null;
}

export interface DriverActionResult {
	success: boolean;
	driver?: Driver;
	error?: string;
}

/**
 * Create a new driver profile.
 */
export async function createDriver(data: DriverFormData): Promise<DriverActionResult> {
	const name = data.name?.trim();
	if (!name) {
		return { success: false, error: "Driver name is required." };
	}

	try {
		const db = await getDb();
		const id = generateId();
		const now = new Date().toISOString();
		const email = data.email?.trim().toLowerCase() || null;
		const phone = data.phone?.trim() || null;
		const address = data.address?.trim() || null;
		const licenseNumber = data.license_number?.trim() || null;
		const licenseExpiry = data.license_expiry?.trim() || null;
		const status = data.status || "pending";
		const driverType = data.driver_type || "company";
		const emergencyContactName = data.emergency_contact_name?.trim() || null;
		const emergencyContactPhone = data.emergency_contact_phone?.trim() || null;
		const notes = data.notes?.trim() || null;

		await db
			.prepare(
				`INSERT INTO drivers (
					id, name, email, phone, address, license_number, license_expiry,
					status, driver_type, emergency_contact_name, emergency_contact_phone,
					notes, created_at, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				id, name, email, phone, address, licenseNumber, licenseExpiry,
				status, driverType, emergencyContactName, emergencyContactPhone,
				notes, now, now
			)
			.run();

		await recordActivity("created", "driver", id, { name, phone, status });

		const driver: Driver = {
			id,
			name,
			email,
			phone,
			address,
			license_number: licenseNumber,
			license_expiry: licenseExpiry,
			status,
			driver_type: driverType,
			emergency_contact_name: emergencyContactName,
			emergency_contact_phone: emergencyContactPhone,
			notes,
			created_at: now,
			updated_at: now,
		};

		return { success: true, driver };
	} catch (e) {
		console.error("Error creating driver:", e);
		return { success: false, error: "Failed to add driver. Please try again." };
	}
}

/**
 * Update an existing driver profile.
 */
export async function updateDriver(
	id: string,
	data: DriverFormData
): Promise<DriverActionResult> {
	const name = data.name?.trim();
	if (!name) {
		return { success: false, error: "Driver name is required." };
	}

	try {
		const db = await getDb();
		const now = new Date().toISOString();
		const email = data.email?.trim().toLowerCase() || null;
		const phone = data.phone?.trim() || null;
		const address = data.address?.trim() || null;
		const licenseNumber = data.license_number?.trim() || null;
		const licenseExpiry = data.license_expiry?.trim() || null;
		const status = data.status || "pending";
		const driverType = data.driver_type || "company";
		const emergencyContactName = data.emergency_contact_name?.trim() || null;
		const emergencyContactPhone = data.emergency_contact_phone?.trim() || null;
		const notes = data.notes?.trim() || null;

		await db
			.prepare(
				`UPDATE drivers
				 SET name = ?, email = ?, phone = ?, address = ?, license_number = ?, license_expiry = ?,
				     status = ?, driver_type = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
				     notes = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				name, email, phone, address, licenseNumber, licenseExpiry,
				status, driverType, emergencyContactName, emergencyContactPhone,
				notes, now, id
			)
			.run();

		await recordActivity("updated", "driver", id, { name, phone, status });

		return { success: true };
	} catch (e) {
		console.error("Error updating driver:", e);
		return { success: false, error: "Failed to update driver. Please try again." };
	}
}

/**
 * Quickly change a driver's status (e.g. Approve, Activate, Suspend).
 */
export async function updateDriverStatus(
	id: string,
	status: DriverStatus
): Promise<{ success: boolean; error?: string }> {
	try {
		const db = await getDb();
		await db
			.prepare("UPDATE drivers SET status = ?, updated_at = datetime('now') WHERE id = ?")
			.bind(status, id)
			.run();

		await recordActivity("status_changed", "driver", id, { status });

		return { success: true };
	} catch (e) {
		console.error("Error updating driver status:", e);
		return { success: false, error: "Failed to update driver status." };
	}
}
