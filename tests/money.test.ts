import { describe, expect, it } from "vitest";
import { computeTotals, MoneyError, parseDecimal } from "@/lib/crm/money";

describe("money", () => {
	it("avoids floating point drift", () => {
		const t = computeTotals({ items: [{ description: "A", quantity: 3, unitPrice: "0.1" }, { description: "B", quantity: 1, unitPrice: "0.2" }] });
		expect(t.subtotalCents).toBe(50);
		expect(t.totalCents).toBe(50);
	});
	it("applies percentage discount, fees and explicit tax in order", () => {
		const t = computeTotals({
			items: [{ description: "Transfer", quantity: 2, unitPrice: "100.00" }],
			discountType: "percentage", discountValue: "10", feesAmount: "20", taxPercent: "24",
		});
		expect(t.subtotalCents).toBe(20000);
		expect(t.discountCents).toBe(2000);
		expect(t.feesCents).toBe(2000);
		expect(t.taxCents).toBe(Math.round(20000 * 0.24)); // (200 - 20 + 20) * 24%
		expect(t.totalCents).toBe(20000 + 4800);
	});
	it("fixed discount, no tax by default", () => {
		const t = computeTotals({ items: [{ description: "x", quantity: 1, unitPrice: "150" }], discountType: "fixed", discountValue: "25.50" });
		expect(t.totalCents).toBe(12450);
		expect(t.taxCents).toBe(0);
	});
	it("rejects negatives, malformed amounts and excess discounts", () => {
		const item = (unitPrice: string, quantity: string | number = 1) => ({ description: "x", quantity, unitPrice });
		expect(() => computeTotals({ items: [item("-5")] })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [item("1e3")] })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [item("10.999")] })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [item("10", 0)] })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [item("10")], discountType: "fixed", discountValue: "11" })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [item("10")], discountType: "percentage", discountValue: "101" })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [] })).toThrow(MoneyError);
		expect(() => computeTotals({ items: [{ description: " ", quantity: 1, unitPrice: "1" }] })).toThrow(MoneyError);
	});
	it("parses decimals strictly", () => {
		expect(parseDecimal("1,234.5")).toBe(123450);
		expect(parseDecimal("abc")).toBeNull();
	});
});
