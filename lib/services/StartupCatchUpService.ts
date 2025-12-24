import { RecurrenceService } from './RecurrenceService';
import { AutoPayService } from './AutoPayService';

/**
 * Result of startup catch-up execution.
 */
interface CatchUpResult {
  /** Result from overdue status check */
  overdueCheck: {
    checked: number;
    updated: number;
  };
  /** Result from auto-pay processing */
  autoPay: {
    processed: number;
    failed: number;
    failedIds: string[];
  };
  /** Timestamp when catch-up completed */
  completedAt: Date;
}

/**
 * Extend globalThis with catch-up execution flag.
 * Note: 'var' is required for global declaration merging in TypeScript.
 */
declare global {
  var __oar_catchup_executed: boolean | undefined;
}

/**
 * StartupCatchUpService - Executes catch-up logic on application startup.
 *
 * Ensures accurate bill state when the application restarts after being down.
 * Runs catch-up logic that would have been executed by scheduled cron jobs
 * if the application had been running continuously.
 *
 * This service:
 * 1. Marks bills as overdue if they became overdue during downtime
 * 2. Processes auto-pay bills that became due during downtime
 *
 * Both operations are idempotent and safe to run multiple times.
 */
export const StartupCatchUpService = {
  /**
   * Runs catch-up logic for missed scheduled updates.
   *
   * This should be called once during application startup (in instrumentation.ts)
   * to ensure bill state is accurate regardless of application uptime.
   *
   * Steps:
   * 1. Run checkDailyBills() to mark bills as overdue that became overdue during downtime
   * 2. Run processAutoPay() to process auto-pay bills that became due during downtime
   *
   * Both operations are idempotent and safe to run multiple times.
   *
   * @returns Promise with catch-up metrics
   */
  async runCatchUp(): Promise<CatchUpResult> {
    // Idempotency guard: prevent duplicate runs during HMR
    if (globalThis.__oar_catchup_executed) {
      console.log('[StartupCatchUpService] Already executed, skipping');
      // Return a default result since we're skipping
      return {
        overdueCheck: { checked: 0, updated: 0 },
        autoPay: { processed: 0, failed: 0, failedIds: [] },
        completedAt: new Date(),
      };
    }

    console.log('[StartupCatchUpService] Starting catch-up logic...');

    let overdueCheckResult = { checked: 0, updated: 0 };
    let autoPayResult = { processed: 0, failed: 0, failedIds: [] as string[] };

    // Step 1: Mark overdue bills
    try {
      overdueCheckResult = await RecurrenceService.checkDailyBills();
      console.log(
        `[StartupCatchUpService] Overdue check complete: ${overdueCheckResult.checked} checked, ${overdueCheckResult.updated} updated`
      );
    } catch (error) {
      console.error('[StartupCatchUpService] Failed to check overdue bills:', error);
      // Continue to auto-pay processing even if overdue check fails
    }

    // Step 2: Process missed auto-pay bills
    try {
      autoPayResult = await AutoPayService.processAutoPay();
      console.log(
        `[StartupCatchUpService] Auto-pay processing complete: ${autoPayResult.processed} processed, ${autoPayResult.failed} failed`
      );
    } catch (error) {
      console.error('[StartupCatchUpService] Failed to process auto-pay bills:', error);
      // Continue even if auto-pay processing fails
    }

    // Mark as executed to prevent duplicate runs
    globalThis.__oar_catchup_executed = true;

    const result: CatchUpResult = {
      overdueCheck: overdueCheckResult,
      autoPay: autoPayResult,
      completedAt: new Date(),
    };

    console.log('[StartupCatchUpService] Catch-up logic complete');

    return result;
  },
};

