// ============================================================
// Auth — Password Hashing (Web Crypto API)
// ============================================================
// Uses PBKDF2 with SHA-256, which is available on Cloudflare Workers.

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function hexToBuffer(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

/**
 * Hash a password using PBKDF2-SHA256.
 * Returns a string in the format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt.buffer as ArrayBuffer,
			iterations: ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		KEY_LENGTH * 8
	);

	return `${bufferToHex(salt)}:${bufferToHex(derivedBits)}`;
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(
	password: string,
	storedHash: string
): Promise<boolean> {
	const [saltHex, hashHex] = storedHash.split(":");
	if (!saltHex || !hashHex) return false;

	const salt = hexToBuffer(saltHex);
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt.buffer as ArrayBuffer,
			iterations: ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		KEY_LENGTH * 8
	);

	const derivedHex = bufferToHex(derivedBits);

	// Constant-time comparison
	if (derivedHex.length !== hashHex.length) return false;
	let result = 0;
	for (let i = 0; i < derivedHex.length; i++) {
		result |= derivedHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
	}
	return result === 0;
}
