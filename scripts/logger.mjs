#!/usr/bin/env node
/**
 * Minimal logger for production scripts (.mjs files)
 *
 * Uses pino directly without TypeScript dependencies.
 * This is a simplified version for use in production Docker scripts.
 * Always uses JSON output for production log aggregation.
 */

import pino from 'pino';

const baseLogger = pino({ level: 'info' });

/**
 * Get a child logger with the specified name/context.
 *
 * @param {string} name - Context name for the logger (e.g., "MigrationScript")
 * @returns {pino.Logger} A child logger instance
 */
export function getLogger(name) {
  return baseLogger.child({ name });
}

