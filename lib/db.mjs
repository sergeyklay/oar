/**
 * Database Utilities Module (ESM)
 *
 * Shared database utilities accessible by both TypeScript and JavaScript.
 *
 * @module lib/db
 */

import { resolve, isAbsolute } from 'path';

/** Default database file path when DATABASE_URL is not set. */
export const DEFAULT_DATABASE_PATH = './data/oar.db';

/**
 * Resolves the database path from the environment or the default path.
 *
 * @param {string} [envPath] - Path from environment variable (defaults to DATABASE_URL)
 * @param {string} [baseDir] - Base directory for resolving relative paths (defaults to cwd)
 * @returns {string} The resolved database path
 */
export function resolveDatabasePath(envPath = process.env.DATABASE_URL, baseDir = process.cwd()) {
  const dbPath = envPath ?? DEFAULT_DATABASE_PATH;

  if (dbPath === ':memory:' || isAbsolute(dbPath)) {
    return dbPath;
  }

  return resolve(baseDir, dbPath);
}
