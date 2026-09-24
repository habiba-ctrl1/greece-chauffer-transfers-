"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus, sendInvoiceEmail } from "@/lib/actions/invoices";
import type { InvoiceStatus } from "@/lib/schema";

interface InvoiceStatusActionsProps {
	invoiceId: string;
	currentStatus: InvoiceStatus;
	customerEmail?: string | null;
}

export function InvoiceStatusActions({
	invoiceId,
	currentStatus,
	customerEmail,
}: InvoiceStatusActionsProps) {
	const router = useRouter();
	const [statusLoading, setStatusLoading] = useState(false);
	const [emailLoading, setEmailLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	async function handleStatusChange(newStatus: InvoiceStatus) {
		setStatusLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			const res = await updateInvoiceStatus(invoiceId, newStatus);
			if (!res.success) {
				setError(res.error || "Failed to update invoice status.");
			} else {
				setSuccessMsg(`Invoice status updated to ${newStatus.toUpperCase()}`);
				router.refresh();
			}
		} catch {
			setError("Unexpected error updating status.");
		} finally {
			setStatusLoading(false);
		}
	}

	async function handleSendEmail() {
		setEmailLoading(true);
		setError(null);
		setSuccessMsg(null);
		try {
			const res = await sendInvoiceEmail(invoiceId);
			if (!res.success) {
				setError(res.error || "Failed to dispatch invoice email.");
			} else {
				setSuccessMsg(`Official invoice successfully emailed to ${customerEmail || "client"}`);
				router.refresh();
			}
		} catch {
			setError("Unexpected error sending invoice email.");
		} finally {
			setEmailLoading(false);
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

			<div className="card">
				<div className="card-header">
					<h2 className="card-title">Billing Actions</h2>
				</div>
				<div className="card-body">
					<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
						{/* Email button */}
						{customerEmail ? (
							<button
								type="button"
								onClick={handleSendEmail}
								className="btn btn-secondary btn-sm"
								disabled={emailLoading}
								style={{ width: "100%", justifyContent: "center" }}
							>
								{emailLoading ? "Sending Email..." : "✉️ Send Invoice to Customer"}
							</button>
						) : (
							<p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
								No email on file for client.
							</p>
						)}

						{/* Status Change Buttons */}
						<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", borderTop: "1px solid var(--border-default)", paddingTop: "0.75rem" }}>
							{currentStatus !== "paid" && (
								<button
									type="button"
									onClick={() => handleStatusChange("paid")}
									className="btn btn-primary btn-sm"
									disabled={statusLoading}
									style={{ background: "var(--status-success, #16a34a)" }}
								>
									✓ Mark as Paid
								</button>
							)}

							{currentStatus === "draft" && (
								<button
									type="button"
									onClick={() => handleStatusChange("sent")}
									className="btn btn-secondary btn-sm"
									disabled={statusLoading}
								>
									Mark as Sent
								</button>
							)}

							{currentStatus === "paid" && (
								<button
									type="button"
									onClick={() => handleStatusChange("sent")}
									className="btn btn-secondary btn-sm"
									disabled={statusLoading}
								>
									Revert to Sent / Due
								</button>
							)}

							{currentStatus !== "cancelled" && (
								<button
									type="button"
									onClick={() => {
										if (confirm("Are you sure you want to cancel this invoice?")) {
											handleStatusChange("cancelled");
										}
									}}
									className="btn btn-danger btn-sm"
									disabled={statusLoading}
								>
									Cancel Invoice
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
