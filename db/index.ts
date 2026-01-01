import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as schema from './schema';
import { resolveDatabasePath } from '@/lib/utils';

const dbPath = resolveDatabasePath();

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
