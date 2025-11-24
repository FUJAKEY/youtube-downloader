const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../data/app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`
).run();

module.exports = db;
