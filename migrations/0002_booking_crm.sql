-- ============================================================
-- 0002 — Booking inquiry CRM, quotation versioning, email outbox
-- Additive only: no existing table is dropped or rewritten.
-- ============================================================

-- Concurrency-safe sequences (booking references, etc.)
CREATE TABLE IF NOT EXISTS counters (
	name TEXT NOT NULL,
	year INTEGER NOT NULL,
	value INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (name, year)
);

-- Fixed-window rate limiter (public forms, login)
CREATE TABLE IF NOT EXISTS rate_limits (
	key TEXT NOT NULL,
	window_start INTEGER NOT NULL,
	count INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (key, window_start)
);

CREATE TABLE IF NOT EXISTS inquiries (
	id TEXT PRIMARY KEY,
	reference TEXT NOT NULL UNIQUE,
	idempotency_key TEXT UNIQUE,
	customer_id TEXT NOT NULL REFERENCES customers(id),
	service_type TEXT NOT NULL,
	pickup_location TEXT NOT NULL,
	destination TEXT,
	pickup_date TEXT NOT NULL,
	pickup_time TEXT,
	return_date TEXT,
	return_time TEXT,
	adults INTEGER NOT NULL DEFAULT 1,
	children INTEGER NOT NULL DEFAULT 0,
	luggage TEXT,
	vehicle_preference TEXT,
	details_json TEXT,
	customer_notes TEXT,
	source_page TEXT,
	utm_json TEXT,
	consent_at TEXT,
	status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
		'new', 'reviewing', 'awaiting_info', 'preparing_quote', 'quote_sent',
		'accepted', 'confirmed', 'completed', 'lost', 'cancelled'
	)),
	assigned_to TEXT REFERENCES users(id),
	internal_notes TEXT,
	lost_reason TEXT,
	last_contact_at TEXT,
	next_followup_at TEXT,
	followup_note TEXT,
	archived_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer ON inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_followup ON inquiries(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);

-- Communication + audit timeline for an inquiry
CREATE TABLE IF NOT EXISTS inquiry_events (
	id TEXT PRIMARY KEY,
	inquiry_id TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
	quote_id TEXT,
	type TEXT NOT NULL,
	message TEXT NOT NULL,
	meta_json TEXT,
	actor_id TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiry_events_inquiry ON inquiry_events(inquiry_id, created_at);

-- Durable outbound email queue (outbox). Saved BEFORE any send attempt.
CREATE TABLE IF NOT EXISTS email_outbox (
	id TEXT PRIMARY KEY,
	category TEXT NOT NULL,
	dedupe_key TEXT UNIQUE,
	to_email TEXT NOT NULL,
	to_name TEXT,
	reply_to TEXT,
	subject TEXT NOT NULL,
	html TEXT NOT NULL,
	text_body TEXT,
	attach_quote_id TEXT,
	inquiry_id TEXT,
	quote_id TEXT,
	booking_id TEXT,
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'dead', 'cancelled')),
	attempts INTEGER NOT NULL DEFAULT 0,
	max_attempts INTEGER NOT NULL DEFAULT 5,
	next_attempt_at TEXT NOT NULL DEFAULT (datetime('now')),
	locked_until TEXT,
	last_error TEXT,
	provider_message_id TEXT,
	provider_status TEXT,
	provider_status_at TEXT,
	sent_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON email_outbox(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_outbox_inquiry ON email_outbox(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_outbox_provider ON email_outbox(provider_message_id);

-- Quotation versioning + commercial fields (existing rows keep working)
ALTER TABLE quotes ADD COLUMN inquiry_id TEXT;
ALTER TABLE quotes ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quotes ADD COLUMN root_quote_id TEXT;
ALTER TABLE quotes ADD COLUMN superseded_by_id TEXT;
ALTER TABLE quotes ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE quotes ADD COLUMN journey_description TEXT;
ALTER TABLE quotes ADD COLUMN inclusions TEXT;
ALTER TABLE quotes ADD COLUMN exclusions TEXT;
ALTER TABLE quotes ADD COLUMN payment_terms TEXT;
ALTER TABLE quotes ADD COLUMN cancellation_terms TEXT;
ALTER TABLE quotes ADD COLUMN fees_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN snapshot_json TEXT;
ALTER TABLE quotes ADD COLUMN sent_at TEXT;
ALTER TABLE quotes ADD COLUMN accepted_at TEXT;
ALTER TABLE quotes ADD COLUMN accepted_via TEXT;
ALTER TABLE quotes ADD COLUMN rejected_at TEXT;
ALTER TABLE quotes ADD COLUMN accept_token_hash TEXT;
ALTER TABLE quotes ADD COLUMN accept_token_expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_quotes_inquiry ON quotes(inquiry_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_token ON quotes(accept_token_hash) WHERE accept_token_hash IS NOT NULL;

-- A quotation can create at most one booking
ALTER TABLE bookings ADD COLUMN inquiry_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_quote_unique ON bookings(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_inquiry ON bookings(inquiry_id);

-- Customers: structured name parts + contact preference
ALTER TABLE customers ADD COLUMN first_name TEXT;
ALTER TABLE customers ADD COLUMN last_name TEXT;
ALTER TABLE customers ADD COLUMN preferred_contact TEXT;

-- Discount/tax inputs kept so a quotation can be re-edited exactly
ALTER TABLE quotes ADD COLUMN discount_value REAL;
ALTER TABLE quotes ADD COLUMN tax_percent REAL NOT NULL DEFAULT 0;
