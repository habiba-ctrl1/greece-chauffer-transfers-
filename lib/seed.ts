// ============================================================
// Seed Script — Create First Super Admin User
// ============================================================
// Run locally: npx tsx lib/seed.ts
// Or apply the generated SQL via: wrangler d1 execute ...
//
// This script outputs the SQL INSERT statement with the hashed
// password so you can apply it to D1 directly.

import { hashPassword } from "./auth/password";
import { generateId } from "./utils";

const ADMIN_EMAIL = "admin@greecechauffeur.com";
const ADMIN_PASSWORD = "Admin@123456"; // Default initial admin password
const ADMIN_NAME = "Admin";

async function main() {
	const id = generateId();
	const hash = await hashPassword(ADMIN_PASSWORD);

	const sql = `INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status)
VALUES ('${id}', '${ADMIN_EMAIL}', '${hash}', '${ADMIN_NAME}', 'super_admin', 'active');`;

	console.log("=== Seed SQL for first admin user ===");
	console.log("");
	console.log(sql);
	console.log("");
	console.log(`Email:    ${ADMIN_EMAIL}`);
	console.log(`Password: ${ADMIN_PASSWORD}`);
	console.log("");
	console.log("⚠️  Change the password after first login!");
	console.log("");
	console.log("Apply with:");
	console.log(
		`  wrangler d1 execute greece-chauffer-transfers-db --command="${sql}"`
	);
}

main().catch(console.error);
