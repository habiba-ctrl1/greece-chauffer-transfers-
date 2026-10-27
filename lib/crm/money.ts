// Decimal-safe money maths: everything is computed in integer cents
// (quantities in hundredths, percentages in basis points).

export type DiscountType = "fixed" | "percentage";

export interface LineInput {
	description: string;
	quantity: number | string;
	unitPrice: number | string;
}

export interface TotalsInput {
	items: LineInput[];
	discountType?: DiscountType | null;
	/** Fixed: currency amount. Percentage: 0–100 (max 2 decimals). */
	discountValue?: number | string | null;
	/** Additional charges, e.g. tolls/parking — explicit, never assumed. */
	feesAmount?: number | string | null;
	/** Tax percentage — 0 unless the business explicitly configures one. */
	taxPercent?: number | string | null;
}

export interface Totals {
	lines: { description: string; quantity: number; unitPriceCents: number; totalCents: number }[];
	subtotalCents: number;
	discountCents: number;
	feesCents: number;
	taxCents: number;
	totalCents: number;
}

const MAX_CENTS = 10_000_000_000; // 100M — sanity ceiling

export class MoneyError extends Error {}

/** Strict decimal parse → scaled integer (scale 100 = 2 decimals). null = malformed/negative. */
export function parseDecimal(input: number | string | null | undefined, scale = 100): number | null {
	if (input === null || input === undefined || input === "") return 0;
	const s = String(input).trim().replace(/,/g, "");
	const digits = String(scale).length - 1;
	const re = new RegExp(`^\\d{1,12}(\\.\\d{1,${digits}})?$`);
	if (!re.test(s)) return null;
	const [whole, frac = ""] = s.split(".");
	return Number(whole) * scale + Number(frac.padEnd(digits, "0"));
}

export const toCents = (v: number | string | null | undefined) => parseDecimal(v, 100);

export function computeTotals(input: TotalsInput): Totals {
	if (!input.items.length) throw new MoneyError("Add at least one line item.");
	if (input.items.length > 50) throw new MoneyError("Too many line items (max 50).");

	const lines = input.items.map((it, i) => {
		const qtyH = parseDecimal(it.quantity, 100);
		const unit = toCents(it.unitPrice);
		const desc = String(it.description ?? "").trim();
		if (!desc) throw new MoneyError(`Line ${i + 1}: description is required.`);
		if (qtyH === null || qtyH <= 0 || qtyH > 100000) throw new MoneyError(`Line ${i + 1}: quantity must be greater than 0.`);
		if (unit === null) throw new MoneyError(`Line ${i + 1}: enter a valid price (no negatives).`);
		return { description: desc, quantity: qtyH / 100, unitPriceCents: unit, totalCents: Math.round((qtyH * unit) / 100) };
	});

	const subtotalCents = lines.reduce((s, l) => s + l.totalCents, 0);

	let discountCents = 0;
	if (input.discountType === "fixed") {
		const d = toCents(input.discountValue);
		if (d === null) throw new MoneyError("Discount must be a valid positive amount.");
		discountCents = d;
	} else if (input.discountType === "percentage") {
		const bp = parseDecimal(input.discountValue, 100); // percent with 2 decimals == basis points
		if (bp === null || bp > 10000) throw new MoneyError("Discount percentage must be between 0 and 100.");
		discountCents = Math.round((subtotalCents * bp) / 10000);
	}
	if (discountCents > subtotalCents) throw new MoneyError("Discount cannot exceed the subtotal.");

	const feesCents = toCents(input.feesAmount);
	if (feesCents === null) throw new MoneyError("Additional charges must be a valid positive amount.");

	const taxBp = parseDecimal(input.taxPercent, 100);
	if (taxBp === null || taxBp > 10000) throw new MoneyError("Tax percentage must be between 0 and 100.");
	const taxable = subtotalCents - discountCents + feesCents;
	const taxCents = Math.round((taxable * taxBp) / 10000);

	const totalCents = taxable + taxCents;
	if (totalCents > MAX_CENTS) throw new MoneyError("Total is unreasonably large.");

	return { lines, subtotalCents, discountCents, feesCents, taxCents, totalCents };
}

export const centsToAmount = (c: number) => c / 100;

export function formatMoney(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}
