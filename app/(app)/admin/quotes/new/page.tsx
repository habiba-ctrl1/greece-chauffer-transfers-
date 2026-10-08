import Link from "next/link";
import { getCustomerById } from "@/lib/actions/customers";
import { QuoteForm } from "@/components/admin/quote-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "New Quote — Greece Chauffeur Service",
};

interface NewQuotePageProps {
	searchParams: Promise<{
		customer_id?: string;
	}>;
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
	const params = await searchParams;
	let preselectedCustomer = null;

	if (params.customer_id) {
		preselectedCustomer = await getCustomerById(params.customer_id);
	}

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href="/admin/quotes" style={{ color: "var(--accent)", fontSize: "0.8125rem" }}>
							← Back to Quotes & Inquiries
						</Link>
					</div>
					<h1>Create New Quotation</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Build an itemized transfer quotation with real-time tax, discounts, and validity
					</p>
				</div>
			</div>

			<QuoteForm preselectedCustomer={preselectedCustomer} />
		</div>
	);
}
