import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as schema from './schema';

// Database file location (relative to project root or absolute path)
let dbPath = process.env.DATABASE_URL ?? './data/oar.db';

// Resolve relative paths to absolute paths
if (!dbPath.startsWith('/') && !dbPath.startsWith('file:') && dbPath !== ':memory:') {
  // Resolve relative to process.cwd() (project root in production, or current directory)
  dbPath = resolve(process.cwd(), dbPath);
}

// Strip 'file:' protocol if present (better-sqlite3 expects plain file paths)
if (dbPath.startsWith('file:')) {
  dbPath = dbPath.slice(5);
}

// Ensure the directory exists before creating the database (skip for in-memory)
if (dbPath !== ':memory:') {
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

// Create database instance with WAL mode for better concurrency
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Export typed Drizzle instance
export const db = drizzle(sqlite, { schema });

// Re-export schema for convenience
export * from './schema';

/**
 * No-op in production. Used by Jest manual mock for test cleanup.
 * This export exists to satisfy TypeScript when importing from @/db in test files.
 */
export const resetDbMocks = (): void => {
  // No-op in production - implemented in db/__mocks__/index.ts
};
