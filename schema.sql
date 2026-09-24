-- ============================================================
-- Greece Chauffeur Service — D1 Schema Migration
-- ============================================================
-- Run with: wrangler d1 execute greece-chauffer-transfers-db --file=./schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- USERS & SESSIONS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	name TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'dispatcher', 'finance')),
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ────────────────────────────────────────────────────────────
-- CUSTOMERS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT,
	phone TEXT,
	customer_type TEXT NOT NULL DEFAULT 'individual' CHECK (customer_type IN ('individual', 'corporate', 'agency', 'other')),
	company_name TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
-- QUOTES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quotes (
	id TEXT PRIMARY KEY,
	quote_number TEXT NOT NULL UNIQUE,
	customer_id TEXT NOT NULL REFERENCES customers(id),
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled')),
	pickup_location TEXT,
	dropoff_location TEXT,
	pickup_date TEXT,
	pickup_time TEXT,
	return_date TEXT,
	return_time TEXT,
	trip_type TEXT CHECK (trip_type IN ('one_way', 'round_trip', 'hourly', 'airport_transfer', 'intercity')),
	vehicle_category TEXT,
	vehicle_id TEXT REFERENCES vehicles(id),
	passenger_count INTEGER DEFAULT 1,
	luggage_info TEXT,
	flight_number TEXT,
	airline TEXT,
	additional_stops TEXT,
	special_requests TEXT,
	subtotal REAL DEFAULT 0,
	discount_amount REAL DEFAULT 0,
	discount_type TEXT CHECK (discount_type IN ('fixed', 'percentage')),
	tax_amount REAL DEFAULT 0,
	total REAL DEFAULT 0,
	notes TEXT,
	internal_notes TEXT,
	valid_until TEXT,
	created_by TEXT REFERENCES users(id),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

CREATE TABLE IF NOT EXISTS quote_items (
	id TEXT PRIMARY KEY,
	quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
	description TEXT NOT NULL,
	quantity INTEGER NOT NULL DEFAULT 1,
	unit_price REAL NOT NULL DEFAULT 0,
	total REAL NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- BOOKINGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
	id TEXT PRIMARY KEY,
	booking_number TEXT NOT NULL UNIQUE,
	quote_id TEXT REFERENCES quotes(id),
	customer_id TEXT NOT NULL REFERENCES customers(id),
	status TEXT NOT NULL DEFAULT 'inquiry' CHECK (status IN (
		'inquiry', 'quote_sent', 'awaiting_confirmation', 'confirmed',
		'driver_assigned', 'driver_confirmed', 'in_progress',
		'completed', 'cancelled', 'declined', 'no_show'
	)),
	payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
		'pending', 'partially_paid', 'paid', 'refunded', 'failed'
	)),
	pickup_location TEXT,
	dropoff_location TEXT,
	pickup_date TEXT,
	pickup_time TEXT,
	return_date TEXT,
	return_time TEXT,
	trip_type TEXT CHECK (trip_type IN ('one_way', 'round_trip', 'hourly', 'airport_transfer', 'intercity')),
	vehicle_category TEXT,
	vehicle_id TEXT REFERENCES vehicles(id),
	driver_id TEXT REFERENCES drivers(id),
	passenger_count INTEGER DEFAULT 1,
	luggage_info TEXT,
	flight_number TEXT,
	airline TEXT,
	flight_type TEXT CHECK (flight_type IN ('arrival', 'departure')),
	additional_stops TEXT,
	waiting_requirements TEXT,
	special_requests TEXT,
	price REAL DEFAULT 0,
	discount_amount REAL DEFAULT 0,
	tax_amount REAL DEFAULT 0,
	total REAL DEFAULT 0,
	customer_notes TEXT,
	internal_notes TEXT,
	booking_source TEXT DEFAULT 'admin' CHECK (booking_source IN ('admin', 'website', 'phone', 'email', 'agency', 'other')),
	created_by TEXT REFERENCES users(id),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);

CREATE TABLE IF NOT EXISTS booking_status_history (
	id TEXT PRIMARY KEY,
	booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
	from_status TEXT,
	to_status TEXT NOT NULL,
	changed_by TEXT REFERENCES users(id),
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON booking_status_history(booking_id);

-- ────────────────────────────────────────────────────────────
-- DRIVERS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drivers (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT,
	phone TEXT,
	address TEXT,
	license_number TEXT,
	license_expiry TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
		'pending', 'documents_submitted', 'under_review',
		'approved', 'active', 'suspended', 'inactive'
	)),
	driver_type TEXT NOT NULL DEFAULT 'company' CHECK (driver_type IN ('company', 'partner')),
	emergency_contact_name TEXT,
	emergency_contact_phone TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

