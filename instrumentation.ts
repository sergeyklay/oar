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
    console.log('[Instrumentation] Initializing scheduler (nodejs runtime)');

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

      console.log(
        `[Instrumentation] Startup catch-up complete: ` +
          `${result.overdueCheck.updated} bills marked overdue, ` +
          `${result.autoPay.processed} auto-pay bills processed`
      );
    } catch (error) {
      // Log error but don't prevent startup - data will be corrected at next scheduled cron run
      console.error('[Instrumentation] Startup catch-up failed:', error);
    }
  } else {
    // Edge runtime - skip scheduler initialization
    console.log('[Instrumentation] Skipping scheduler (edge runtime)');
  }
}

