import { it } from "vitest";
import fs from "node:fs";
import { buildQuotationPdf } from "@/lib/pdf/quotation";
import { computeTotals } from "@/lib/crm/money";

// Writes a sample PDF for visual review when SAMPLE_PDF_OUT is set; otherwise a no-op.
it("renders a sample quotation", async () => {
	const out = process.env.SAMPLE_PDF_OUT;
	if (!out) return;
	const t = computeTotals({
		items: [
			{ description: "Airport transfer — Athens International Airport (ATH) to Athens city centre hotel, Mercedes V-Class", quantity: 1, unitPrice: "75" },
			{ description: "Return transfer, same vehicle, meet & greet in arrivals with name board", quantity: 1, unitPrice: "75" },
			{ description: "Child seat (x2)", quantity: 2, unitPrice: "5" },
		],
		discountType: "percentage", discountValue: "5", feesAmount: "0", taxPercent: 0,
	});
	const pdf = await buildQuotationPdf({
		quoteNumber: "GCS-Q-2026-0007", version: 2, issuedAt: "2026-10-09", validUntil: "2026-10-16", currency: "EUR",
		customer: { name: "Anna Papadopoulos", email: "anna@example.com", phone: "+447700900123" }, inquiryReference: "GCS-2026-00001",
		service: "Airport transfer",
		journey: { pickup: "Athens International Airport (ATH)", destination: "Hotel Grande Bretagne, Syntagma Square", date: "2026-11-02", time: "14:30", returnDate: "2026-11-09", returnTime: "09:00", passengers: "2", luggage: "3 suitcases", flight: "A3 601", description: "Private airport transfer with return, including meet & greet." },
		vehicle: "Mercedes V-Class (up to 7 passengers)", items: t.lines,
		totals: { subtotalCents: t.subtotalCents, discountCents: t.discountCents, feesCents: t.feesCents, taxCents: t.taxCents, totalCents: t.totalCents },
		discount: { type: "percentage", value: 5 }, taxPercent: 0,
		inclusions: "Meet & greet\nFlight monitoring\nWaiting time up to 60 minutes", exclusions: "Gratuities\nParking fees other than airport",
		paymentTerms: "50% deposit to confirm; balance on the day.", cancellationTerms: "Free cancellation up to 48 hours before pickup.",
		customerNotes: "Please confirm the hotel address closer to the date.",
		company: { name: "Greece Chauffeur Service", email: "greecechauffertransfers@gmail.com", phone: "", address: "", website: "https://greecechaufferservice.com", vat: "" },
	});
	fs.writeFileSync(out, pdf);
});
