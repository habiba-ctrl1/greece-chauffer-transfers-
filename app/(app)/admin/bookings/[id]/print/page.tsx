import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/actions/bookings";
import { getCompanySettings } from "@/lib/actions/settings";
import { PrintToolbar } from "@/components/admin/print-toolbar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Print Reservation Voucher — Greece Chauffeur Service",
};

interface PrintBookingPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function PrintBookingPage({ params }: PrintBookingPageProps) {
	const { id } = await params;
	const [result, settings] = await Promise.all([
		getBookingById(id),
		getCompanySettings(),
	]);

	if (!result || !result.booking) {
		notFound();
	}

	const { booking } = result;

	return (
		<div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "3rem" }}>
			{/* On-screen Print Toolbar */}
			<PrintToolbar
				backHref={`/admin/bookings/${booking.id}`}
				backLabel="Back to Booking"
				title={`Reservation Voucher ${booking.booking_number}`}
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
							<div>24/7 Operations Hotline: <strong>{settings.company_phone}</strong></div>
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
							Reservation Voucher
						</div>
						<div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1d23" }}>
							{booking.booking_number}
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#6c757d", marginTop: "0.25rem" }}>
							Issued: {formatDate(booking.created_at)}
						</div>
						<div style={{ fontSize: "0.8125rem", color: "#16a34a", fontWeight: 700, marginTop: "0.125rem" }}>
							Status: {BOOKING_STATUS_LABELS[booking.status] || booking.status}
						</div>
					</div>
				</div>

				{/* Primary Details Grid */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "1.5rem",
						marginBottom: "2rem",
					}}
				>
					{/* Passenger Card */}
					<div
						style={{
							padding: "1.25rem",
							background: "#f8f9fa",
							borderRadius: "6px",
							border: "1px solid #e9ecef",
						}}
					>
						<div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d", fontWeight: 700, marginBottom: "0.5rem" }}>
							Passenger & Client Details
						</div>
						<div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1a1d23" }}>
							{booking.customer_name}
						</div>
						{booking.customer_phone && (
							<div style={{ fontSize: "0.875rem", color: "#495057", marginTop: "0.25rem" }}>
								Phone: <strong>{booking.customer_phone}</strong>
							</div>
						)}
						{booking.customer_email && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d" }}>
								{booking.customer_email}
							</div>
						)}
						<div style={{ fontSize: "0.8125rem", color: "#495057", marginTop: "0.5rem" }}>
							Passengers: <strong>{booking.passenger_count || 1}</strong> | Luggage: <strong>{booking.luggage_info || "Standard"}</strong>
						</div>
					</div>

					{/* Assigned Chauffeur & Vehicle Card */}
					<div
						style={{
							padding: "1.25rem",
							background: "#f8f9fa",
							borderRadius: "6px",
							border: "1px solid #e9ecef",
						}}
					>
						<div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d", fontWeight: 700, marginBottom: "0.5rem" }}>
							Chauffeur & Assigned Fleet
						</div>
						<div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1a1d23" }}>
							{booking.driver_name || "Chauffeur Pending Dispatch"}
						</div>
						{booking.driver_phone && (
							<div style={{ fontSize: "0.875rem", color: "#495057", marginTop: "0.25rem" }}>
								Direct Mobile: <strong>{booking.driver_phone}</strong>
							</div>
						)}
						<div style={{ fontSize: "0.875rem", color: "#495057", marginTop: "0.5rem" }}>
							Vehicle: <strong>{booking.vehicle_make ? `${booking.vehicle_make} ${booking.vehicle_model || ""}` : (booking.vehicle_category ? `${booking.vehicle_category} Class` : "Executive Sedan")}</strong>
						</div>
						{booking.vehicle_registration && (
							<div style={{ fontSize: "0.8125rem", color: "#6c757d" }}>
								Plate / Reg: <strong>{booking.vehicle_registration}</strong>
							</div>
						)}
					</div>
				</div>

				{/* Service Itinerary */}
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
						Transfer & Service Schedule
					</h3>

					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
						<tbody>
							<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", width: "25%", fontWeight: 500 }}>Pickup Date & Time:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 700, color: "#1a1d23" }}>
									{booking.pickup_date ? formatDate(booking.pickup_date) : "TBD"} {booking.pickup_time ? `at ${booking.pickup_time}` : ""}
								</td>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", width: "20%", fontWeight: 500 }}>Service Type:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23", textTransform: "capitalize" }}>
									{booking.trip_type ? booking.trip_type.replace("_", " ") : "Transfer"}
								</td>
							</tr>
							<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Pickup Location:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>{booking.pickup_location || "Athens, Greece"}</td>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Flight / Vessel:</td>
								<td style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>
									{booking.flight_number ? `${booking.airline || ""} ${booking.flight_number}` : "None"}
								</td>
							</tr>
							<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
								<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Dropoff Location:</td>
								<td colSpan={3} style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>
									{booking.dropoff_location || "Destination, Greece"}
								</td>
							</tr>
							{booking.return_date && (
								<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
									<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Return Leg:</td>
									<td colSpan={3} style={{ padding: "0.625rem 0", fontWeight: 600, color: "#1a1d23" }}>
										{formatDate(booking.return_date)} {booking.return_time || ""}
									</td>
								</tr>
							)}
							{booking.additional_stops && (
								<tr style={{ borderBottom: "1px solid #f1f3f5" }}>
									<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Additional Stops:</td>
									<td colSpan={3} style={{ padding: "0.625rem 0", color: "#1a1d23" }}>{booking.additional_stops}</td>
								</tr>
							)}
							{booking.special_requests && (
								<tr>
									<td style={{ padding: "0.625rem 0", color: "#6c757d", fontWeight: 500 }}>Special Requests:</td>
									<td colSpan={3} style={{ padding: "0.625rem 0", color: "#1a1d23", fontStyle: "italic" }}>{booking.special_requests}</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Financial Summary */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "1rem 1.25rem",
						background: "#f8f9fa",
						borderRadius: "6px",
						border: "1px solid #e9ecef",
						marginBottom: "2rem",
					}}
				>
					<div>
						<div style={{ fontSize: "0.75rem", color: "#6c757d", textTransform: "uppercase", fontWeight: 600 }}>Payment Status</div>
						<div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1a1d23", textTransform: "capitalize" }}>
							{PAYMENT_STATUS_LABELS[booking.payment_status] || booking.payment_status}
						</div>
					</div>

					<div style={{ textAlign: "right" }}>
						<div style={{ fontSize: "0.75rem", color: "#6c757d", textTransform: "uppercase", fontWeight: 600 }}>Total Agreed Fare</div>
						<div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1a1d23" }}>
							{formatCurrency(booking.total)}
						</div>
					</div>
				</div>

				{/* Airport Meet & Greet Instructions */}
				<div style={{ borderTop: "1px solid #dee2e6", paddingTop: "1.25rem", fontSize: "0.8125rem", color: "#495057", lineHeight: 1.5 }}>
					<div style={{ fontWeight: 700, color: "#1a1d23", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1px", marginBottom: "0.5rem" }}>
						Airport / Port Meet & Greet Instructions
					</div>
					<ul style={{ paddingLeft: "1.25rem", margin: 0, color: "#6c757d" }}>
						<li><strong>Airport Arrivals:</strong> Your chauffeur will be waiting inside the arrival hall holding a customized name sign immediately after luggage collection and customs.</li>
						<li><strong>Flight Monitoring:</strong> We automatically track incoming flights. If your flight is delayed or arrives early, pickup schedule adjusts without extra waiting fees for up to 60 minutes.</li>
						<li><strong>Urgent Inquiries:</strong> In case of luggage loss or unexpected airport delays, please immediately phone our 24/7 Dispatch Control: <strong>{settings.company_phone}</strong>.</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
