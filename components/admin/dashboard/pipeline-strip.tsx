import Link from "next/link";
import type { BookingStatus } from "@/lib/schema";

const STAGES: { status: BookingStatus; label: string }[] = [
	{ status: "inquiry", label: "New / Inquiry" },
	{ status: "quote_sent", label: "Quote Sent" },
	{ status: "awaiting_confirmation", label: "Awaiting Confirmation" },
	{ status: "confirmed", label: "Confirmed" },
	{ status: "driver_assigned", label: "Driver Assigned" },
	{ status: "in_progress", label: "In Progress" },
	{ status: "completed", label: "Completed" },
];

interface PipelineStripProps {
	counts: Record<BookingStatus, number>;
	failed?: boolean;
}

/**
 * Booking funnel counts, each linking to the existing status-filtered
 * Bookings view (reuses getBookings()'s existing status filter — no new
 * filtering logic here).
 */
export function PipelineStrip({ counts, failed }: PipelineStripProps) {
	if (failed) {
		return (
			<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
				Pipeline counts couldn&apos;t be loaded — try refreshing.
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
			{STAGES.map((stage) => (
				<Link
					key={stage.status}
					href={`/admin/bookings?status=${stage.status}`}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						padding: "0.5rem 0.875rem",
						borderRadius: "var(--radius-md)",
						border: "1px solid var(--border-default)",
						background: "var(--bg-page)",
						textDecoration: "none",
						transition: "border-color var(--transition-fast)",
					}}
				>
					<span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
						{counts[stage.status] ?? 0}
					</span>
					<span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{stage.label}</span>
				</Link>
			))}
		</div>
	);
}
