"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateQuoteStatus, convertQuoteToBooking } from "@/lib/actions/quotes";
import { sendQuoteEmail } from "@/lib/actions/emails";
import type { QuoteStatus } from "@/lib/schema";

interface QuoteStatusActionsProps {
	quoteId: string;
	quoteNumber: string;
	currentStatus: QuoteStatus;
	customerEmail?: string | null;
	convertedBookingId?: string | null;
	convertedBookingNumber?: string | null;
}

export function QuoteStatusActions({
	quoteId,
	quoteNumber,
	currentStatus,
	customerEmail,
	convertedBookingId,
	convertedBookingNumber,
}: QuoteStatusActionsProps) {
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [emailLoading, setEmailLoading] = useState(false);
	const [convertLoading, setConvertLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	async function handleSendEmail() {
		if (!customerEmail) {
			setError("Customer does not have an email address specified.");
			return;
		}

		setEmailLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			const res = await sendQuoteEmail(quoteId);
			if (res.success) {
				setSuccessMsg(`Quotation ${quoteNumber} has been dispatched to ${customerEmail}.`);
				router.refresh();
			} else {
				setError(res.error || "Failed to dispatch email.");
			}
		} catch {
			setError("Unexpected error dispatching quote email.");
		} finally {
			setEmailLoading(false);
		}
	}

	async function handleStatusChange(newStatus: QuoteStatus) {
		setLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			const res = await updateQuoteStatus(quoteId, newStatus);
			if (!res.success) {
				setError(res.error || "Failed to update quote status.");
			} else {
				setSuccessMsg(`Quote marked as ${newStatus}.`);
				router.refresh();
			}
		} catch {
			setError("Failed to update status.");
		} finally {
			setLoading(false);
		}
	}

	async function handleConvert() {
		if (
			!confirm(
				`Convert Quote ${quoteNumber} to a live Confirmed Booking? This will copy all passenger, route, and pricing details.`
			)
		) {
			return;
		}

		setConvertLoading(true);
		setError(null);
		try {
			const res = await convertQuoteToBooking(quoteId);
			if (res.success && res.bookingId) {
				router.push(`/admin/bookings/${res.bookingId}`);
			} else {
				setError(res.error || "Failed to convert quote to booking.");
				setConvertLoading(false);
			}
		} catch {
			setError("Failed to convert quote to booking.");
			setConvertLoading(false);
		}
	}

	return (
		<div className="card" style={{ marginBottom: "1.5rem" }}>
			<div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
				<div>
					<h3 className="card-title" style={{ margin: 0 }}>Quote Operations & Lifecycle</h3>
					<p className="card-subtitle" style={{ margin: "0.25rem 0 0" }}>
						Transition status or convert directly into a confirmed operational booking.
					</p>
				</div>

				{convertedBookingId && (
					<Link
						href={`/admin/bookings/${convertedBookingId}`}
						className="btn btn-secondary btn-sm"
						style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
					>
						<span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }}></span>
						View Live Booking: {convertedBookingNumber || "Booking"}
					</Link>
				)}
			</div>

			<div className="card-body">
				{error && (
					<div className="alert alert-danger" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "0.875rem" }}>
						{error}
					</div>
				)}

				{successMsg && (
					<div className="alert alert-success" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "6px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22c55e", fontSize: "0.875rem" }}>
						{successMsg}
					</div>
				)}

				<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
					{/* Primary Conversion Action */}
					{!convertedBookingId ? (
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleConvert}
							disabled={convertLoading || loading}
							style={{
								boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
								fontWeight: 600,
							}}
						>
							{convertLoading ? (
								"Converting to Booking..."
							) : (
								<>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.375rem", verticalAlign: "middle" }}>
										<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
										<circle cx="7" cy="17" r="2"></circle>
										<path d="M9 17h6"></path>
										<circle cx="17" cy="17" r="2"></circle>
									</svg>
									Convert to Confirmed Booking
								</>
							)}
						</button>
					) : (
						<div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "6px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#22c55e", fontSize: "0.875rem" }}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
							Converted to Booking <strong>{convertedBookingNumber}</strong>
						</div>
					)}

					<div style={{ width: "1px", height: "24px", background: "var(--border-color)", margin: "0 0.25rem" }}></div>

					{/* Email Quote Button */}
					<button
						type="button"
						className="btn btn-secondary btn-sm"
						onClick={handleSendEmail}
						disabled={emailLoading || loading || convertLoading}
						style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
						title={customerEmail ? `Send proposal to ${customerEmail}` : "No customer email"}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
							<polyline points="22,6 12,13 2,6"></polyline>
						</svg>
						{emailLoading ? "Dispatching..." : "Email to Client"}
					</button>

					{/* Print / PDF Button */}
					<Link
						href={`/admin/quotes/${quoteId}/print`}
						target="_blank"
						className="btn btn-secondary btn-sm"
						style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<polyline points="6 9 6 2 18 2 18 9"></polyline>
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
							<rect x="6" y="14" width="12" height="8"></rect>
						</svg>
						Print / PDF
					</Link>

					<div style={{ width: "1px", height: "24px", background: "var(--border-color)", margin: "0 0.25rem" }}></div>

					{/* Lifecycle Transition Buttons */}
					{currentStatus === "draft" && (
						<button
							type="button"
							className="btn btn-secondary btn-sm"
							onClick={() => handleStatusChange("sent")}
							disabled={loading || convertLoading || emailLoading}
						>
							Mark as Sent
						</button>
					)}

					{(currentStatus === "draft" || currentStatus === "sent" || currentStatus === "viewed") && (
						<button
							type="button"
							className="btn btn-secondary btn-sm"
							onClick={() => handleStatusChange("accepted")}
							disabled={loading || convertLoading || emailLoading}
						>
							Mark as Accepted
						</button>
					)}

					{currentStatus !== "rejected" && currentStatus !== "cancelled" && (
						<button
							type="button"
							className="btn btn-secondary btn-sm"
							onClick={() => handleStatusChange("rejected")}
							disabled={loading || convertLoading || emailLoading}
							style={{ color: "#ef4444" }}
						>
							Decline
						</button>
					)}

					{currentStatus !== "cancelled" && (
						<button
							type="button"
							className="btn btn-secondary btn-sm"
							onClick={() => handleStatusChange("cancelled")}
							disabled={loading || convertLoading || emailLoading}
							style={{ color: "var(--text-muted)" }}
						>
							Cancel Quote
						</button>
					)}

					<Link
						href={`/admin/quotes/${quoteId}/edit`}
						className="btn btn-secondary btn-sm"
						style={{ marginLeft: "auto" }}
					>
						Edit Details
					</Link>
				</div>
			</div>
		</div>
	);
}
