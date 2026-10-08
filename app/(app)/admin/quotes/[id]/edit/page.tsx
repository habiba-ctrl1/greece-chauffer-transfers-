import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteById } from "@/lib/actions/quotes";
import { QuoteForm } from "@/components/admin/quote-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Edit Quote — Greece Chauffeur Service",
};

interface EditQuotePageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
	const { id } = await params;
	const quote = await getQuoteById(id);

	if (!quote) {
		notFound();
	}

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href={`/admin/quotes/${quote.id}`} style={{ color: "var(--accent)", fontSize: "0.8125rem" }}>
							← Back to Quote Details
						</Link>
					</div>
					<h1>Edit Quotation: {quote.quote_number}</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Update passenger requirements, line item pricing, or itinerary
					</p>
				</div>
			</div>

			<QuoteForm initialData={quote} />
		</div>
	);
}
