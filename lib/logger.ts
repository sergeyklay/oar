import pino from 'pino';

/**
 * Logger configuration for Oar.
 *
 * Server: Uses pino with pino-pretty transport in non-production.
 * Client: Uses pino's native browser API with console output.
 *   - Development: All logs (debug level)
 *   - Production: Only error and fatal logs
 * Test: All logging is suppressed (silent level) for clean test output.
 */

const isServer = typeof window === 'undefined';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Create the base logger instance.
 */
function createBaseLogger(): pino.Logger {
  if (isTest) {
    return pino({
      level: 'silent'
    });
  }

  /* c8 ignore start */
  if (isServer) {
    if (isProduction) {
      return pino({
        level: 'info',
      });
    }

    return pino({
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
  }

  return pino({
    level: isProduction ? 'error' : 'debug',
    browser: {
      serialize: true,
    },
  });
  /* c8 ignore stop */
}

// Create singleton base logger
const baseLogger = createBaseLogger();

/**
 * Get a child logger with the specified name/context.
 *
 * @param name - Context name for the logger (e.g., "StartupCatchUpService")
 * @returns A child logger instance with the name bound
 *
 * @example
 * ```typescript
 * const logger = getLogger("StartupCatchUpService");
 * logger.info("Starting catch-up process...");
 * logger.debug({ count: 5 }, "Processed items");
 * logger.error(err, "Failed to process items");
 * ```
 */
export function getLogger(name: string): pino.Logger {
  return baseLogger.child({ name });
}

