CREATE TABLE IF NOT EXISTS connection_test (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO connection_test (id) VALUES (1);
