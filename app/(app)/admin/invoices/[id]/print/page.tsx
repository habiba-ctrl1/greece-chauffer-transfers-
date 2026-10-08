import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCompanySettings } from "@/lib/actions/settings";
import { PrintToolbar } from "@/components/admin/print-toolbar";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Print Invoice — Greece Chauffeur Service",
};

interface PrintInvoicePageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function PrintInvoicePage({ params }: PrintInvoicePageProps) {
	const { id } = await params;
	const [invoice, settings] = await Promise.all([
		getInvoiceById(id),
		getCompanySettings(),
	]);

	if (!invoice) {
		notFound();
	}

	const isPaid = invoice.status === "paid";

	return (
		<div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "3rem" }}>
			{/* On-screen Print Toolbar */}
			<PrintToolbar
				backHref={invoice.booking_id ? `/admin/bookings/${invoice.booking_id}` : "/admin/invoices"}
				backLabel={invoice.booking_id ? "Back to Booking" : "Back to Invoices"}
				title={`Invoice ${invoice.invoice_number}`}
			/>

			{/* Printable Document Container */}
			<div
				className="printable-document"
				style={{
					background: "#ffffff",
					color: "#1a1d23",
					padding: "3rem",
					borderRadius: "8px",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					border: "1px solid #e9ecef",
					fontFamily: "'Inter', -apple-system, sans-serif",
				}}
			>
				{/* Document Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						borderBottom: "2px solid #1a1d23",
						paddingBottom: "1.5rem",
						marginBottom: "2rem",
					}}
				>
					<div>
						<h1
							style={{
								fontSize: "1.625rem",
								fontWeight: 800,
								letterSpacing: "1px",
								textTransform: "uppercase",
								margin: "0 0 0.25rem",
								color: "#1a1d23",
							}}
						>
							{settings.company_name}
						</h1>
						<div
							style={{
								fontSize: "0.75rem",
								textTransform: "uppercase",
								letterSpacing: "1.5px",
								color: "#6c757d",
								fontWeight: 600,
							}}
						>
							Executive Transfers & Private Chauffeur Operations
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#495057", marginTop: "0.75rem", lineHeight: 1.4 }}>
							{settings.company_address && <div>{settings.company_address}</div>}
							<div>24/7 Operations Hotline: <strong>{settings.company_phone}</strong></div>
							<div>Email: {settings.company_email}</div>
							{settings.company_vat && <div>VAT / Tax ID: {settings.company_vat}</div>}
						</div>
					</div>

					<div style={{ textAlign: "right" }}>
						<div
							style={{
								display: "inline-block",
								background: isPaid ? "#16a34a" : "#1a1d23",
								color: "#ffffff",
								padding: "0.35rem 0.85rem",
								fontSize: "0.75rem",
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: "1px",
								borderRadius: "4px",
								marginBottom: "0.75rem",
							}}
						>
							{isPaid ? "✓ Paid Invoice" : "Official Invoice"}
						</div>
						<div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1d23" }}>
							{invoice.invoice_number}
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
							Date: {formatDate(invoice.created_at)}
						</div>
						{invoice.booking_number && (
							<div style={{ fontSize: "0.8125rem", color: "var(--brand-700)", fontWeight: 600, marginTop: "0.125rem" }}>
								Booking Ref: {invoice.booking_number}
							</div>
						)}
						{invoice.due_date && !isPaid && (
							<div style={{ fontSize: "0.8125rem", color: "#d97706", fontWeight: 600, marginTop: "0.125rem" }}>
								Due Date: {formatDate(invoice.due_date)}
							</div>
						)}
					</div>
				</div>

				{/* Billed To & Service Summary */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "2rem",
						marginBottom: "2rem",
						padding: "1.25rem",
						background: "#f8f9fa",
						borderRadius: "6px",
						border: "1px solid #e9ecef",
					}}
				>
					<div>
						<div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d", fontWeight: 700, marginBottom: "0.5rem" }}>
							Billed To
						</div>
						<div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1a1d23" }}>
							{invoice.customer_name}
						</div>
						{invoice.customer_company && (
							<div style={{ fontSize: "0.875rem", color: "#495057", fontWeight: 500 }}>
								{invoice.customer_company}
							</div>
						)}
						{invoice.customer_email && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
								{invoice.customer_email}
							</div>
						)}
						{invoice.customer_phone && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d" }}>
								{invoice.customer_phone}
							</div>
						)}
					</div>

					<div>
						<div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d", fontWeight: 700, marginBottom: "0.5rem" }}>
							Payment Status & Terms
						</div>
						<div style={{ fontSize: "1rem", fontWeight: 700, color: isPaid ? "#16a34a" : "#d97706" }}>
							{isPaid ? "✓ PAID IN FULL" : "PAYMENT PENDING / DUE"}
						</div>
						{invoice.paid_date && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
								Settled On: {formatDate(invoice.paid_date)}
							</div>
						)}
						{invoice.pickup_location && (
							<div style={{ fontSize: "0.8125rem", color: "#495057", marginTop: "0.5rem" }}>
								Route: <strong>{invoice.pickup_location} → {invoice.dropoff_location}</strong>
							</div>
						)}
					</div>
				</div>

				{/* Itemized Line Items Table */}
				<div style={{ marginBottom: "2rem" }}>
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
						<thead>
							<tr style={{ borderBottom: "2px solid #dee2e6", background: "#f8f9fa", textAlign: "left" }}>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057" }}>Service Description</th>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057", textAlign: "center", width: "12%" }}>Qty</th>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057", textAlign: "right", width: "18%" }}>Unit Rate</th>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057", textAlign: "right", width: "18%" }}>Total</th>
							</tr>
						</thead>
						<tbody>
							{invoice.items && invoice.items.length > 0 ? (
								invoice.items.map((item) => (
									<tr key={item.id} style={{ borderBottom: "1px solid #e9ecef" }}>
										<td style={{ padding: "0.75rem", color: "#1a1d23" }}>{item.description}</td>
										<td style={{ padding: "0.75rem", textAlign: "center", color: "#495057" }}>{item.quantity}</td>
										<td style={{ padding: "0.75rem", textAlign: "right", color: "#495057" }}>{formatCurrency(item.unit_price)}</td>
										<td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "#1a1d23" }}>{formatCurrency(item.total)}</td>
									</tr>
								))
							) : (
								<tr style={{ borderBottom: "1px solid #e9ecef" }}>
									<td style={{ padding: "0.75rem", color: "#1a1d23" }}>
										Executive Chauffeur Service — {invoice.pickup_location || "Transfer Service"}
									</td>
									<td style={{ padding: "0.75rem", textAlign: "center", color: "#495057" }}>1</td>
									<td style={{ padding: "0.75rem", textAlign: "right", color: "#495057" }}>{formatCurrency(invoice.subtotal || invoice.total)}</td>
									<td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "#1a1d23" }}>{formatCurrency(invoice.subtotal || invoice.total)}</td>
								</tr>
							)}
						</tbody>
					</table>

					{/* Totals Summary */}
					<div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
						<table style={{ width: "280px", fontSize: "0.875rem", borderCollapse: "collapse" }}>
							<tbody>
								<tr>
									<td style={{ padding: "0.35rem 0", color: "#6c757d" }}>Subtotal:</td>
									<td style={{ padding: "0.35rem 0", textAlign: "right", fontWeight: 500 }}>{formatCurrency(invoice.subtotal)}</td>
								</tr>
								{invoice.discount_amount > 0 && (
									<tr>
										<td style={{ padding: "0.35rem 0", color: "#22c55e" }}>Discount:</td>
										<td style={{ padding: "0.35rem 0", textAlign: "right", color: "#22c55e", fontWeight: 500 }}>
											-{formatCurrency(invoice.discount_amount)}
										</td>
									</tr>
								)}
								{invoice.tax_amount > 0 && (
									<tr>
										<td style={{ padding: "0.35rem 0", color: "#6c757d" }}>VAT / Taxes:</td>
										<td style={{ padding: "0.35rem 0", textAlign: "right", fontWeight: 500 }}>{formatCurrency(invoice.tax_amount)}</td>
									</tr>
								)}
								<tr style={{ borderTop: "2px solid #1a1d23" }}>
									<td style={{ padding: "0.625rem 0", fontWeight: 700, fontSize: "1.0625rem", color: "#1a1d23" }}>Total (EUR):</td>
									<td style={{ padding: "0.625rem 0", textAlign: "right", fontWeight: 800, fontSize: "1.1875rem", color: "#1a1d23" }}>
										{formatCurrency(invoice.total)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* Invoice & Payment Notes */}
				<div style={{ borderTop: "1px solid #dee2e6", paddingTop: "1.25rem", fontSize: "0.75rem", color: "#6c757d", lineHeight: 1.5 }}>
					<div style={{ fontWeight: 700, color: "#495057", textTransform: "uppercase", marginBottom: "0.375rem" }}>
						Payment & Settlement Notes
					</div>
					<div>{invoice.notes || settings.invoice_terms}</div>
					<div style={{ marginTop: "0.5rem" }}>
						For inquiries regarding this invoice, contact accounting at <strong>{settings.company_email}</strong> or 24/7 hotline <strong>{settings.company_phone}</strong>.
					</div>
				</div>
			</div>
		</div>
	);
}
