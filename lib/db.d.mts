/**
 * TypeScript declarations for lib/db.mjs
 */

/** Default database file path when DATABASE_URL is not set. */
export declare const DEFAULT_DATABASE_PATH: string;

/**
 * Resolves the database path from the environment or the default path.
 *
 * @param envPath - Path from environment variable (defaults to DATABASE_URL)
 * @param baseDir - Base directory for resolving relative paths (defaults to cwd)
 * @returns The resolved database path
 */
export declare function resolveDatabasePath(
  envPath?: string | undefined,
  baseDir?: string
): string;
