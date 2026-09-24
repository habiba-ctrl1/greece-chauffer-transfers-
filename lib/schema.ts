export type {
	BookingStatus,
	PaymentStatus,
	QuoteStatus,
	DriverStatus,
	VehicleStatus,
	VehicleCategory,
	TripType,
	CustomerType,
	BookingSource,
	UserRole,
	VerificationStatus,
	InvoiceStatus,
	PaymentMethod,
} from "./constants";

import type {
	BookingStatus,
	PaymentStatus,
	QuoteStatus,
	DriverStatus,
	VehicleStatus,
	VehicleCategory,
	TripType,
	CustomerType,
	BookingSource,
	UserRole,
	VerificationStatus,
	InvoiceStatus,
	PaymentMethod,
} from "./constants";

// ── User ─────────────────────────────────────────────────────

export interface User {
	id: string;
	email: string;
	password_hash: string;
	name: string;
	role: UserRole;
	status: "active" | "suspended" | "inactive";
	created_at: string;
	updated_at: string;
}

/** User data exposed to the client (no password hash) */
export interface SafeUser {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	status: "active" | "suspended" | "inactive";
}

export interface Session {
	id: string;
	user_id: string;
	expires_at: string;
	created_at: string;
}

// ── Customer ─────────────────────────────────────────────────