CREATE TABLE IF NOT EXISTS driver_documents (
	id TEXT PRIMARY KEY,
	driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
	document_type TEXT NOT NULL CHECK (document_type IN ('license', 'id', 'insurance', 'vehicle_doc', 'other')),
	file_name TEXT NOT NULL,
	file_key TEXT NOT NULL,
	file_size INTEGER,
	mime_type TEXT,
	issue_date TEXT,
	expiry_date TEXT,
	verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
	verified_by TEXT REFERENCES users(id),
	verified_at TEXT,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry ON driver_documents(expiry_date);

-- ────────────────────────────────────────────────────────────
-- VEHICLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
	id TEXT PRIMARY KEY,
	make TEXT NOT NULL,
	model TEXT NOT NULL,
	year INTEGER,
	category TEXT NOT NULL DEFAULT 'sedan' CHECK (category IN ('sedan', 'suv', 'van', 'minibus', 'luxury', 'other')),
	registration TEXT,
	passenger_capacity INTEGER DEFAULT 4,
	luggage_capacity INTEGER DEFAULT 2,
	owner_type TEXT NOT NULL DEFAULT 'company' CHECK (owner_type IN ('company', 'partner')),
	status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'unavailable', 'maintenance', 'inactive')),
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);

CREATE TABLE IF NOT EXISTS vehicle_documents (
	id TEXT PRIMARY KEY,
	vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
	document_type TEXT NOT NULL,
	file_name TEXT NOT NULL,
	file_key TEXT NOT NULL,
	file_size INTEGER,
	mime_type TEXT,
	issue_date TEXT,
	expiry_date TEXT,
	verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id);

-- ────────────────────────────────────────────────────────────
-- ROUTES & PRICING
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS routes (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	origin TEXT NOT NULL,
	destination TEXT NOT NULL,
	distance_km REAL,
	estimated_duration_min INTEGER,
	is_active INTEGER NOT NULL DEFAULT 1,
	notes TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pricing_rules (
	id TEXT PRIMARY KEY,
	route_id TEXT REFERENCES routes(id),
	vehicle_category TEXT,
	trip_type TEXT,
	base_price REAL NOT NULL DEFAULT 0,
	per_km_price REAL,
	per_hour_price REAL,
	extra_stop_charge REAL DEFAULT 0,
	waiting_charge_per_hour REAL DEFAULT 0,
	is_active INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────────────────
-- PAYMENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
	id TEXT PRIMARY KEY,
	booking_id TEXT NOT NULL REFERENCES bookings(id),
	customer_id TEXT NOT NULL REFERENCES customers(id),
	amount REAL NOT NULL,
	currency TEXT NOT NULL DEFAULT 'EUR',
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
	method TEXT CHECK (method IN ('cash', 'card', 'bank_transfer', 'online', 'other')),
	reference TEXT,
	payment_date TEXT,
	notes TEXT,
	created_by TEXT REFERENCES users(id),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ────────────────────────────────────────────────────────────
-- INVOICES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
	id TEXT PRIMARY KEY,
	invoice_number TEXT NOT NULL UNIQUE,
	booking_id TEXT REFERENCES bookings(id),
	customer_id TEXT NOT NULL REFERENCES customers(id),
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
	subtotal REAL DEFAULT 0,
	discount_amount REAL DEFAULT 0,
	tax_amount REAL DEFAULT 0,
	total REAL DEFAULT 0,
	due_date TEXT,
	paid_date TEXT,
	notes TEXT,
	created_by TEXT REFERENCES users(id),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
	id TEXT PRIMARY KEY,
	invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
	description TEXT NOT NULL,
	quantity INTEGER NOT NULL DEFAULT 1,
	unit_price REAL NOT NULL DEFAULT 0,
	total REAL NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- EMAIL SYSTEM
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_templates (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	subject TEXT NOT NULL,
	body_html TEXT NOT NULL,
	body_text TEXT,
	variables TEXT,
	is_active INTEGER NOT NULL DEFAULT 1,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_logs (
	id TEXT PRIMARY KEY,
	template_id TEXT REFERENCES email_templates(id),
	recipient_email TEXT NOT NULL,
	recipient_name TEXT,
	subject TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
	related_type TEXT CHECK (related_type IN ('quote', 'booking', 'invoice')),
	related_id TEXT,
	has_attachment INTEGER DEFAULT 0,
	error_message TEXT,
	sent_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_logs_related ON email_logs(related_type, related_id);

-- ────────────────────────────────────────────────────────────
-- SETTINGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_by TEXT REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────
-- ACTIVITY LOG
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_logs (
	id TEXT PRIMARY KEY,
	user_id TEXT REFERENCES users(id),
	action TEXT NOT NULL,
	entity_type TEXT NOT NULL,
	entity_id TEXT,
	details TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ────────────────────────────────────────────────────────────
-- SEED DEFAULT SETTINGS
-- ────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO company_settings (key, value) VALUES
	('company_name', '"Greece Chauffeur Service"'),
	('company_email', '"info@greecechauffeur.com"'),
	('company_phone', '""'),
	('company_address', '""'),
	('default_currency', '"EUR"'),
	('tax_rate', '0'),
	('quote_validity_days', '7'),
	('booking_terms', '""'),
	('invoice_terms', '""');

-- ────────────────────────────────────────────────────────────
-- SEED DEFAULT SUPER ADMIN
-- ────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status) VALUES
	('01M35CHGGF2WM0YE73TTGCY3C0', 'admin@greecechauffeur.com', 'd71efd2b7dc7f1947ab56806435d91fb:59ffe6149c7b44010ddff75904bd8195c7f9a2d609b540cc621630b70a602787', 'Admin', 'super_admin', 'active');

-- ────────────────────────────────────────────────────────────
-- REMOVE OLD TEST TABLE
-- ────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS connection_test;
