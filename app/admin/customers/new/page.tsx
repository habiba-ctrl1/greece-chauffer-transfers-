import Link from "next/link";
import { CustomerForm } from "@/components/admin/customer-form";

export const metadata = {
	title: "Add Customer — Greece Chauffeur Service",
};

export default function NewCustomerPage() {
	return (
		<div style={{ maxWidth: "720px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href="/admin/customers" style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
							← Back to Customer Directory
						</Link>
					</div>
					<h1>Add New Customer</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Create a new individual VIP or corporate profile
					</p>
				</div>
			</div>

			<div className="card">
				<div className="card-body">
					<CustomerForm />
				</div>
			</div>
		</div>
	);
}
