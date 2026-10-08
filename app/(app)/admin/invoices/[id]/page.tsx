import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { InvoiceStatusActions } from "@/components/admin/invoice-status-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Invoice Details — Greece Chauffeur Service",
};

interface InvoiceDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
	const { id } = await params;
	const invoice = await getInvoiceById(id);

	if (!invoice) {
		notFound();
	}

	const isPaid = invoice.status === "paid";

	return (
		<div>
			{/* Breadcrumb */}
			<div style={{ marginBottom: "0.75rem" }}>
				<Link href="/admin/invoices" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
					← Back to Invoices
				</Link>
			</div>

			{/* Page Header */}
			<div className="page-header">
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
						<h1>{invoice.invoice_number}</h1>
						<span
							className={`badge ${
								isPaid
									? "badge-success"
									: invoice.status === "sent"
									? "badge-info"
									: invoice.status === "draft"
									? "badge-neutral"
									: "badge-danger"
							}`}
							style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}
						>
							{invoice.status.toUpperCase()}
						</span>
						{invoice.booking_number && (
							<Link
								href={`/admin/bookings/${invoice.booking_id}`}
								className="badge badge-neutral"
								style={{ textDecoration: "none", fontSize: "0.8125rem" }}
							>
								Booking: {invoice.booking_number}
							</Link>
						)}
					</div>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
						Issued on {formatDate(invoice.created_at)} {invoice.due_date ? `• Due by ${invoice.due_date}` : ""}
					</p>
				</div>
				<div className="page-header-actions">
					<Link
						href={`/admin/invoices/${invoice.id}/print`}
						target="_blank"
						className="btn btn-secondary"
						style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<polyline points="6 9 6 2 18 2 18 9"></polyline>
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
							<rect x="6" y="14" width="12" height="8"></rect>
						</svg>
						Print / PDF
					</Link>
					{invoice.booking_id && (
						<Link href={`/admin/bookings/${invoice.booking_id}`} className="btn btn-secondary">
							View Booking
						</Link>
					)}
				</div>
			</div>

			{/* Main Grid */}
			<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", alignItems: "start" }}>
				{/* Left Column: Details & Items */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
					{/* Client Card */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Billed To</h2>
							{invoice.customer_id && (
								<Link href={`/admin/customers/${invoice.customer_id}`} style={{ fontSize: "0.75rem", color: "var(--brand-600)" }}>
									View Client Profile →
								</Link>
							)}
						</div>
						<div className="card-body">
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
								<div>
									<div className="form-label">Client Name</div>
									<div style={{ fontWeight: 600 }}>{invoice.customer_name}</div>
									{invoice.customer_company && (
										<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
											{invoice.customer_company}
										</div>
									)}
								</div>
								<div>
									<div className="form-label">Email Address</div>
									<div>{invoice.customer_email || <span style={{ color: "var(--text-tertiary)" }}>No email</span>}</div>
								</div>
								<div>
									<div className="form-label">Phone Contact</div>
									<div>{invoice.customer_phone || <span style={{ color: "var(--text-tertiary)" }}>No phone</span>}</div>
								</div>
								<div>
									<div className="form-label">Payment Date</div>
									<div style={{ fontWeight: isPaid ? 600 : 400, color: isPaid ? "var(--status-success)" : "inherit" }}>
										{invoice.paid_date ? formatDate(invoice.paid_date) : "Pending Payment"}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Service / Itinerary Info (if linked to booking) */}
					{invoice.pickup_location && (
						<div className="card">
							<div className="card-header">
								<h2 className="card-title">Service Details</h2>
							</div>
							<div className="card-body">
								<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
									<div style={{ display: "flex", gap: "0.5rem" }}>
										<span style={{ color: "var(--brand-600)", fontWeight: 700 }}>Pickup:</span>
										<span>{invoice.pickup_location} {invoice.pickup_date ? `(${invoice.pickup_date} ${invoice.pickup_time || ""})` : ""}</span>
									</div>
									<div style={{ display: "flex", gap: "0.5rem" }}>
										<span style={{ color: "var(--status-danger)", fontWeight: 700 }}>Destination:</span>
										<span>{invoice.dropoff_location}</span>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Line Items Table */}
					<div className="card">
						<div className="card-header">
							<h2 className="card-title">Invoice Line Items</h2>
						</div>
						<div className="card-body" style={{ padding: 0 }}>
							<table className="table">
								<thead>
									<tr>
										<th>Description</th>
										<th style={{ textAlign: "center", width: "80px" }}>Qty</th>
										<th style={{ textAlign: "right", width: "120px" }}>Unit Price</th>
										<th style={{ textAlign: "right", width: "120px" }}>Total</th>
									</tr>
								</thead>
								<tbody>
									{(invoice.items ?? []).length === 0 ? (
										<tr>
											<td colSpan={4} style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
												No line items.
											</td>
										</tr>
									) : (
										(invoice.items ?? []).map((item) => (
											<tr key={item.id}>
												<td>{item.description}</td>
												<td style={{ textAlign: "center" }}>{item.quantity}</td>
												<td style={{ textAlign: "right" }}>{formatCurrency(item.unit_price)}</td>
												<td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.total)}</td>
											</tr>
										))
									)}
								</tbody>
							</table>

							{/* Summary totals */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.5rem",
									padding: "1.25rem",
									borderTop: "1px solid var(--border-default)",
									background: "var(--bg-page)",
								}}
							>
								<div style={{ display: "flex", justifyContent: "flex-end", gap: "2rem", fontSize: "0.875rem" }}>
									<span style={{ color: "var(--text-secondary)" }}>Subtotal:</span>
									<span style={{ minWidth: "100px", textAlign: "right" }}>{formatCurrency(invoice.subtotal)}</span>
								</div>
								{invoice.discount_amount > 0 && (
									<div style={{ display: "flex", justifyContent: "flex-end", gap: "2rem", fontSize: "0.875rem", color: "var(--status-danger)" }}>
										<span>Discount:</span>
										<span style={{ minWidth: "100px", textAlign: "right" }}>-{formatCurrency(invoice.discount_amount)}</span>
									</div>
								)}
								{invoice.tax_amount > 0 && (
									<div style={{ display: "flex", justifyContent: "flex-end", gap: "2rem", fontSize: "0.875rem" }}>
										<span style={{ color: "var(--text-secondary)" }}>VAT / Tax:</span>
										<span style={{ minWidth: "100px", textAlign: "right" }}>+{formatCurrency(invoice.tax_amount)}</span>
									</div>
								)}
								<div
									style={{
										display: "flex",
										justifyContent: "flex-end",
										gap: "2rem",
										fontSize: "1.125rem",
										fontWeight: 700,
										borderTop: "1px solid var(--border-default)",
										paddingTop: "0.5rem",
										color: "var(--text-primary)",
									}}
								>
									<span>Total Due:</span>
									<span style={{ minWidth: "100px", textAlign: "right" }}>{formatCurrency(invoice.total)}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Notes */}
					{invoice.notes && (
						<div className="card">
							<div className="card-header">
								<h2 className="card-title">Payment Terms & Notes</h2>
							</div>
							<div className="card-body">
								<p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
									{invoice.notes}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Right Column: Actions */}
				<div>
					<InvoiceStatusActions
						invoiceId={invoice.id}
						currentStatus={invoice.status}
						customerEmail={invoice.customer_email}
					/>
				</div>
			</div>
		</div>
	);
}
