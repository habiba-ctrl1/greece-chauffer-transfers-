import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Edit Customer — Greece Chauffeur Service",
};

interface EditCustomerPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
	const { id } = await params;
	const customer = await getCustomerById(id);

	if (!customer) {
		notFound();
	}

	return (
		<div style={{ maxWidth: "720px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href={`/admin/customers/${customer.id}`} style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
							← Back to Customer Profile
						</Link>
					</div>
					<h1>Edit Customer: {customer.name}</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Update contact details and preferences
					</p>
				</div>
			</div>

			<div className="card">
				<div className="card-body">
					<CustomerForm initialData={customer} />
				</div>
			</div>
		</div>
	);
}
