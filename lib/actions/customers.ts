// ============================================================
// Customer Actions & Data Access
// ============================================================
"use server";

import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { recordActivity } from "@/lib/actions/activity";
import type { Customer, CustomerType } from "@/lib/schema";

export interface CustomerWithStats extends Customer {
	total_bookings: number;
	completed_trips: number;
	total_spent: number;
}

export interface GetCustomersOptions {
	search?: string;
	customer_type?: string;
	page?: number;
	limit?: number;
}

export interface GetCustomersResult {
	customers: CustomerWithStats[];
	total: number;
	page: number;
	totalPages: number;
}

/**
 * Fetch paginated customer directory with search & filters.
 */
export async function getCustomers(
	options: GetCustomersOptions = {}
): Promise<GetCustomersResult> {
	try {
		const db = await getDb();
		const page = Math.max(1, options.page || 1);
		const limit = Math.min(100, Math.max(1, options.limit || 20));
		const offset = (page - 1) * limit;

		let whereClause = "WHERE 1=1";
		const params: (string | number)[] = [];

		if (options.search?.trim()) {
			const term = `%${options.search.trim()}%`;
			whereClause += " AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company_name LIKE ?)";
			params.push(term, term, term, term);
		}

		if (options.customer_type && options.customer_type !== "all") {
			whereClause += " AND c.customer_type = ?";
			params.push(options.customer_type);
		}

		// Count total query
		const countQuery = `SELECT COUNT(*) as total FROM customers c ${whereClause}`;
		const countStmt = db.prepare(countQuery);
		const countRes = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ total: number }>();
		const total = countRes?.total ?? 0;

		// Select customers with aggregated booking stats
		const dataQuery = `
			SELECT 
				c.*,
				COUNT(b.id) as total_bookings,
				COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_trips,
				COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total ELSE 0 END), 0) as total_spent
			FROM customers c
			LEFT JOIN bookings b ON b.customer_id = c.id
			${whereClause}
			GROUP BY c.id
			ORDER BY c.created_at DESC
			LIMIT ? OFFSET ?
		`;

		const dataParams = [...params, limit, offset];
		const dataStmt = db.prepare(dataQuery);
		const { results } = await dataStmt.bind(...dataParams).all<CustomerWithStats>();

		return {
			customers: results || [],
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		};
	} catch (e) {
		console.error("Error in getCustomers:", e);
		return { customers: [], total: 0, page: 1, totalPages: 1 };
	}
}

/**
 * Get single customer by ID with aggregate booking statistics.
 */
export async function getCustomerById(id: string): Promise<CustomerWithStats | null> {
	try {
		const db = await getDb();
		const query = `
			SELECT 
				c.*,
				COUNT(b.id) as total_bookings,
				COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_trips,
				COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total ELSE 0 END), 0) as total_spent
			FROM customers c
			LEFT JOIN bookings b ON b.customer_id = c.id
			WHERE c.id = ?
			GROUP BY c.id
		`;
		const row = await db.prepare(query).bind(id).first<CustomerWithStats>();
		return row || null;
	} catch (e) {
		console.error("Error in getCustomerById:", e);
		return null;
	}
}

/**
 * Quick search for customers by query string (used for autocompletion in booking/quote forms).
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
	if (!query || query.trim().length === 0) return [];

	try {
		const db = await getDb();
		const term = `%${query.trim()}%`;
		const stmt = db.prepare(`
			SELECT id, name, email, phone, customer_type, company_name
			FROM customers
			WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?
			ORDER BY name ASC
			LIMIT 10
		`);
		const { results } = await stmt.bind(term, term, term, term).all<Customer>();
		return results || [];
	} catch (e) {
		console.error("Error searching customers:", e);
		return [];
	}
}

export interface CustomerFormData {
	name: string;
	email?: string | null;
	phone?: string | null;
	customer_type?: CustomerType;
	company_name?: string | null;
	notes?: string | null;
}

export interface CustomerActionResult {
	success: boolean;
	customer?: Customer;
	error?: string;
}

/**
 * Create a new customer.
 */
export async function createCustomer(data: CustomerFormData): Promise<CustomerActionResult> {
	const name = data.name?.trim();
	if (!name) {
		return { success: false, error: "Customer name is required." };
	}

	try {
		const db = await getDb();
		const id = generateId();
		const now = new Date().toISOString();
		const email = data.email?.trim().toLowerCase() || null;
		const phone = data.phone?.trim() || null;
		const customerType = data.customer_type || "individual";
		const companyName = data.company_name?.trim() || null;
		const notes = data.notes?.trim() || null;

		await db
			.prepare(
				`INSERT INTO customers (id, name, email, phone, customer_type, company_name, notes, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(id, name, email, phone, customerType, companyName, notes, now, now)
			.run();

		await recordActivity("created", "customer", id, { name, email, phone, customerType });

		const customer: Customer = {
			id,
			name,
			email,
			phone,
			customer_type: customerType,
			company_name: companyName,
			notes,
			created_at: now,
			updated_at: now,
		};

		return { success: true, customer };
	} catch (e) {
		console.error("Error creating customer:", e);
		return { success: false, error: "Failed to create customer. Please try again." };
	}
}

/**
 * Update an existing customer.
 */
export async function updateCustomer(
	id: string,
	data: CustomerFormData
): Promise<CustomerActionResult> {
	const name = data.name?.trim();
	if (!name) {
		return { success: false, error: "Customer name is required." };
	}

	try {
		const db = await getDb();
		const now = new Date().toISOString();
		const email = data.email?.trim().toLowerCase() || null;
		const phone = data.phone?.trim() || null;
		const customerType = data.customer_type || "individual";
		const companyName = data.company_name?.trim() || null;
		const notes = data.notes?.trim() || null;

		await db
			.prepare(
				`UPDATE customers 
				 SET name = ?, email = ?, phone = ?, customer_type = ?, company_name = ?, notes = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(name, email, phone, customerType, companyName, notes, now, id)
			.run();

		await recordActivity("updated", "customer", id, { name, email, phone, customerType });

		return { success: true };
	} catch (e) {
		console.error("Error updating customer:", e);
		return { success: false, error: "Failed to update customer. Please try again." };
	}
}
