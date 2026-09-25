// ============================================================
// Greece Chauffeur Service — Utility Functions
// ============================================================

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
 * Uses crypto.getRandomValues which is available on Cloudflare Workers.
 * Format: 10-char timestamp (base32) + 16-char random (base32) = 26 chars.
 */
export function generateId(): string {
	const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
	const TIME_LEN = 10;
	const RANDOM_LEN = 16;

	let now = Date.now();
	let id = "";

	// Encode timestamp (48-bit, millisecond precision)
	for (let i = TIME_LEN - 1; i >= 0; i--) {
		id = ENCODING[now & 0x1f] + id;
		now = Math.floor(now / 32);
	}

	// Encode random bytes
	const random = new Uint8Array(RANDOM_LEN);
	crypto.getRandomValues(random);
	for (let i = 0; i < RANDOM_LEN; i++) {
		id += ENCODING[random[i] & 0x1f];
	}

	return id;
}

/**
 * Generate a sequential number with prefix.
 * e.g., generateSequentialNumber("GCS-Q", 2026, 1) → "GCS-Q-2026-0001"
 */
export function formatSequentialNumber(
	prefix: string,
	year: number,
	sequence: number
): string {
	return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Get the current year.
 */
export function currentYear(): number {
	return new Date().getFullYear();
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "—";
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
}

/**
 * Format a date and time string.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
	if (!dateStr) return "—";
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return dateStr;
	}
}

/**
 * Format a time string (HH:mm).
 */
export function formatTime(timeStr: string | null | undefined): string {
	if (!timeStr) return "—";
	return timeStr;
}

/**
 * Format currency amount.
 */
export function formatCurrency(
	amount: number | null | undefined,
	currency = "EUR"
): string {
	if (amount == null) return "—";
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
	}).format(amount);
}

/**
 * Get ISO datetime string for "now".
 */
export function nowISO(): string {
	return new Date().toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Calculate days until a date.
 */
export function daysUntil(dateStr: string): number {
	const target = new Date(dateStr);
	const now = new Date();
	const diff = target.getTime() - now.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is in the past.
 */
export function isPast(dateStr: string): boolean {
	return new Date(dateStr) < new Date();
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayDate(): string {
	return new Date().toISOString().substring(0, 10);
}

/**
 * The timezone the business actually operates in. SQLite's date('now') and
 * Date.toISOString() are both UTC, which drifts from Greek local time by
 * 2-3 hours depending on DST — enough to put a late-night or early-morning
 * pickup on the wrong "today". Dashboard date calculations should compute
 * the operational date here in JS (Intl handles the DST transition) rather
 * than relying on SQLite's UTC date functions.
 */
export const OPERATIONAL_TIMEZONE = "Europe/Athens";

/**
 * Get a YYYY-MM-DD date string for "today" (or N days from today) in the
 * business's operational timezone, suitable for binding directly against
 * TEXT date columns like bookings.pickup_date.
 */
export function operationalDate(offsetDays = 0): string {
	const base = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: OPERATIONAL_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(base);
	const y = parts.find((p) => p.type === "year")?.value ?? "1970";
	const m = parts.find((p) => p.type === "month")?.value ?? "01";
	const d = parts.find((p) => p.type === "day")?.value ?? "01";
	return `${y}-${m}-${d}`;
}

/**
 * Simple pagination helper.
 */
export interface PaginationParams {
	page: number;
	perPage: number;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export function getPaginationOffset(params: PaginationParams): number {
	return (params.page - 1) * params.perPage;
}

export function buildPaginatedResult<T>(
	data: T[],
	total: number,
	params: PaginationParams
): PaginatedResult<T> {
	return {
		data,
		total,
		page: params.page,
		perPage: params.perPage,
		totalPages: Math.ceil(total / params.perPage),
	};
}

/**
 * Sanitize and trim string input.
 */
export function sanitize(value: string | null | undefined): string {
	if (!value) return "";
	return value.trim();
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmpty(value: string | null | undefined): boolean {
	return typeof value === "string" && value.trim().length > 0;
}
