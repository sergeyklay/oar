import { getLogger } from '@/lib/logger';

const logger = getLogger('Instrumentation');

/**
 * Next.js Instrumentation Entry Point
 *
 * This file is called ONCE when a new Next.js server instance starts.
 * It initializes background services like the scheduler.
 *
 * Location: Project root (not in app/ or src/)
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
  // node-cron (and derivative libraries) uses Node.js timers, which are not available in Edge
  // runtime. The register() function runs in both Node.js and Edge runtimes.
  // We must guard against Edge runtime to prevent crashes.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('Initializing scheduler (nodejs runtime)');

    // Dynamic import is required here:
    // 1. Prevents Edge runtime from bundling Node.js-only code
    // 2. Keeps the cron library out of Edge bundles entirely
    const { SchedulerService } = await import('@/lib/services/SchedulerService');

    SchedulerService.init();

    // Run startup catch-up to maintain accurate bill state after downtime
    // This ensures bills that became overdue or auto-pay bills that became due
    // during downtime are processed immediately on startup.
    try {
      const { StartupCatchUpService } = await import(
        '@/lib/services/StartupCatchUpService'
      );

      const result = await StartupCatchUpService.runCatchUp();

      logger.info(
        {
          overdueUpdated: result.overdueCheck.updated,
          autoPayProcessed: result.autoPay.processed,
        },
        'Startup catch-up complete'
      );
    } catch (error) {
      // Log error but don't prevent startup - data will be corrected at next scheduled cron run
      logger.error(error, 'Startup catch-up failed');
    }
  } else {
    // Edge runtime - skip scheduler initialization
    logger.info('Skipping scheduler (edge runtime)');
  }
}

