// db.js
// This file creates (or opens) a SQLite database file on disk and makes sure
// our two tables exist. better-sqlite3 is synchronous, which is actually
// great for beginners: no async/await, no callbacks, just plain function calls.

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));

// WAL mode lets reads and writes happen more smoothly together. Not required
// for a small project, but it's a one-line best practice worth knowing.
db.pragma('journal_mode = WAL');

// Foreign key constraints are OFF by default in SQLite - turn them on so that
// deleting a user can cascade to their expenses.
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    expense_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;
