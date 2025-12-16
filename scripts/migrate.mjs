#!/usr/bin/env node
/**
 * Production Migration Script
 *
 * Applies pending Drizzle migrations to the SQLite database.
 * This script is designed to run at container startup before the app starts.
 *
 * Usage: node scripts/migrate.mjs
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Read database path from environment or use default
// Strip 'file:' protocol if present (better-sqlite3 expects plain file paths)
const rawUrl = process.env.DATABASE_URL ?? './data/oar.db';
let dbPath = rawUrl.startsWith('file:') ? rawUrl.slice(5) : rawUrl;

// Handle in-memory database (should not happen in production, but handle gracefully)
if (dbPath === ':memory:') {
  console.error('[migrate] In-memory database not supported for migrations');
  process.exit(1);
}

// Resolve relative paths to absolute paths
if (!dbPath.startsWith('/')) {
  dbPath = resolve(ROOT_DIR, dbPath);
}

// Ensure the directory exists before creating the database
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  console.log(`[migrate] Creating database directory: ${dbDir}`);
  mkdirSync(dbDir, { recursive: true });
}

console.log(`[migrate] Database path: ${dbPath}`);

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create migrations tracking table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )
`);

// Read migration journal
const journalPath = join(ROOT_DIR, 'drizzle', 'meta', '_journal.json');

if (!existsSync(journalPath)) {
  console.log('[migrate] No migrations found. Skipping.');
  process.exit(0);
}

const journal = JSON.parse(readFileSync(journalPath, 'utf-8'));
const entries = journal.entries ?? [];

// Get already applied migrations
const applied = new Set(
  db.prepare('SELECT hash FROM __drizzle_migrations').all().map((row) => row.hash)
);

let appliedCount = 0;

for (const entry of entries) {
  const hash = entry.tag;

  if (applied.has(hash)) {
    console.log(`[migrate] Already applied: ${hash}`);
    continue;
  }

  const sqlPath = join(ROOT_DIR, 'drizzle', `${hash}.sql`);

  if (!existsSync(sqlPath)) {
    console.error(`[migrate] Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf-8');

  // Split by statement-breakpoint marker (Drizzle convention)
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`[migrate] Applying: ${hash} (${statements.length} statements)`);

  const transaction = db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt);
    }
    db.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(
      hash,
      Date.now()
    );
  });

  try {
    transaction();
    appliedCount++;
    console.log(`[migrate] Applied: ${hash}`);
  } catch (err) {
    console.error(`[migrate] Failed to apply ${hash}:`, err.message);
    process.exit(1);
  }
}

db.close();

if (appliedCount === 0) {
  console.log('[migrate] Database is up to date.');
} else {
  console.log(`[migrate] Successfully applied ${appliedCount} migration(s).`);
}

