/**
 * Database Utilities Module (ESM)
 *
 * Shared database utilities accessible by both TypeScript and JavaScript.
 * This module is the single source of truth for database path resolution
 * and can be extended with additional DB utilities.
 *
 * @module lib/db
 */

import { resolve, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

/** Default database file path when DATABASE_URL is not set. */
export const DEFAULT_DATABASE_PATH = './data/oar.db';

/**
 * Resolves the database path from the environment or the default path.
 *
 * Handles the following formats:
 * - Absolute paths: `/absolute/path/to/db.sqlite`
 * - Relative paths: `./data/oar.db` (resolved relative to baseDir)
 * - file:// URLs: `file:///absolute/path/to/db.sqlite` (converted via fileURLToPath)
 * - file: prefix: `file:./data/custom.db` (prefix stripped, path preserved)
 * - In-memory: `:memory:` (returned as-is)
 *
 * @param {string} [envPath] - Path from environment variable (defaults to DATABASE_URL)
 * @param {string} [baseDir] - Base directory for resolving relative paths (defaults to cwd)
 * @returns {string} The resolved database path
 */
export function resolveDatabasePath(envPath = process.env.DATABASE_URL, baseDir = process.cwd()) {
  let dbPath = envPath ?? DEFAULT_DATABASE_PATH;

  // Convert file:// URLs to platform-specific paths using fileURLToPath
  if (dbPath.startsWith('file://')) {
    dbPath = fileURLToPath(dbPath);
  }

  // Handle in-memory database
  if (dbPath === ':memory:') {
    return dbPath;
  }

  // Resolve relative paths to absolute paths
  // Note: file: prefix (not file://) is excluded from resolution to preserve relative paths
  if (!isAbsolute(dbPath) && !dbPath.startsWith('file:') && dbPath !== ':memory:') {
    dbPath = resolve(baseDir, dbPath);
  }

  // Strip 'file:' protocol if present (better-sqlite3 expects plain file paths)
  if (dbPath.startsWith('file:')) {
    dbPath = dbPath.slice(5);
  }

  return dbPath;
}

