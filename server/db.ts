import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, '..', 'jamlog.db'))
db.pragma('foreign_keys = ON')

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT NOT NULL,
      filename  TEXT NOT NULL UNIQUE,
      favorite  INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progress (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      songId       INTEGER NOT NULL UNIQUE REFERENCES songs(id) ON DELETE CASCADE,
      status       TEXT NOT NULL DEFAULT 'not_started',
      bpm          INTEGER,
      notes        TEXT,
      lastPracticed TEXT,
      updatedAt    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
} catch (err) {
  console.error('Failed to initialize database schema:', err)
  process.exit(1)
}

export default db
