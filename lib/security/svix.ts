// Svix-style webhook signature verification (used by Resend webhooks).
import { hmacSha256Base64, safeEqual } from "@/lib/security/crypto";

export async function verifySvixSignature(
	secret: string,
	h: { id: string | null; timestamp: string | null; signature: string | null },
	body: string,
	nowSeconds: number = Date.now() / 1000
): Promise<boolean> {
	if (!h.id || !h.timestamp || !h.signature) return false;
	if (!Number.isFinite(Number(h.timestamp)) || Math.abs(nowSeconds - Number(h.timestamp)) > 300) return false;
	let key: Uint8Array;
	try {
		key = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
	} catch {
		return false;
	}
	const expected = await hmacSha256Base64(key, `${h.id}.${h.timestamp}.${body}`);
	return h.signature.split(" ").some((part) => {
		const [version, sig] = part.split(",");
		return version === "v1" && !!sig && safeEqual(sig, expected);
	});
}
