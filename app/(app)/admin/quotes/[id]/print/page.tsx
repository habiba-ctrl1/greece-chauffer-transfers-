import { notFound } from "next/navigation";
import { getQuoteById } from "@/lib/actions/quotes";
import { getCompanySettings } from "@/lib/actions/settings";
import { PrintToolbar } from "@/components/admin/print-toolbar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTE_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Print Quotation — Greece Chauffeur Service",
};

interface PrintQuotePageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function PrintQuotePage({ params }: PrintQuotePageProps) {
	const { id } = await params;
	const [quote, settings] = await Promise.all([
		getQuoteById(id),
		getCompanySettings(),
	]);

	if (!quote) {
		notFound();
	}

	return (
		<div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "3rem" }}>
			{/* On-screen Print Toolbar */}
			<PrintToolbar
				backHref={`/admin/quotes/${quote.id}`}
				backLabel="Back to Quote"
				title={`Quotation ${quote.quote_number}`}
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
							Greece <span style={{ color: "#b8860b" }}>Chauffeur</span>
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
							Executive Transfers & Private Chauffeur
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#495057", marginTop: "0.75rem", lineHeight: 1.4 }}>
							<div>{settings.company_address}</div>
							<div>Phone: {settings.company_phone} | Email: {settings.company_email}</div>
							<div>VAT: {settings.company_vat} | Lic: {settings.company_license}</div>
						</div>
					</div>

					<div style={{ textAlign: "right" }}>
						<div
							style={{
								display: "inline-block",
								background: "#1a1d23",
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
							Official Quotation
						</div>
						<div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1d23" }}>
							{quote.quote_number}
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
							Date: {formatDate(quote.created_at)}
						</div>
						{quote.valid_until && (
							<div style={{ fontSize: "0.8125rem", color: "#b8860b", fontWeight: 600, marginTop: "0.125rem" }}>
								Valid Until: {formatDate(quote.valid_until)}
							</div>
						)}
					</div>
				</div>

				{/* Customer & Overview Grid */}
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
							Client Information
						</div>
						<div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1a1d23" }}>
							{quote.customer_name}
						</div>
						{quote.customer_company && (
							<div style={{ fontSize: "0.875rem", color: "#495057", fontWeight: 500 }}>
								{quote.customer_company}
							</div>
						)}
						{quote.customer_email && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
								{quote.customer_email}
							</div>
						)}
						{quote.customer_phone && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d" }}>
								{quote.customer_phone}
							</div>
						)}
					</div>

					<div>
						<div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d", fontWeight: 700, marginBottom: "0.5rem" }}>
							Quotation Status
						</div>
						<div style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
							Status: <span style={{ textTransform: "capitalize" }}>{QUOTE_STATUS_LABELS[quote.status] || quote.status}</span>
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
							Service: <strong style={{ color: "#1a1d23", textTransform: "capitalize" }}>{quote.trip_type ? quote.trip_type.replace("_", " ") : "Private Transfer"}</strong>
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#6c757d" }}>
							Vehicle Class: <strong style={{ color: "#1a1d23", textTransform: "capitalize" }}>{quote.vehicle_category || "Executive"}</strong>
						</div>
					</div>
				</div>

				{/* Transfer Itinerary Specifications */}
				<div style={{ marginBottom: "2rem" }}>
					<h3
						style={{
							fontSize: "0.875rem",
							textTransform: "uppercase",
							letterSpacing: "1px",
							color: "#1a1d23",
							borderBottom: "1px solid #dee2e6",
							paddingBottom: "0.5rem",
							marginBottom: "1rem",
							fontWeight: 700,
						}}
					>
						Itinerary & Transfer Specifications
					</h3>

					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
						<tbody>
							<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", width: "25%", fontWeight: 500 }}>Pickup Location:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>{quote.pickup_location || "Athens, Greece"}</td>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", width: "20%", fontWeight: 500 }}>Pickup Schedule:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>
									{quote.pickup_date ? formatDate(quote.pickup_date) : "TBD"} {quote.pickup_time ? `at ${quote.pickup_time}` : ""}
								</td>
							</tr>
							<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Dropoff Location:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>{quote.dropoff_location || "Destination, Greece"}</td>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Return Schedule:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>
									{quote.return_date ? `${formatDate(quote.return_date)} ${quote.return_time || ""}` : "One-Way Service"}
								</td>
							</tr>
							<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Capacity:</td>
								<td style={{ padding: "0.625rem 0", color: "#1a1d23" }}>
									{quote.passenger_count || 1} Passengers | {quote.luggage_info || "Standard Luggage"}
								</td>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Flight Info:</td>
								<td style={{ padding: "0.625rem 0", color: "#1a1d23" }}>
									{quote.flight_number ? `${quote.airline || ""} ${quote.flight_number}` : "None"}
								</td>
							</tr>
							{quote.additional_stops && (
								<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
									<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Additional Stops:</td>
									<td colSpan={3} style={{ padding: "0.625rem 0", color: "#1a1d23" }}>{quote.additional_stops}</td>
								</tr>
							)}
							{quote.special_requests && (
								<tr>
									<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Special Requests:</td>
									<td colSpan={3} style={{ padding: "0.625rem 0", color: "#1a1d23", fontStyle: "italic" }}>{quote.special_requests}</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Itemized Pricing Schedule */}
				<div style={{ marginBottom: "2rem" }}>
					<h3
						style={{
							fontSize: "0.875rem",
							textTransform: "uppercase",
							letterSpacing: "1px",
							color: "#1a1d23",
							borderBottom: "1px solid #dee2e6",
							paddingBottom: "0.5rem",
							marginBottom: "1rem",
							fontWeight: 700,
						}}
					>
						Itemized Pricing Schedule
					</h3>

					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
						<thead>
							<tr style={{ borderBottom: "2px solid #dee2e6", background: "#f8f9fa", textAlign: "left" }}>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057" }}>Description</th>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057", textAlign: "center", width: "12%" }}>Qty</th>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057", textAlign: "right", width: "18%" }}>Rate</th>
								<th style={{ padding: "0.625rem 0.75rem", fontWeight: 700, color: "#495057", textAlign: "right", width: "18%" }}>Total</th>
							</tr>
						</thead>
						<tbody>
							{quote.items && quote.items.length > 0 ? (
								quote.items.map((item, idx) => (
									<tr key={item.id || idx} style={{ borderBottom: "1px solid #e9ecef" }}>
										<td style={{ padding: "0.75rem", color: "#1a1d23" }}>{item.description}</td>
										<td style={{ padding: "0.75rem", textAlign: "center", color: "#495057" }}>{item.quantity}</td>
										<td style={{ padding: "0.75rem", textAlign: "right", color: "#495057" }}>{formatCurrency(item.unit_price)}</td>
										<td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "#1a1d23" }}>{formatCurrency(item.total)}</td>
									</tr>
								))
							) : (
								<tr style={{ borderBottom: "1px solid #e9ecef" }}>
									<td style={{ padding: "0.75rem", color: "#1a1d23" }}>
										{quote.trip_type ? quote.trip_type.replace("_", " ").toUpperCase() : "CHAUFFEUR SERVICE"} — {quote.pickup_location} to {quote.dropoff_location}
									</td>
									<td style={{ padding: "0.75rem", textAlign: "center", color: "#495057" }}>1</td>
									<td style={{ padding: "0.75rem", textAlign: "right", color: "#495057" }}>{formatCurrency(quote.subtotal || quote.total)}</td>
									<td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "#1a1d23" }}>{formatCurrency(quote.subtotal || quote.total)}</td>
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
									<td style={{ padding: "0.35rem 0", textAlign: "right", fontWeight: 500 }}>{formatCurrency(quote.subtotal)}</td>
								</tr>
								{quote.discount_amount > 0 && (
									<tr>
										<td style={{ padding: "0.35rem 0", color: "#22c55e" }}>Discount:</td>
										<td style={{ padding: "0.35rem 0", textAlign: "right", color: "#22c55e", fontWeight: 500 }}>
											-{formatCurrency(quote.discount_amount)}
										</td>
									</tr>
								)}
								{quote.tax_amount > 0 && (
									<tr>
										<td style={{ padding: "0.35rem 0", color: "#6c757d" }}>VAT / Taxes:</td>
										<td style={{ padding: "0.35rem 0", textAlign: "right", fontWeight: 500 }}>{formatCurrency(quote.tax_amount)}</td>
									</tr>
								)}
								<tr style={{ borderTop: "2px solid #1a1d23" }}>
									<td style={{ padding: "0.625rem 0", fontWeight: 700, fontSize: "1.0625rem", color: "#1a1d23" }}>Total (EUR):</td>
									<td style={{ padding: "0.625rem 0", textAlign: "right", fontWeight: 800, fontSize: "1.1875rem", color: "#1a1d23" }}>
										{formatCurrency(quote.total)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* Terms & Conditions */}
				<div style={{ borderTop: "1px solid #dee2e6", paddingTop: "1.25rem", fontSize: "0.75rem", color: "#6c757d", lineHeight: 1.5 }}>
					<div style={{ fontWeight: 700, color: "#495057", textTransform: "uppercase", marginBottom: "0.375rem" }}>
						Terms & Operational Inclusions
					</div>
					<div>{settings.booking_terms}</div>
					{quote.notes && (
						<div style={{ marginTop: "0.5rem", color: "#1a1d23" }}>
							<strong>Notes to Client:</strong> {quote.notes}
						</div>
					)}
				</div>

				{/* Sign-off & Confirmation Block */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "3rem",
						marginTop: "2.5rem",
						paddingTop: "1.5rem",
						borderTop: "1px dashed #ced4da",
					}}
				>
					<div>
						<div style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: "2rem" }}>Authorized Greece Chauffeur Dispatch:</div>
						<div style={{ borderBottom: "1px solid #adb5bd", width: "80%" }}></div>
						<div style={{ fontSize: "0.6875rem", color: "#adb5bd", marginTop: "0.25rem" }}>Signature & Stamp</div>
					</div>
					<div>
						<div style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: "2rem" }}>Client Acceptance & Approval:</div>
						<div style={{ borderBottom: "1px solid #adb5bd", width: "80%" }}></div>
						<div style={{ fontSize: "0.6875rem", color: "#adb5bd", marginTop: "0.25rem" }}>Signature / Date</div>
					</div>
				</div>
			</div>
		</div>
	);
}
