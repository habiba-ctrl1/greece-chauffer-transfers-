import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createTestDb } from "./helpers/d1";
import { rateLimit } from "@/lib/security/rate-limit";
import { generateToken, hmacSha256Base64, safeEqual, sha256Hex } from "@/lib/security/crypto";
import { verifySvixSignature } from "@/lib/security/svix";
import { csvCell } from "@/lib/crm/queries";
import { esc, ownerNewInquiryEmail, customerAckEmail, quotationEmail } from "@/lib/email/templates";
import { getMailConfig } from "@/lib/env";

const root = path.resolve(__dirname, "..");

/** Server Actions are public HTTP endpoints: every exported action must authorize first. */
describe("every admin server action authorizes before doing anything", () => {
	const PUBLIC_ACTIONS = new Set(["lib/actions/leads.ts", "lib/actions/accept.ts", "lib/auth/actions.ts"]);
	const files = [
		...fs.readdirSync(path.join(root, "lib/actions")).map((f) => `lib/actions/${f}`),
		"lib/auth/actions.ts",
	].filter((f) => f.endsWith(".ts"));

	for (const rel of files) {
		const src = fs.readFileSync(path.join(root, rel), "utf8");
		if (!/^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use server["']/.test(src)) continue;
		it(rel, () => {
			const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true);
			const fns: { name: string; first: string }[] = [];
			sf.forEachChild((n) => {
				if (ts.isFunctionDeclaration(n) && n.body && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
					fns.push({ name: n.name!.text, first: n.body.statements[0]?.getText() ?? "" });
				}
			});
			expect(fns.length).toBeGreaterThan(0);
			if (PUBLIC_ACTIONS.has(rel)) return; // intentionally public; covered by validation/rate-limit tests
			for (const f of fns) {
				const guarded = /^await require(Admin|Owner)\(\)|^try \{\s*await require|guarded\(/.test(f.first) || /guarded\(async/.test(f.first) || /requireAdmin|requireOwner/.test(f.first);
				expect(guarded, `${rel}:${f.name} must call requireAdmin()/requireOwner() first (found: ${f.first.slice(0, 60)})`).toBe(true);
			}
		});
	}
});

describe("secrets never reach the browser", () => {
	it("client components don't import server-only config or secrets", () => {
		const offenders: string[] = [];
		const walk = (dir: string) => {
			for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
				const p = path.join(dir, e.name);
				if (e.isDirectory()) {
					if (!["node_modules", ".next", ".open-next", ".git", ".wrangler"].includes(e.name)) walk(p);
				} else if (/\.tsx?$/.test(e.name)) {
					const src = fs.readFileSync(p, "utf8");
					if (/^\s*["']use client["']/.test(src) && /@\/lib\/env|process\.env\.(?!NEXT_PUBLIC)/.test(src)) offenders.push(path.relative(root, p));
				}
			}
		};
		for (const d of ["app", "components"]) walk(path.join(root, d));
		expect(offenders).toEqual([]);
	});
	it("no secret-like literals are committed in source", () => {
		const hits: string[] = [];
		const walk = (dir: string) => {
			for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
				const p = path.join(dir, e.name);
				if (e.isDirectory()) {
					if (!["node_modules", ".next", ".open-next", ".git", ".wrangler", "tests"].includes(e.name)) walk(p);
				} else if (/\.(tsx?|jsonc?|ya?ml|md)$/.test(e.name) && e.name !== "package-lock.json" && !e.name.endsWith(".d.ts")) {
					const src = fs.readFileSync(p, "utf8");
					if (/re_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9+/=]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY/.test(src)) hits.push(path.relative(root, p));
				}
			}
		};
		walk(root);
		expect(hits).toEqual([]);
	});
});

describe("rate limiting", () => {
	it("allows up to the limit then blocks within the window, and resets in a new window", async () => {
		const { db } = createTestDb();
		const t = 1_000_000_000_000;
		const results = [];
		for (let i = 0; i < 5; i++) results.push((await rateLimit(db, "k", 3, 60, t)).allowed);
		expect(results).toEqual([true, true, true, false, false]);
		expect((await rateLimit(db, "other", 3, 60, t)).allowed).toBe(true);
		expect((await rateLimit(db, "k", 3, 60, t + 61_000)).allowed).toBe(true);
	});
});

describe("tokens & signatures", () => {
	it("generates long unpredictable tokens and hashes them", async () => {
		const a = generateToken();
		const b = generateToken();
		expect(a).not.toBe(b);
		expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(await sha256Hex(a)).toMatch(/^[0-9a-f]{64}$/);
		expect(safeEqual("abc", "abc")).toBe(true);
		expect(safeEqual("abc", "abd")).toBe(false);
		expect(safeEqual("abc", "abcd")).toBe(false);
	});
	it("verifies Svix/Resend webhook signatures and rejects tampering and replays", async () => {
		const keyBytes = crypto.getRandomValues(new Uint8Array(24));
		const secret = `whsec_${btoa(String.fromCharCode(...keyBytes))}`;
		const body = JSON.stringify({ type: "email.delivered", data: { email_id: "x" } });
		const now = Math.floor(Date.now() / 1000);
		const sig = await hmacSha256Base64(keyBytes, `msg_1.${now}.${body}`);
		const h = { id: "msg_1", timestamp: String(now), signature: `v1,${sig}` };
		expect(await verifySvixSignature(secret, h, body)).toBe(true);
		expect(await verifySvixSignature(secret, h, body + " ")).toBe(false);
		expect(await verifySvixSignature(secret, { ...h, signature: "v1,AAAA" }, body)).toBe(false);
		expect(await verifySvixSignature(secret, { ...h, timestamp: String(now - 4000) }, body)).toBe(false);
		expect(await verifySvixSignature(secret, { id: null, timestamp: null, signature: null }, body)).toBe(false);
	});
});

describe("output encoding", () => {
	const brand = { name: "Greece Chauffeur Service", email: "greecechauffertransfers@gmail.com" };
	const evil = '<script>alert(1)</script><img src=x onerror=alert(2)>"\'';
	it("escapes customer-controlled text in every email", () => {
		const d = { reference: "GCS-1", firstName: evil, lastName: evil, email: "a@b.co", phone: "+1234567", service: "airport_transfer", pickup: evil, destination: evil, date: "2030-01-01", time: "10:00", adults: 1, children: 0, details: { hotel: evil }, notes: evil };
		for (const m of [ownerNewInquiryEmail(brand, d, "https://x.test/a"), customerAckEmail(brand, d), quotationEmail(brand, { customerName: evil, quoteNumber: "Q", version: 1, journeySummary: evil, totalFormatted: "€1", validUntil: "2030-01-01", acceptUrl: "https://x.test/q", pdfName: "q.pdf" })]) {
			expect(m.html).not.toContain("<script>");
			expect(m.html).not.toContain("<img");
			expect(m.subject).not.toMatch(/[\r\n]/);
		}
		expect(esc(evil)).not.toContain("<");
	});
	it("neutralises CSV formula injection", () => {
		expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
		expect(csvCell("+1")).toBe("\"'+1\"");
		expect(csvCell('say "hi"')).toBe('"say ""hi"""');
	});
});

describe("email configuration", () => {
	it("defaults the owner notification inbox to the business address", () => {
		expect(getMailConfig().notifyTo).toBe("greecechauffertransfers@gmail.com");
	});
	it("ignores an invalid override and never uses the customer as sender", () => {
		process.env.BOOKING_NOTIFICATION_EMAIL = "not an email";
		expect(getMailConfig().notifyTo).toBe("greecechauffertransfers@gmail.com");
		delete process.env.BOOKING_NOTIFICATION_EMAIL;
		expect(getMailConfig().fromAddress).toBeUndefined();
	});
});
