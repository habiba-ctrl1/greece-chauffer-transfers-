// ============================================================
// Greece Chauffeur Service — Constants & Status Enums
// ============================================================

// ── Booking ──────────────────────────────────────────────────

export const BOOKING_STATUSES = [
	"inquiry",
	"quote_sent",
	"awaiting_confirmation",
	"confirmed",
	"driver_assigned",
	"driver_confirmed",
	"in_progress",
	"completed",
	"cancelled",
	"declined",
	"no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
	inquiry: "Inquiry",
	quote_sent: "Quote Sent",
	awaiting_confirmation: "Awaiting Confirmation",
	confirmed: "Confirmed",
	driver_assigned: "Driver Assigned",
	driver_confirmed: "Driver Confirmed",
	in_progress: "In Progress",
	completed: "Completed",
	cancelled: "Cancelled",
	declined: "Declined",
	no_show: "No Show",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
	inquiry: "var(--status-info)",
	quote_sent: "var(--status-info)",
	awaiting_confirmation: "var(--status-warning)",
	confirmed: "var(--status-success)",
	driver_assigned: "var(--status-success)",
	driver_confirmed: "var(--status-success)",
	in_progress: "var(--status-active)",
	completed: "var(--status-complete)",
	cancelled: "var(--status-danger)",
	declined: "var(--status-danger)",
	no_show: "var(--status-danger)",
};

export const BOOKING_STATUS_BADGES: Record<BookingStatus, string> = {
	inquiry: "badge-info",
	quote_sent: "badge-info",
	awaiting_confirmation: "badge-warning",
	confirmed: "badge-success",
	driver_assigned: "badge-success",
	driver_confirmed: "badge-success",
	in_progress: "badge-info",
	completed: "badge-success",
	cancelled: "badge-danger",
	declined: "badge-danger",
	no_show: "badge-danger",
};

// ── Payment ──────────────────────────────────────────────────

export const PAYMENT_STATUSES = [
	"pending",
	"partially_paid",
	"paid",
	"refunded",
	"failed",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
	pending: "Pending",
	partially_paid: "Partially Paid",
	paid: "Paid",
	refunded: "Refunded",
	failed: "Failed",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
	pending: "var(--status-warning)",
	partially_paid: "var(--status-info)",
	paid: "var(--status-success)",
	refunded: "var(--status-info)",
	failed: "var(--status-danger)",
};

export const PAYMENT_STATUS_BADGES: Record<PaymentStatus, string> = {
	pending: "badge-warning",
	partially_paid: "badge-info",
	paid: "badge-success",
	refunded: "badge-info",
	failed: "badge-danger",
};

// ── Quote ────────────────────────────────────────────────────

export const QUOTE_STATUSES = [
	"draft",
	"sent",
	"viewed",
	"accepted",
	"rejected",
	"expired",
	"cancelled",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
	draft: "Draft",
	sent: "Sent",
	viewed: "Viewed",
	accepted: "Accepted",
	rejected: "Rejected",
	expired: "Expired",
	cancelled: "Cancelled",
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
	draft: "var(--status-neutral)",
	sent: "var(--status-info)",
	viewed: "var(--status-info)",
	accepted: "var(--status-success)",
	rejected: "var(--status-danger)",
	expired: "var(--status-warning)",
	cancelled: "var(--status-danger)",
};

export const QUOTE_STATUS_BADGES: Record<QuoteStatus, string> = {
	draft: "badge-neutral",
	sent: "badge-info",
	viewed: "badge-info",
	accepted: "badge-success",
	rejected: "badge-danger",
	expired: "badge-warning",
	cancelled: "badge-danger",
};

// ── Driver ───────────────────────────────────────────────────

export const DRIVER_STATUSES = [
	"pending",
	"documents_submitted",
	"under_review",
	"approved",
	"active",
	"suspended",
	"inactive",
] as const;

export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
	pending: "Pending",
	documents_submitted: "Documents Submitted",
	under_review: "Under Review",
	approved: "Approved",
	active: "Active",
	suspended: "Suspended",
	inactive: "Inactive",
};

export const DRIVER_STATUS_BADGES: Record<DriverStatus, string> = {
	pending: "badge-neutral",
	documents_submitted: "badge-info",
	under_review: "badge-warning",
	approved: "badge-info",
	active: "badge-success",
	suspended: "badge-danger",
	inactive: "badge-neutral",
};

// ── Vehicle ──────────────────────────────────────────────────

export const VEHICLE_STATUSES = [
	"available",
	"assigned",
	"unavailable",
	"maintenance",
	"inactive",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
	available: "Available",
	assigned: "Assigned",
	unavailable: "Unavailable",
	maintenance: "Maintenance",
	inactive: "Inactive",
};

export const VEHICLE_CATEGORIES = [
	"sedan",
	"suv",
	"van",
	"minibus",
	"luxury",
	"other",
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
	sedan: "Sedan",
	suv: "SUV",
	van: "Van",
	minibus: "Minibus",
	luxury: "Luxury",
	other: "Other",
};

// ── Trip Type ────────────────────────────────────────────────

export const TRIP_TYPES = [
	"one_way",
	"round_trip",
	"hourly",
	"airport_transfer",
	"intercity",
] as const;

export type TripType = (typeof TRIP_TYPES)[number];

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
	one_way: "One Way",
	round_trip: "Round Trip",
	hourly: "Hourly Chauffeur",
	airport_transfer: "Airport Transfer",
	intercity: "Intercity Transfer",
};

// ── Customer Type ────────────────────────────────────────────

export const CUSTOMER_TYPES = [
	"individual",
	"corporate",
	"agency",
	"other",
] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
	individual: "Individual",
	corporate: "Corporate",
	agency: "Travel / Agency",
	other: "Other",
};

// ── Booking Source ───────────────────────────────────────────

export const BOOKING_SOURCES = [
	"admin",
	"website",
	"phone",
	"email",
	"agency",
	"other",
] as const;

export type BookingSource = (typeof BOOKING_SOURCES)[number];

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
	admin: "Admin Panel",
	website: "Website",
	phone: "Phone",
	email: "Email",
	agency: "Agency",
	other: "Other",
};

// ── User Roles ───────────────────────────────────────────────

export const USER_ROLES = [
	"super_admin",
	"admin",
	"dispatcher",
	"finance",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
	super_admin: "Super Admin",
	admin: "Admin / Operations",
	dispatcher: "Dispatcher",
	finance: "Finance",
};

// ── Document Verification ────────────────────────────────────

export const VERIFICATION_STATUSES = [
	"pending",
	"approved",
	"rejected",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

// ── Invoice ──────────────────────────────────────────────────

export const INVOICE_STATUSES = [
	"draft",
	"sent",
	"paid",
	"overdue",
	"cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ── Payment Methods ──────────────────────────────────────────

export const PAYMENT_METHODS = [
	"cash",
	"card",
	"bank_transfer",
	"online",
	"other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	cash: "Cash",
	card: "Card",
	bank_transfer: "Bank Transfer",
	online: "Online",
	other: "Other",
};
