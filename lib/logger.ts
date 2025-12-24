import pino from 'pino';

/**
 * Logger configuration for Oar.
 *
 * Server: Uses pino with pino-pretty transport in non-production.
 * Client: Lightweight wrapper that respects log levels (hides debug in production).
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
    const minLevel = isProduction ? 'error' : 'debug';

    // Pino level numbers (lower = more verbose)
    const levelNumbers: Record<string, number> = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60,
    };

    const minLevelNumber = levelNumbers[minLevel] ?? 30;

    // Helper to create a log method
    const createLogMethod = (
      level: string,
      consoleMethod: 'log' | 'info' | 'warn' | 'error',
      contextName?: string
    ) => {
      const levelNum = levelNumbers[level] ?? 30;
      const prefix = contextName ? `[${level.toUpperCase()}:${contextName}]` : `[${level.toUpperCase()}]`;

      return (objOrMsg: unknown, msg?: string) => {
        if (levelNum < minLevelNumber) {
          return; // Suppress logs below minimum level
        }

        // Handle structured logging: first arg is object/Error, second is message
        if (objOrMsg instanceof Error) {
          if (msg) {
            console[consoleMethod](prefix, msg, objOrMsg);
          } else {
            console[consoleMethod](prefix, objOrMsg);
          }
        } else if (typeof objOrMsg === 'object' && objOrMsg !== null && msg) {
          // Structured logging: { data }, "message"
          console[consoleMethod](prefix, objOrMsg, msg);
        } else if (typeof objOrMsg === 'string') {
          // Simple message: "message"
          console[consoleMethod](prefix, objOrMsg);
        } else {
          // Fallback: log as-is
          console[consoleMethod](prefix, objOrMsg);
        }
      };
    };

    // Create base logger methods
    const createBaseMethods = (contextName?: string): pino.Logger => {
      const methods = {
        trace: createLogMethod('trace', 'log', contextName),
        debug: createLogMethod('debug', 'log', contextName),
        info: createLogMethod('info', 'info', contextName),
        warn: createLogMethod('warn', 'warn', contextName),
        error: createLogMethod('error', 'error', contextName),
        fatal: createLogMethod('fatal', 'error', contextName),
        child: (bindings: Record<string, unknown>) => {
          const name = (bindings.name as string) ?? contextName ?? 'unknown';
          return createBaseMethods(name);
        },
        // Add required pino.Logger properties with minimal implementations
        level: minLevel,
        silent: false,
        msgPrefix: contextName ? `[${contextName}]` : '',
      };

      return methods as unknown as pino.Logger;
    };

    return createBaseMethods();
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

