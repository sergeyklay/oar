#!/usr/bin/env node
/**
 * Minimal logger for production scripts (.mjs files)
 *
 * Uses pino directly without TypeScript dependencies.
 * This is a simplified version for use in production Docker scripts.
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const baseLogger = isProduction
  ? pino({ level: 'info' })
  : pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    });

/**
 * Get a child logger with the specified name/context.
 *
 * @param {string} name - Context name for the logger (e.g., "MigrationScript")
 * @returns {pino.Logger} A child logger instance
 */
export function getLogger(name) {
  return baseLogger.child({ name });
}

