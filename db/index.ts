import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Database file location (relative to project root)
const DB_PATH = process.env.DATABASE_URL ?? './data/oar.db';

// Create database instance with WAL mode for better concurrency
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

// Export typed Drizzle instance
export const db = drizzle(sqlite, { schema });

// Re-export schema for convenience
export * from './schema';
