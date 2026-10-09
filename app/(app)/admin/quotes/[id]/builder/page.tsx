import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/guard";
import { crmContext } from "@/lib/crm/service";
import { getQuote } from "@/lib/crm/quotes";
import { QuoteBuilder } from "@/components/admin/crm/quote-builder";
import { isMailConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotation — Greece Chauffeur Service" };

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
	await requirePageUser();
	const { id } = await params;
	const ctx = await crmContext();
	const q = await getQuote(ctx.db, id);
	if (!q) notFound();
	const [cust, inq, items] = await Promise.all([
		ctx.db.prepare("SELECT name, email FROM customers WHERE id = ?").bind(q.customer_id).first<{ name: string; email: string | null }>(),
		q.inquiry_id ? ctx.db.prepare("SELECT reference FROM inquiries WHERE id = ?").bind(q.inquiry_id).first<{ reference: string }>() : Promise.resolve(null),
		ctx.db.prepare("SELECT description, quantity, unit_price FROM quote_items WHERE quote_id = ? ORDER BY sort_order").bind(id).all<{ description: string; quantity: number; unit_price: number }>(),
	]);
	const lines = (items.results ?? []).map((l) => ({ description: l.description, quantity: String(l.quantity), unitPrice: l.unit_price ? l.unit_price.toFixed(2) : "" }));

	return (
		<QuoteBuilder
			quoteId={q.id}
			quoteNumber={q.quote_number}
			version={q.version}
			inquiryId={q.inquiry_id}
			inquiryRef={inq?.reference ?? null}
			customer={{ name: cust?.name ?? "", email: cust?.email ?? null }}
			readOnly={q.status !== "draft"}
			mailConfigured={isMailConfigured(ctx.cfg)}
			initial={{
				journeyDescription: q.journey_description ?? "",
				vehicleCategory: q.vehicle_category ?? "",
				passengerCount: String(q.passenger_count ?? 1),
				luggageInfo: q.luggage_info ?? "",
				pickup: q.pickup_location ?? "",
				destination: q.dropoff_location ?? "",
				date: q.pickup_date ?? "",
				time: q.pickup_time ?? "",
				returnDate: q.return_date ?? "",
				returnTime: q.return_time ?? "",
				flightNumber: q.flight_number ?? "",
				currency: q.currency || "EUR",
				items: lines.length ? lines : [{ description: "", quantity: "1", unitPrice: "" }],
				discountType: q.discount_type,
				discountValue: q.discount_type ? String(q.discount_value ?? q.discount_amount ?? "") : "",
				feesAmount: q.fees_amount ? q.fees_amount.toFixed(2) : "",
				taxPercent: q.tax_percent ? String(q.tax_percent) : "",
				inclusions: q.inclusions ?? "",
				exclusions: q.exclusions ?? "",
				paymentTerms: q.payment_terms ?? ctx.settings.paymentTerms,
				cancellationTerms: q.cancellation_terms ?? ctx.settings.cancellationTerms,
				notes: q.notes ?? "",
				internalNotes: q.internal_notes ?? "",
				validUntil: q.valid_until ?? "",
			}}
		/>
	);
}
