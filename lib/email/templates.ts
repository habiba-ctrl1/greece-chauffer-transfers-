// ============================================================
// Email templates (pure functions → { subject, html, text })
// ============================================================
// Every dynamic value is HTML-escaped. No claims about availability, response
// times, prices or reservations are made beyond what the record states.
import { SERVICE_LABELS, type ServiceType } from "@/lib/crm/inquiry-input";

export interface RenderedEmail {
	subject: string;
	html: string;
	text: string;
}

export const esc = (v: unknown): string =>
	String(v ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

/** Header-safe single line (subjects). */
const line = (v: unknown) => String(v ?? "").replace(/[\r\n]+/g, " ").trim();

export interface BrandInfo {
	name: string;
	email: string;
	phone?: string;
	website?: string;
}

const NAVY = "#14243A";
const GOLD = "#C6A76A";

function layout(brand: BrandInfo, title: string, bodyHtml: string): string {
	return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F6F7F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #E3E6EB;">
<tr><td style="background:${NAVY};padding:24px 28px;border-bottom:3px solid ${GOLD};">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:.5px;color:#ffffff;">${esc(brand.name)}</div>
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};margin-top:4px;">Private chauffeur &amp; transfers</div></td></tr>
<tr><td style="padding:28px;line-height:1.6;font-size:15px;">${bodyHtml}</td></tr>
<tr><td style="background:#F6F7F9;padding:18px 28px;font-size:12px;color:#64748B;border-top:1px solid #E3E6EB;">
${esc(brand.name)} · <a href="mailto:${esc(brand.email)}" style="color:#64748B;">${esc(brand.email)}</a>${brand.phone ? ` · ${esc(brand.phone)}` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

function rows(pairs: [string, unknown][]): string {
	const body = pairs
		.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
		.map(
			([k, v]) =>
				`<tr><td style="padding:6px 12px 6px 0;color:#64748B;font-size:13px;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#172033;">${esc(v).replace(/\n/g, "<br>")}</td></tr>`
		)
		.join("");
	return `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">${body}</table>`;
}

const button = (href: string, label: string) =>
	`<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;border:1px solid ${GOLD};">${esc(label)}</a></p>`;

const textRows = (pairs: [string, unknown][]) =>
	pairs
		.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");

export interface InquiryEmailData {
	reference: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	service: ServiceType | string;
	pickup: string;
	destination?: string | null;
	date: string;
	time?: string | null;
	returnDate?: string | null;
	returnTime?: string | null;
	adults: number;
	children: number;
	luggage?: string | null;
	vehicle?: string | null;
	notes?: string | null;
	details: Record<string, string>;
	sourcePage?: string | null;
}

const serviceLabel = (s: string) => SERVICE_LABELS[s as ServiceType] ?? s;
const DETAIL_LABELS: Record<string, string> = {
	airport: "Airport", flight_number: "Flight number", airline: "Airline", arrival_details: "Arrival details",
	port: "Port", ferry_details: "Ferry / cruise details", hotel: "Hotel / accommodation",
	child_seats: "Child seats", child_seat_types: "Child seat types", duration_hours: "Duration (hours)",
	duration_days: "Duration (days)", stops: "Stops / itinerary", tour_preferences: "Tour preferences",
	meet_greet: "Meet & greet", special: "Special requirements",
};

function inquiryPairs(d: InquiryEmailData): [string, unknown][] {
	const detailPairs = Object.entries(d.details).map(([k, v]) => [DETAIL_LABELS[k] ?? k, v] as [string, unknown]);
	return [
		["Reference", d.reference],
		["Service", serviceLabel(d.service)],
		["Pickup", d.pickup],
		["Drop-off", d.destination],
		["Date", d.date],
		["Time", d.time],
		["Return", d.returnDate ? `${d.returnDate}${d.returnTime ? ` ${d.returnTime}` : ""}` : ""],
		["Passengers", `${d.adults} adult(s)${d.children ? `, ${d.children} child(ren)` : ""}`],
		["Luggage", d.luggage],
		["Vehicle preference", d.vehicle],
		...detailPairs,
		["Notes", d.notes],
	];
}

export function ownerNewInquiryEmail(brand: BrandInfo, d: InquiryEmailData, adminUrl: string): RenderedEmail {
	const subject = line(`New Booking Inquiry — ${d.reference} — ${serviceLabel(d.service)}`);
	const customer: [string, unknown][] = [
		["Customer", `${d.firstName} ${d.lastName}`],
		["Email", d.email],
		["Phone", d.phone],
	];
	const all = [...customer, ...inquiryPairs(d), ["Source page", d.sourcePage] as [string, unknown]];
	const html = layout(
		brand,
		subject,
		`<h2 style="margin:0 0 4px;font-family:Georgia,serif;color:${NAVY};">New booking inquiry</h2>
<p style="margin:0 0 16px;color:#64748B;">A customer has submitted a request through the website. It is saved in the dashboard.</p>
${rows(all)}${button(adminUrl, "Open in dashboard")}`
	);
	return { subject, html, text: `${subject}\n\n${textRows(all)}\n\nOpen: ${adminUrl}` };
}

export function customerAckEmail(brand: BrandInfo, d: InquiryEmailData): RenderedEmail {
	const subject = line(`We Have Received Your Chauffeur Request — ${d.reference}`);
	const summary: [string, unknown][] = inquiryPairs(d).filter(([k]) => ["Reference", "Service", "Pickup", "Drop-off", "Date", "Time", "Passengers"].includes(k));
	const html = layout(
		brand,
		subject,
		`<h2 style="margin:0 0 12px;font-family:Georgia,serif;color:${NAVY};">Thank you, ${esc(d.firstName)}.</h2>
<p>We have received your request. Your reference is <strong>${esc(d.reference)}</strong>.</p>
<p>Our team will review your journey and availability and come back to you with a quotation. This message is an acknowledgement only — it is not a booking confirmation, and no vehicle or price is reserved until you receive and accept a quotation from us.</p>
${rows(summary)}
<p style="margin-top:20px;">If you need to add or change anything, simply reply to this email quoting your reference.</p>`
	);
	return {
		subject,
		html,
		text: `Thank you, ${d.firstName}.\n\nWe have received your request (${d.reference}). Our team will review your journey and availability and come back to you with a quotation. This is an acknowledgement only — not a booking confirmation; no vehicle or price is reserved until you receive and accept a quotation.\n\n${textRows(summary)}\n\nReply to this email to add or change anything.`,
	};
}

export interface QuotationEmailData {
	customerName: string;
	quoteNumber: string;
	version: number;
	journeySummary: string;
	totalFormatted: string;
	validUntil: string;
	acceptUrl?: string | null;
	pdfName: string;
}

export function quotationEmail(brand: BrandInfo, q: QuotationEmailData): RenderedEmail {
	const subject = line(`Your Chauffeur Service Quotation — ${q.quoteNumber}`);
	const html = layout(
		brand,
		subject,
		`<h2 style="margin:0 0 12px;font-family:Georgia,serif;color:${NAVY};">Dear ${esc(q.customerName)},</h2>
<p>Thank you for your enquiry. Please find our quotation attached as a PDF (<em>${esc(q.pdfName)}</em>).</p>
${rows([
	["Quotation", `${q.quoteNumber}${q.version > 1 ? ` (version ${q.version})` : ""}`],
	["Journey", q.journeySummary],
	["Total", q.totalFormatted],
	["Valid until", q.validUntil],
])}
<p style="margin-top:20px;"><strong>Next steps:</strong> to proceed, ${q.acceptUrl ? "use the button below to let us know you would like to go ahead, or " : ""}reply to this email. Your booking is only confirmed once we have confirmed it back to you in writing.</p>
${q.acceptUrl ? button(q.acceptUrl, "Accept this quotation") : ""}
<p style="color:#64748B;font-size:13px;">If anything needs changing, just reply to this email and we will update the quotation.</p>`
	);
	return {
		subject,
		html,
		text: `Dear ${q.customerName},\n\nPlease find our quotation ${q.quoteNumber} attached.\n\nJourney: ${q.journeySummary}\nTotal: ${q.totalFormatted}\nValid until: ${q.validUntil}\n\nTo proceed${q.acceptUrl ? `, accept online: ${q.acceptUrl} — or` : ","} reply to this email. Your booking is only confirmed once we confirm it back to you in writing.`,
	};
}

export interface BookingConfirmationData {
	customerName: string;
	bookingNumber: string;
	journey: [string, unknown][];
	totalFormatted: string;
	paymentTerms?: string | null;
	cancellationTerms?: string | null;
}

export function bookingConfirmationEmail(brand: BrandInfo, b: BookingConfirmationData): RenderedEmail {
	const subject = line(`Booking Confirmed — ${b.bookingNumber}`);
	const pairs: [string, unknown][] = [["Booking reference", b.bookingNumber], ...b.journey, ["Agreed amount", b.totalFormatted]];
	const html = layout(
		brand,
		subject,
		`<h2 style="margin:0 0 12px;font-family:Georgia,serif;color:${NAVY};">Your booking is confirmed</h2>
<p>Dear ${esc(b.customerName)}, we are pleased to confirm the following booking.</p>
${rows(pairs)}
${b.paymentTerms ? `<p style="margin-top:16px;"><strong>Payment:</strong><br>${esc(b.paymentTerms).replace(/\n/g, "<br>")}</p>` : ""}
${b.cancellationTerms ? `<p><strong>Cancellation &amp; amendments:</strong><br>${esc(b.cancellationTerms).replace(/\n/g, "<br>")}</p>` : ""}
<p style="margin-top:16px;">If anything changes, such as flight times, please reply to this email.</p>`
	);
	return {
		subject,
		html,
		text: `Dear ${b.customerName}, your booking is confirmed.\n\n${textRows(pairs)}\n${b.paymentTerms ? `\nPayment: ${b.paymentTerms}` : ""}${b.cancellationTerms ? `\nCancellation: ${b.cancellationTerms}` : ""}`,
	};
}

export function customerFollowUpEmail(brand: BrandInfo, name: string, reference: string, quoteNumber?: string | null): RenderedEmail {
	const subject = line(`Following up on your chauffeur request — ${reference}`);
	const html = layout(
		brand,
		subject,
		`<p>Dear ${esc(name)},</p>
<p>We are following up on your chauffeur request <strong>${esc(reference)}</strong>${quoteNumber ? ` and our quotation <strong>${esc(quoteNumber)}</strong>` : ""}. If you have any questions, or would like us to adjust anything, just reply to this email.</p>
<p style="color:#64748B;font-size:13px;">If you no longer need this journey, please let us know and we will close the request.</p>`
	);
	return { subject, html, text: `Dear ${name},\n\nWe are following up on your chauffeur request ${reference}${quoteNumber ? ` and quotation ${quoteNumber}` : ""}. Reply to this email with any questions or changes.` };
}

export function ownerQuoteAcceptedEmail(brand: BrandInfo, reference: string, quoteNumber: string, customer: string, adminUrl: string): RenderedEmail {
	const subject = line(`Quotation accepted — ${quoteNumber} (${reference})`);
	const html = layout(
		brand,
		subject,
		`<h2 style="margin:0 0 12px;font-family:Georgia,serif;color:${NAVY};">Customer accepted a quotation</h2>
<p>${esc(customer)} accepted <strong>${esc(quoteNumber)}</strong> for inquiry <strong>${esc(reference)}</strong>. The booking is <strong>not</strong> confirmed yet — review availability and confirm it in the dashboard.</p>${button(adminUrl, "Open inquiry")}`
	);
	return { subject, html, text: `${customer} accepted ${quoteNumber} (${reference}). Not confirmed yet — open: ${adminUrl}` };
}

export interface DigestItem {
	reference: string;
	customer: string;
	status: string;
	due: string;
	url: string;
}

export function followUpDigestEmail(brand: BrandInfo, items: DigestItem[], failed: number, dashboardUrl: string): RenderedEmail {
	const subject = line(`Follow-ups due — ${items.length} inquir${items.length === 1 ? "y" : "ies"}${failed ? ` · ${failed} email failure(s)` : ""}`);
	const list = items
		.map((i) => `<li style="margin-bottom:6px;"><a href="${esc(i.url)}" style="color:${NAVY};font-weight:600;">${esc(i.reference)}</a> — ${esc(i.customer)} <span style="color:#64748B;">(${esc(i.status)}, due ${esc(i.due)})</span></li>`)
		.join("");
	const html = layout(
		brand,
		subject,
		`<h2 style="margin:0 0 12px;font-family:Georgia,serif;color:${NAVY};">Follow-ups due</h2>
${items.length ? `<ul style="padding-left:18px;">${list}</ul>` : ""}
${failed ? `<p style="color:#C2413B;">${failed} outbound email(s) failed and need attention.</p>` : ""}${button(dashboardUrl, "Open dashboard")}`
	);
	return {
		subject,
		html,
		text: `${items.map((i) => `${i.reference} — ${i.customer} (${i.status}, due ${i.due}) ${i.url}`).join("\n")}${failed ? `\n${failed} email failure(s).` : ""}\n${dashboardUrl}`,
	};
}

export function testEmail(brand: BrandInfo): RenderedEmail {
	const subject = "Test email — Greece Chauffeur Service";
	return {
		subject,
		html: layout(brand, subject, `<p>This is a test email from the admin dashboard. If you can read it, the sender is working.</p>`),
		text: "This is a test email from the admin dashboard. If you can read it, the sender is working.",
	};
}
