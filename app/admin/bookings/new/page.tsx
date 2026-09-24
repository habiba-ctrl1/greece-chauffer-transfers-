import Link from "next/link";
import { getCustomerById } from "@/lib/actions/customers";
import { getActiveDrivers, getAvailableVehicles } from "@/lib/actions/bookings";
import { BookingForm } from "@/components/admin/booking-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "New Booking — Greece Chauffeur Service",
};

interface NewBookingPageProps {
	searchParams: Promise<{
		customer_id?: string;
	}>;
}

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
	const params = await searchParams;
	let preselectedCustomer = null;

	if (params.customer_id) {
		preselectedCustomer = await getCustomerById(params.customer_id);
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
						<Link href="/admin/bookings" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
							← Back to Booking Dispatch
						</Link>
					</div>
					<h1>Create New Chauffeur Booking</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Enter client trip requirements, flight tracking, and vehicle dispatch details
					</p>
				</div>
			</div>

			<BookingForm
				preselectedCustomer={preselectedCustomer}
				drivers={drivers}
				vehicles={vehicles}
			/>
		</div>
	);
}
