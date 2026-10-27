// ============================================================
// Quotation PDF (pdf-lib — pure JS, runs on Cloudflare Workers)
// ============================================================
// Rendered from the frozen QuoteSnapshot, so regenerating a sent version
// always yields the document the customer received. Standard PDF fonts are
// used (no font files to ship); Greek text is transliterated and other
// non-Latin characters are replaced so nothing is ever clipped or garbled.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { QuoteSnapshot } from "@/lib/crm/quotes";
import { formatMoney } from "@/lib/crm/money";

const NAVY = rgb(0x14 / 255, 0x24 / 255, 0x3a / 255);
const GOLD = rgb(0xc6 / 255, 0xa7 / 255, 0x6a / 255);
const TEXT = rgb(0x17 / 255, 0x20 / 255, 0x33 / 255);
const MUTED = rgb(0x64 / 255, 0x74 / 255, 0x8b / 255);
const RULE = rgb(0xe3 / 255, 0xe6 / 255, 0xeb / 255);
const PAPER = rgb(0xf6 / 255, 0xf7 / 255, 0xf9 / 255);

const GREEK: Record<string, string> = {
	α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r",
	σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o", ά: "a", έ: "e", ή: "i", ί: "i", ό: "o", ύ: "y", ώ: "o", ϊ: "i", ϋ: "y", ΐ: "i", ΰ: "y",
};
const translit = (s: string) =>
	s.replace(/[Ͱ-Ͽἀ-῿]/g, (ch) => {
		const lower = GREEK[ch.toLowerCase()];
		if (lower === undefined) return "?";
		return ch === ch.toLowerCase() ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
	});

function makeSafe(font: PDFFont) {
	const set = new Set(font.getCharacterSet());
	return (input: string) => {
		const t = translit(String(input ?? "").normalize("NFC")).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/→/g, "->");
		let out = "";
		for (const ch of t) {
			const cp = ch.codePointAt(0)!;
			if (ch === "\n" || ch === "\t") out += ch === "\t" ? "    " : "\n";
			else if (cp < 32) continue;
			else out += set.has(cp) ? ch : "?";
		}
		return out;
	};
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;
const CONTENT_W = PAGE_W - M * 2;
const FOOTER_RESERVE = 56;

