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
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getLogger } from './logger.mjs';
import { resolveDatabasePath } from '../lib/db.mjs';

const logger = getLogger('MigrationScript');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Resolve database path using shared utility
const dbPath = resolveDatabasePath(undefined, ROOT_DIR);

// Handle in-memory database (should not happen in production, but handle gracefully)
if (dbPath === ':memory:') {
  logger.fatal('In-memory database not supported for migrations');
  process.exit(1);
}

// Ensure the directory exists before creating the database
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  logger.info({ dbDir }, 'Creating database directory');
  mkdirSync(dbDir, { recursive: true });
}

logger.info({ dbPath }, 'Database path');

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
  logger.info('No migrations found. Skipping.');
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
    logger.debug({ hash }, 'Migration already applied');
    continue;
  }

  const sqlPath = join(ROOT_DIR, 'drizzle', `${hash}.sql`);

  if (!existsSync(sqlPath)) {
    logger.error({ sqlPath }, 'Migration file not found');
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf-8');

  // Split by statement-breakpoint marker (Drizzle convention)
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  logger.info({ hash, statementCount: statements.length }, 'Applying migration');

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
    logger.info({ hash }, 'Migration applied successfully');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({ err: error, hash }, 'Failed to apply migration');
    process.exit(1);
  }
}

db.close();

if (appliedCount === 0) {
  logger.info('Database is up to date');
} else {
  logger.info({ appliedCount }, 'Successfully applied migrations');
}

