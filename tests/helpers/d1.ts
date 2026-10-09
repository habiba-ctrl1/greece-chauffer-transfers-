// Minimal D1Database implementation over node:sqlite so tests run the real SQL
// (schema + migrations) without Cloudflare.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

type Params = (string | number | null | Uint8Array)[];

class Stmt {
	constructor(private db: DatabaseSync, private sql: string, private params: Params = []) {}
	bind(...p: unknown[]) {
		return new Stmt(this.db, this.sql, p.map((v) => (v === undefined ? null : v)) as Params);
	}
	async run() {
		const r = this.db.prepare(this.sql).run(...this.params);
		return { success: true, results: [], meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
	}
	async first<T>() {
		return (this.db.prepare(this.sql).get(...this.params) as T | undefined) ?? null;
	}
	async all<T>() {
		const results = this.db.prepare(this.sql).all(...this.params) as T[];
		return { success: true, results, meta: { changes: 0 } };
	}
	_exec() {
		return this.db.prepare(this.sql).run(...this.params);
	}
}

export function createTestDb() {
	const sqlite = new DatabaseSync(":memory:");
	const dir = path.resolve(__dirname, "../../migrations");
	for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
		sqlite.exec(fs.readFileSync(path.join(dir, f), "utf8"));
	}
	const db = {
		prepare: (sql: string) => new Stmt(sqlite, sql),
		async batch(stmts: Stmt[]) {
			sqlite.exec("BEGIN");
			try {
				const out = [];
				for (const s of stmts) {
					const r = s._exec();
					out.push({ success: true, results: [], meta: { changes: Number(r.changes) } });
				}
				sqlite.exec("COMMIT");
				return out;
			} catch (e) {
				sqlite.exec("ROLLBACK");
				throw e;
			}
		},
		exec: async (sql: string) => sqlite.exec(sql),
	};
	return { db: db as unknown as D1Database, sqlite };
}
