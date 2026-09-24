import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById, getActiveDrivers, getAvailableVehicles } from "@/lib/actions/bookings";
import { BookingForm } from "@/components/admin/booking-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Edit Booking — Greece Chauffeur Service",
};

interface EditBookingPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function EditBookingPage({ params }: EditBookingPageProps) {
	const { id } = await params;
	const result = await getBookingById(id);

	if (!result) {
		notFound();
	}

	const [drivers, vehicles] = await Promise.all([
		getActiveDrivers(),
		getAvailableVehicles(),
	]);

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href={`/admin/bookings/${result.booking.id}`} style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
							← Back to Booking Details
						</Link>
					</div>
					<h1>Edit Booking: {result.booking.booking_number}</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Modify schedule, route coordinates, vehicle class, or pricing
					</p>
				</div>
			</div>

			<BookingForm
				initialData={result.booking}
				drivers={drivers}
				vehicles={vehicles}
			/>
		</div>
	);
}