export async function buildQuotationPdf(s: QuoteSnapshot): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.setTitle(`Quotation ${s.quoteNumber}`);
	pdf.setAuthor(s.company.name);
	pdf.setProducer("Greece Chauffeur Service");
	const serif = await pdf.embedFont(StandardFonts.TimesRoman);
	const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const sans = await pdf.embedFont(StandardFonts.Helvetica);
	const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const safe = makeSafe(sans);

	let page!: PDFPage;
	let y = 0;

	const wrap = (text: string, font: PDFFont, size: number, width: number): string[] => {
		const lines: string[] = [];
		for (const para of safe(text).split("\n")) {
			if (!para.trim()) {
				lines.push("");
				continue;
			}
			let line = "";
			for (const word of para.split(/\s+/)) {
				// Break over-long words (e.g. URLs) so they can never overflow.
				let w = word;
				while (font.widthOfTextAtSize(w, size) > width) {
					let cut = w.length - 1;
					while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
					if (line) {
						lines.push(line);
						line = "";
					}
					lines.push(w.slice(0, cut));
					w = w.slice(cut);
				}
				const test = line ? `${line} ${w}` : w;
				if (font.widthOfTextAtSize(test, size) <= width) line = test;
				else {
					lines.push(line);
					line = w;
				}
			}
			if (line) lines.push(line);
		}
		return lines;
	};

	const newPage = (first = false) => {
		page = pdf.addPage([PAGE_W, PAGE_H]);
		if (first) {
			page.drawRectangle({ x: 0, y: PAGE_H - 118, width: PAGE_W, height: 118, color: NAVY });
			page.drawRectangle({ x: 0, y: PAGE_H - 121, width: PAGE_W, height: 3, color: GOLD });
			page.drawText(safe(s.company.name), { x: M, y: PAGE_H - 54, size: 22, font: serifBold, color: rgb(1, 1, 1) });
			page.drawText("PRIVATE CHAUFFEUR & TRANSFERS", { x: M, y: PAGE_H - 74, size: 8, font: sansBold, color: GOLD });
			const right = (t: string, yy: number, font: PDFFont, size: number, color = rgb(1, 1, 1)) =>
				page.drawText(t, { x: PAGE_W - M - font.widthOfTextAtSize(t, size), y: yy, size, font, color });
			right("QUOTATION", PAGE_H - 52, serifBold, 18, GOLD);
			right(`${safe(s.quoteNumber)}${s.version > 1 ? `  (version ${s.version})` : ""}`, PAGE_H - 70, sansBold, 10);
			right(`Issued ${s.issuedAt}   ·   Valid until ${s.validUntil}`, PAGE_H - 86, sans, 8.5, rgb(0.85, 0.88, 0.92));
			y = PAGE_H - 121 - 30;
		} else {
			page.drawRectangle({ x: 0, y: PAGE_H - 34, width: PAGE_W, height: 34, color: NAVY });
			page.drawText(safe(`${s.company.name}  ·  Quotation ${s.quoteNumber}`), { x: M, y: PAGE_H - 22, size: 9, font: sansBold, color: rgb(1, 1, 1) });
			y = PAGE_H - 34 - 28;
		}
	};
	const ensure = (h: number) => {
		if (y - h < FOOTER_RESERVE) newPage();
	};

	const heading = (t: string) => {
		ensure(40);
		page.drawText(t.toUpperCase(), { x: M, y, size: 8.5, font: sansBold, color: GOLD });
		y -= 6;
		page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.6, color: RULE });
		y -= 16;
	};

	const paragraph = (t: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; width?: number } = {}) => {
		const size = opts.size ?? 10;
		const font = opts.font ?? sans;
		const lh = size * 1.45;
		for (const l of wrap(t, font, size, opts.width ?? CONTENT_W)) {
			ensure(lh);
			if (l) page.drawText(l, { x: opts.x ?? M, y, size, font, color: opts.color ?? TEXT });
			y -= lh;
		}
	};

	const kv = (pairs: [string, string][], labelW = 112) => {
		for (const [k, v] of pairs) {
			if (!v || !String(v).trim()) continue;
			const lines = wrap(v, sans, 10, CONTENT_W - labelW);
			ensure(lines.length * 14 + 2);
			page.drawText(safe(k), { x: M, y, size: 9, font: sans, color: MUTED });
			for (const l of lines) {
				page.drawText(l, { x: M + labelW, y, size: 10, font: sans, color: TEXT });
				y -= 14;
			}
			y -= 2;
		}
	};

	newPage(true);

	// Prepared for
	heading("Prepared for");
	kv([
		["Customer", s.customer.name],
		["Email", s.customer.email],
		["Phone", s.customer.phone ?? ""],
		["Inquiry reference", s.inquiryReference ?? ""],
	]);
	y -= 10;

	// Journey
	heading("Journey");
	if (s.journey.description) {
		paragraph(s.journey.description, { size: 10.5, font: serif });
		y -= 4;
	}
	kv([
		["Service", s.service],
		["Pickup", s.journey.pickup],
		["Drop-off", s.journey.destination],
		["Date & time", [s.journey.date, s.journey.time].filter(Boolean).join("  at  ")],
		["Return", [s.journey.returnDate, s.journey.returnTime].filter(Boolean).join("  at  ")],
		["Flight", s.journey.flight],
		["Vehicle / category", s.vehicle],
		["Passengers", s.journey.passengers],
		["Luggage", s.journey.luggage],
	]);
	y -= 10;

	// Items
	heading("Quotation");
	const colQty = M + CONTENT_W - 190;
	const colUnit = M + CONTENT_W - 120;
	const colTotal = M + CONTENT_W;
	const drawHeaderRow = () => {
		ensure(28);
		page.drawRectangle({ x: M, y: y - 6, width: CONTENT_W, height: 20, color: PAPER });
		page.drawText("DESCRIPTION", { x: M + 8, y, size: 7.5, font: sansBold, color: MUTED });
		for (const [label, x] of [["QTY", colQty], ["UNIT PRICE", colUnit], ["AMOUNT", colTotal]] as const) {
			page.drawText(label, { x: x - sansBold.widthOfTextAtSize(label, 7.5) - (label === "QTY" ? 8 : 0), y, size: 7.5, font: sansBold, color: MUTED });
		}
		y -= 22;
	};
	drawHeaderRow();
	for (const it of s.items) {
		const lines = wrap(it.description, sans, 10, colQty - M - 80);
		const h = lines.length * 14 + 8;
		if (y - h < FOOTER_RESERVE) {
			newPage();
			drawHeaderRow();
		}
		lines.forEach((l, i) => page.drawText(l, { x: M + 8, y: y - i * 14, size: 10, font: sans, color: TEXT }));
		const num = (t: string, x: number) => page.drawText(t, { x: x - sans.widthOfTextAtSize(t, 10) - (x === colQty ? 8 : 0), y, size: 10, font: sans, color: TEXT });
		num(String(it.quantity), colQty);
		num(formatMoney(it.unitPriceCents, s.currency), colUnit);
		num(formatMoney(it.totalCents, s.currency), colTotal);
		y -= h - 2;
		page.drawLine({ start: { x: M, y: y + 4 }, end: { x: PAGE_W - M, y: y + 4 }, thickness: 0.4, color: RULE });
	}
	y -= 10;

	// Totals
	const totalRows: [string, string, boolean][] = [["Subtotal", formatMoney(s.totals.subtotalCents, s.currency), false]];
	if (s.totals.discountCents) {
		totalRows.push([s.discount.type === "percentage" && s.discount.value ? `Discount (${s.discount.value}%)` : "Discount", `-${formatMoney(s.totals.discountCents, s.currency)}`, false]);
	}
	if (s.totals.feesCents) totalRows.push(["Additional charges", formatMoney(s.totals.feesCents, s.currency), false]);
	if (s.totals.taxCents || s.taxPercent) totalRows.push([`Tax (${s.taxPercent}%)`, formatMoney(s.totals.taxCents, s.currency), false]);
	ensure(totalRows.length * 18 + 60);
	for (const [k, v] of totalRows) {
		page.drawText(k, { x: colUnit - 70, y, size: 10, font: sans, color: MUTED });
		page.drawText(v, { x: colTotal - sans.widthOfTextAtSize(v, 10), y, size: 10, font: sans, color: TEXT });
		y -= 18;
	}
	y -= 10;
	page.drawRectangle({ x: colUnit - 78, y: y - 9, width: colTotal - colUnit + 78, height: 28, color: NAVY });
	page.drawText(`TOTAL (${s.currency})`, { x: colUnit - 68, y: y, size: 9, font: sansBold, color: GOLD });
	const tot = formatMoney(s.totals.totalCents, s.currency);
	page.drawText(tot, { x: colTotal - 8 - serifBold.widthOfTextAtSize(tot, 14), y: y - 1, size: 14, font: serifBold, color: rgb(1, 1, 1) });
	y -= 44;

	// Notes + terms
	const block = (title: string, text: string) => {
		if (!text.trim()) return;
		heading(title);
		paragraph(text);
		y -= 8;
	};
	block("Notes", s.customerNotes);
	block("Included", s.inclusions);
	block("Not included", s.exclusions);
	block("Payment terms", s.paymentTerms);
	block("Cancellation & amendments", s.cancellationTerms);

	heading("Validity & how to proceed");
	paragraph(`This quotation is valid until ${s.validUntil}. Prices and availability are not guaranteed after that date. To proceed, reply to the email this quotation came with${s.company.email ? ` or contact ${s.company.email}` : ""}. A booking is confirmed only once we have confirmed it to you in writing.`);

	// Footer on every page
	const pages = pdf.getPages();
	pages.forEach((p, i) => {
		p.drawLine({ start: { x: M, y: 40 }, end: { x: PAGE_W - M, y: 40 }, thickness: 0.5, color: RULE });
		const left = safe([s.company.name, s.company.email, s.company.phone, s.company.website].filter(Boolean).join("  ·  "));
		p.drawText(left, { x: M, y: 26, size: 7.5, font: sans, color: MUTED });
		const pn = `Page ${i + 1} of ${pages.length}`;
		p.drawText(pn, { x: PAGE_W - M - sans.widthOfTextAtSize(pn, 7.5), y: 26, size: 7.5, font: sans, color: MUTED });
		const legal = safe([s.company.address, s.company.vat ? `VAT ${s.company.vat}` : ""].filter(Boolean).join("  ·  "));
		if (legal) p.drawText(legal, { x: M, y: 15, size: 7, font: sans, color: MUTED });
	});

	return pdf.save();
}
