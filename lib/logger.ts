import pino from 'pino';

/**
 * Logger configuration for Oar.
 *
 * Server: Uses pino with pino-pretty transport in non-production.
 * Client: Uses pino's native browser API with console output.
 *   - Development: All logs (debug level)
 *   - Production: Only error and fatal logs
 */

const isServer = typeof window === 'undefined';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Create the base logger instance.
 */
function createBaseLogger(): pino.Logger {
  if (isServer) {
    if (isProduction) {
      return pino({
        level: 'info',
      });
    } else {
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
  } else {
    // Client-side: Use pino's native browser API
    // In production, only error and fatal logs are shown (level: 'error')
    // In development, all logs are shown (level: 'debug')
    // Error serialization is enabled for proper Error object formatting
    return pino({
      level: isProduction ? 'error' : 'debug',
      browser: {
        serialize: true, // Enable error serialization and all standard serializers
      },
    });
  }
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