export interface Customer {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	customer_type: CustomerType;
	company_name: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

// ── Quote ────────────────────────────────────────────────────

export interface Quote {
	id: string;
	quote_number: string;
	customer_id: string;
	status: QuoteStatus;
	pickup_location: string | null;
	dropoff_location: string | null;
	pickup_date: string | null;
	pickup_time: string | null;
	return_date: string | null;
	return_time: string | null;
	trip_type: TripType | null;
	vehicle_category: string | null;
	vehicle_id: string | null;
	passenger_count: number;
	luggage_info: string | null;
	flight_number: string | null;
	airline: string | null;
	additional_stops: string | null;
	special_requests: string | null;
	subtotal: number;
	discount_amount: number;
	discount_type: "fixed" | "percentage" | null;
	tax_amount: number;
	total: number;
	notes: string | null;
	internal_notes: string | null;
	valid_until: string | null;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface QuoteItem {
	id: string;
	quote_id: string;
	description: string;
	quantity: number;
	unit_price: number;
	total: number;
	sort_order: number;
}

export interface QuoteWithDetails extends Quote {
	customer_name: string;
	customer_email: string | null;
	customer_phone: string | null;
	customer_company: string | null;
	items?: QuoteItem[];
	converted_booking_id?: string | null;
	converted_booking_number?: string | null;
}

// ── Booking ──────────────────────────────────────────────────

export interface Booking {
	id: string;
	booking_number: string;
	quote_id: string | null;
	customer_id: string;
	status: BookingStatus;
	payment_status: PaymentStatus;
	pickup_location: string | null;
	dropoff_location: string | null;
	pickup_date: string | null;
	pickup_time: string | null;
	return_date: string | null;
	return_time: string | null;
	trip_type: TripType | null;
	vehicle_category: string | null;
	vehicle_id: string | null;
	driver_id: string | null;
	passenger_count: number;
	luggage_info: string | null;
	flight_number: string | null;
	airline: string | null;
	flight_type: "arrival" | "departure" | null;
	additional_stops: string | null;
	waiting_requirements: string | null;
	special_requests: string | null;
	price: number;
	discount_amount: number;
	tax_amount: number;
	total: number;
	customer_notes: string | null;
	internal_notes: string | null;
	booking_source: BookingSource;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

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

export interface BookingStatusHistory {
	id: string;
	booking_id: string;
	from_status: BookingStatus | null;
	to_status: BookingStatus;
	changed_by: string | null;
	notes: string | null;
	created_at: string;
}

// ── Driver ───────────────────────────────────────────────────

export interface Driver {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	address: string | null;
	license_number: string | null;
	license_expiry: string | null;
	status: DriverStatus;
	driver_type: "company" | "partner";
	emergency_contact_name: string | null;
	emergency_contact_phone: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface DriverDocument {
	id: string;
	driver_id: string;
	document_type: "license" | "id" | "insurance" | "vehicle_doc" | "other";
	file_name: string;
	file_key: string;
	file_size: number | null;
	mime_type: string | null;
	issue_date: string | null;
	expiry_date: string | null;
	verification_status: VerificationStatus;
	verified_by: string | null;
	verified_at: string | null;
	notes: string | null;
	created_at: string;
}

// ── Vehicle ──────────────────────────────────────────────────

export interface Vehicle {
	id: string;
	make: string;
	model: string;
	year: number | null;
	category: VehicleCategory;
	registration: string | null;
	passenger_capacity: number;
	luggage_capacity: number;
	owner_type: "company" | "partner";
	status: VehicleStatus;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface VehicleDocument {
	id: string;
	vehicle_id: string;
	document_type: string;
	file_name: string;
	file_key: string;
	file_size: number | null;
	mime_type: string | null;
	issue_date: string | null;
	expiry_date: string | null;
	verification_status: VerificationStatus;
	notes: string | null;
	created_at: string;
}

// ── Route & Pricing ──────────────────────────────────────────

export interface Route {
	id: string;
	name: string;
	origin: string;
	destination: string;
	distance_km: number | null;
	estimated_duration_min: number | null;
	is_active: number;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface PricingRule {
	id: string;
	route_id: string | null;
	vehicle_category: string | null;
	trip_type: string | null;
	base_price: number;
	per_km_price: number | null;
	per_hour_price: number | null;
	extra_stop_charge: number;
	waiting_charge_per_hour: number;
	is_active: number;
	created_at: string;
	updated_at: string;
}

// ── Payment ──────────────────────────────────────────────────

export interface Payment {
	id: string;
	booking_id: string;
	customer_id: string;
	amount: number;
	currency: string;
	status: "pending" | "completed" | "refunded" | "failed";
	method: PaymentMethod | null;
	reference: string | null;
	payment_date: string | null;
	notes: string | null;
	created_by: string | null;
	created_at: string;
}

// ── Invoice ──────────────────────────────────────────────────

export interface Invoice {
	id: string;
	invoice_number: string;
	booking_id: string | null;
	customer_id: string;
	status: InvoiceStatus;
	subtotal: number;
	discount_amount: number;
	tax_amount: number;
	total: number;
	due_date: string | null;
	paid_date: string | null;
	notes: string | null;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface InvoiceItem {
	id: string;
	invoice_id: string;
	description: string;
	quantity: number;
	unit_price: number;
	total: number;
	sort_order: number;
}

export interface InvoiceWithDetails extends Invoice {
	customer_name: string;
	customer_email: string | null;
	customer_phone: string | null;
	customer_company: string | null;
	booking_number?: string | null;
	pickup_location?: string | null;
	dropoff_location?: string | null;
	pickup_date?: string | null;
	pickup_time?: string | null;
	items?: InvoiceItem[];
}

// ── Email ────────────────────────────────────────────────────

export interface EmailTemplate {
	id: string;
	slug: string;
	name: string;
	subject: string;
	body_html: string;
	body_text: string | null;
	variables: string | null;
	is_active: number;
	updated_at: string;
}

export interface EmailLog {
	id: string;
	template_id: string | null;
	recipient_email: string;
	recipient_name: string | null;
	subject: string;
	status: "sent" | "failed" | "bounced";
	related_type: "quote" | "booking" | "invoice" | null;
	related_id: string | null;
	has_attachment: number;
	error_message: string | null;
	sent_at: string | null;
	created_at: string;
}

// ── Settings ─────────────────────────────────────────────────

export interface CompanySetting {
	key: string;
	value: string;
	updated_at: string;
	updated_by: string | null;
}

// ── Activity Log ─────────────────────────────────────────────

export interface ActivityLog {
	id: string;
	user_id: string | null;
	action: string;
	entity_type: string;
	entity_id: string | null;
	details: string | null;
	created_at: string;
}
