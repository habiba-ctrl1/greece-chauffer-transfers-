"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateBookingStatus, assignBookingDriverAndVehicle } from "@/lib/actions/bookings";
import { createQuoteFromBooking } from "@/lib/actions/quotes";
import { sendQuoteEmail } from "@/lib/actions/emails";
import { createInvoiceFromBooking, sendInvoiceEmail } from "@/lib/actions/invoices";
import type { BookingStatus, Driver, Vehicle } from "@/lib/schema";

interface BookingStatusActionsProps {
	bookingId: string;
	currentStatus: BookingStatus;
	currentDriverId: string | null;
	currentVehicleId: string | null;
	drivers: Driver[];
	vehicles: Vehicle[];
	quoteId?: string | null;
	quoteNumber?: string | null;
	customerEmail?: string | null;
	invoiceId?: string | null;
	invoiceNumber?: string | null;
}

export function BookingStatusActions({
	bookingId,
	currentStatus,
	currentDriverId,
	currentVehicleId,
	drivers,
	vehicles,
	quoteId,
	quoteNumber,
	customerEmail,
	invoiceId,
	invoiceNumber,
}: BookingStatusActionsProps) {
	const router = useRouter();

	const [statusLoading, setStatusLoading] = useState(false);
	const [assignLoading, setAssignLoading] = useState(false);
	const [quoteActionLoading, setQuoteActionLoading] = useState(false);
	const [invoiceActionLoading, setInvoiceActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const [selectedDriver, setSelectedDriver] = useState(currentDriverId || "");
	const [selectedVehicle, setSelectedVehicle] = useState(currentVehicleId || "");

	async function handleStatusChange(newStatus: BookingStatus) {
		setStatusLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			const res = await updateBookingStatus(bookingId, newStatus);
			if (!res.success) {
				setError(res.error || "Failed to update status.");
			} else {
				// If completed, automatically generate invoice
				if (newStatus === "completed" && !invoiceId) {
					const invRes = await createInvoiceFromBooking(bookingId);
					if (invRes.success && invRes.invoiceNumber) {
						setSuccessMsg(`Trip completed! Generated official Invoice ${invRes.invoiceNumber}.`);
					}
				}
				router.refresh();
			}
		} catch {
			setError("Failed to update status.");
		} finally {
			setStatusLoading(false);
		}
	}

	async function handleGenerateAndSendQuote() {
		setQuoteActionLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			// 1. Create or get quote
			const qRes = await createQuoteFromBooking(bookingId);
			if (!qRes.success || !qRes.quoteId) {
				setError(qRes.error || "Failed to generate quotation from booking.");
				setQuoteActionLoading(false);
				return;
			}

			// 2. Email quote to customer if email exists
			if (customerEmail) {
				await sendQuoteEmail(qRes.quoteId);
				setSuccessMsg(`Quotation ${qRes.quoteNumber} created and emailed to ${customerEmail}.`);
			} else {
				setSuccessMsg(`Quotation ${qRes.quoteNumber} generated. (No client email on file to send).`);
			}
			router.refresh();
		} catch {
			setError("Unexpected error generating quote.");
		} finally {
			setQuoteActionLoading(false);
		}
	}

	async function handleGenerateAndSendInvoice() {
		setInvoiceActionLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			// 1. Create invoice
			const invRes = await createInvoiceFromBooking(bookingId);
			if (!invRes.success || !invRes.invoiceId) {
				setError(invRes.error || "Failed to generate invoice.");
				setInvoiceActionLoading(false);
				return;
			}

			// 2. Email invoice to customer if email exists
			if (customerEmail) {
				await sendInvoiceEmail(invRes.invoiceId);
				setSuccessMsg(`Invoice ${invRes.invoiceNumber} generated and emailed to ${customerEmail}.`);
			} else {
				setSuccessMsg(`Invoice ${invRes.invoiceNumber} generated.`);
			}
			router.refresh();
		} catch {
			setError("Unexpected error generating invoice.");
		} finally {
			setInvoiceActionLoading(false);
		}
	}


	async function handleSaveAssignment(e: React.FormEvent) {
		e.preventDefault();
		setAssignLoading(true);
		setError(null);
		try {
			const res = await assignBookingDriverAndVehicle(
				bookingId,
				selectedDriver || null,
				selectedVehicle || null
			);
			if (!res.success) {
				setError(res.error || "Failed to assign driver/vehicle.");
			} else {
				router.refresh();
			}
		} catch {
			setError("Failed to assign driver/vehicle.");
		} finally {
			setAssignLoading(false);
		}
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
			{error && (
				<div className="login-error" role="alert">
					{error}
				</div>
			)}

			{successMsg && (
				<div
					style={{
						padding: "0.75rem 1rem",
						background: "var(--brand-50, #f0fdf4)",
						border: "1px solid var(--brand-200, #bbf7d0)",
						borderRadius: "var(--radius-sm)",
						color: "var(--brand-800, #166534)",
						fontSize: "0.8125rem",
						fontWeight: 500,
					}}
				>
					✓ {successMsg}
				</div>
			)}

			{/* Quotation & Invoice Lifecycle */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">📋 Quotation & Invoice</h2>
				</div>
				<div className="card-body">
					<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
						{/* Quote Section */}
						{quoteId ? (
							<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
								<span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>Quote Issued</span>
								<Link
									href={`/admin/quotes/${quoteId}`}
									style={{ color: "var(--brand-600)", fontSize: "0.8125rem", fontWeight: 600 }}
								>
									{quoteNumber} →
								</Link>
								<Link
									href={`/admin/quotes/${quoteId}/print`}
									target="_blank"
									className="btn btn-secondary btn-sm"
									style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}
								>
									🖨️ Print Quote
								</Link>
							</div>
						) : (
							<button
								type="button"
								onClick={handleGenerateAndSendQuote}
								className="btn btn-secondary btn-sm"
								disabled={quoteActionLoading}
							>
								{quoteActionLoading ? "Generating Quote..." : "📋 Generate & Send Quote"}
							</button>
						)}

						{/* Invoice Section */}
						<div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "0.75rem" }}>
							{invoiceId ? (
								<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
									<span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>Invoice Issued</span>
									<Link
										href={`/admin/invoices/${invoiceId}`}
										style={{ color: "var(--brand-600)", fontSize: "0.8125rem", fontWeight: 600 }}
									>
										{invoiceNumber} →
									</Link>
									<Link
										href={`/admin/invoices/${invoiceId}/print`}
										target="_blank"
										className="btn btn-secondary btn-sm"
										style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}
									>
										🖨️ Print Invoice
									</Link>
								</div>
							) : (
								<button
									type="button"
									onClick={handleGenerateAndSendInvoice}
									className="btn btn-secondary btn-sm"
									disabled={invoiceActionLoading || currentStatus === "inquiry" || currentStatus === "cancelled"}
								>
									{invoiceActionLoading ? "Generating Invoice..." : "🧾 Generate & Send Invoice"}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Status Lifecycle Actions */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">Dispatch Status Actions</h2>
				</div>
				<div className="card-body">
					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
						{currentStatus === "inquiry" && (
							<button
								type="button"
								onClick={() => handleStatusChange("confirmed")}
								className="btn btn-primary btn-sm"
								disabled={statusLoading}
							>
								✓ Confirm Booking
							</button>
						)}

						{currentStatus === "awaiting_confirmation" && (
							<button
								type="button"
								onClick={() => handleStatusChange("confirmed")}
								className="btn btn-primary btn-sm"
								disabled={statusLoading}
							>
								✓ Confirm Booking
							</button>
						)}

						{(currentStatus === "confirmed" || currentStatus === "driver_assigned") && (
							<button
								type="button"
								onClick={() => handleStatusChange("driver_confirmed")}
								className="btn btn-secondary btn-sm"
								disabled={statusLoading}
							>
								Chauffeur Accepted Trip
							</button>
						)}

						{(currentStatus === "confirmed" ||
							currentStatus === "driver_assigned" ||
							currentStatus === "driver_confirmed") && (
							<button
								type="button"
								onClick={() => handleStatusChange("in_progress")}
								className="btn btn-secondary btn-sm"
								style={{ color: "var(--brand-700)" }}
								disabled={statusLoading}
							>
								🚗 Start Trip (In Progress)
							</button>
						)}

						{currentStatus === "in_progress" && (
							<button
								type="button"
								onClick={() => handleStatusChange("completed")}
								className="btn btn-primary btn-sm"
								style={{ background: "var(--status-success)" }}
								disabled={statusLoading}
							>
								✓ Mark Trip Completed
							</button>
						)}

						{currentStatus !== "completed" && currentStatus !== "cancelled" && (
							<>
								<button
									type="button"
									onClick={() => handleStatusChange("no_show")}
									className="btn btn-secondary btn-sm"
									disabled={statusLoading}
								>
									Passenger No-Show
								</button>
								<button
									type="button"
									onClick={() => {
										if (confirm("Are you sure you want to cancel this booking?")) {
											handleStatusChange("cancelled");
										}
									}}
									className="btn btn-danger btn-sm"
									disabled={statusLoading}
								>
									Cancel Booking
								</button>
							</>
						)}

						{currentStatus === "cancelled" && (
							<button
								type="button"
								onClick={() => handleStatusChange("confirmed")}
								className="btn btn-secondary btn-sm"
								disabled={statusLoading}
							>
								Re-Open as Confirmed
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Assign Chauffeur & Vehicle Form */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">Chauffeur & Fleet Assignment</h2>
				</div>
				<div className="card-body">
					<form onSubmit={handleSaveAssignment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						<div className="form-group">
							<label htmlFor="driver-select" className="form-label">
								Assigned Chauffeur
							</label>
							<select
								id="driver-select"
								value={selectedDriver}
								onChange={(e) => setSelectedDriver(e.target.value)}
								className="form-select"
								disabled={assignLoading}
							>
								<option value="">— Unassigned —</option>
								{drivers.map((d) => (
									<option key={d.id} value={d.id}>
										{d.name} ({d.phone || "No phone"})
									</option>
								))}
							</select>
						</div>

						<div className="form-group">
							<label htmlFor="vehicle-select" className="form-label">
								Assigned Vehicle
							</label>
							<select
								id="vehicle-select"
								value={selectedVehicle}
								onChange={(e) => setSelectedVehicle(e.target.value)}
								className="form-select"
								disabled={assignLoading}
							>
								<option value="">— Unassigned —</option>
								{vehicles.map((v) => (
									<option key={v.id} value={v.id}>
										{v.make} {v.model} ({v.registration || "No Reg"})
									</option>
								))}
							</select>
						</div>

						<button type="submit" className="btn btn-primary btn-sm" disabled={assignLoading}>
							{assignLoading ? "Saving Assignment..." : "Update Chauffeur & Vehicle"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
