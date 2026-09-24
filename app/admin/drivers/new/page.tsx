import Link from "next/link";
import { DriverForm } from "@/components/admin/driver-form";

export const metadata = {
	title: "Add Driver — Greece Chauffeur Service",
};

export default function NewDriverPage() {
	return (
		<div style={{ maxWidth: "720px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href="/admin/drivers" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
							← Back to Drivers
						</Link>
					</div>
					<h1>Add New Driver</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Onboard a new company or partner chauffeur
					</p>
				</div>
			</div>

			<div className="card">
				<div className="card-body">
					<DriverForm />
				</div>
			</div>
		</div>
	);
}
