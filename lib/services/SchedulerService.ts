import { CronJob } from 'cron';

/**
 * SchedulerService - Manages background cron jobs for Oar.
 *
 * Architecture Notes:
 * - Uses globalThis for singleton to survive Next.js HMR (Hot Module Replacement)
 * - Module-level variables reset during HMR, but globalThis persists
 * - This pattern is identical to the Prisma client singleton pattern
 *
 * @see .cursor/specs/Spec-BackgroundJobs.md
 */

/**
 * Extend globalThis with our scheduler type.
 * Note: 'var' is required for global declaration merging in TypeScript.
 */
declare global {
  var __oar_scheduler: CronJob[] | undefined;
}

// TODO: Add timezone support - currently uses server time (UTC)
// Future: Allow users to configure timezone via SettingsService
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Job definitions for the scheduler.
 * Each job has a name, cron expression, and handler function.
 */
interface JobDefinition {
  name: string;
  cronTime: string;
  handler: () => Promise<void>;
  runOnInit?: boolean;
}

/**
 * Define all scheduled jobs here.
 * MVP: Single "daily bill check" stub job.
 */
const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: 'daily-bill-check',
    // Run at midnight every day (00:00)
    cronTime: '0 0 * * *',
    handler: async () => {
      // TODO: Replace stub with actual RecurrenceService.checkDailyBills() call
      console.log('[Scheduler] Running daily bill check... (stub)');
      // Future: const result = await RecurrenceService.checkDailyBills();
      // Future: console.log(`[Scheduler] Daily bill check complete: ${result.checked} checked, ${result.updated} updated`);
    },
    runOnInit: false,
  },
];

/**
 * Create a CronJob from a job definition.
 */
function createJob(definition: JobDefinition): CronJob {
  return CronJob.from({
    cronTime: definition.cronTime,
    onTick: async function () {
      console.log(`[Scheduler] Job "${definition.name}" started at ${new Date().toISOString()}`);
      try {
        await definition.handler();
        console.log(`[Scheduler] Job "${definition.name}" completed successfully`);
      } catch (error) {
        console.error(`[Scheduler] Job "${definition.name}" failed:`, error);
      }
    },
    start: true,
    timeZone: DEFAULT_TIMEZONE,
    runOnInit: definition.runOnInit ?? false,
  });
}

/**
 * SchedulerService manages the lifecycle of background cron jobs.
 *
 * Key Features:
 * - Singleton pattern via globalThis (survives HMR)
 * - Idempotent init() - safe to call multiple times
 * - Graceful shutdown support
 */
export const SchedulerService = {
  /**
   * Initialize the scheduler and register all jobs.
   * This method is idempotent - calling it multiple times is safe.
   *
   * @example
   * // In instrumentation.ts
   * SchedulerService.init();
   */
  init(): void {
    // Check if already initialized (survives HMR via globalThis)
    if (globalThis.__oar_scheduler) {
      console.log('[Scheduler] Already initialized, skipping');
      return;
    }

    console.log('[Scheduler] Initializing...');

    // Create and register all jobs
    const jobs: CronJob[] = [];

    for (const definition of JOB_DEFINITIONS) {
      const job = createJob(definition);
      jobs.push(job);
      console.log(
        `[Scheduler] Registered job "${definition.name}" with schedule "${definition.cronTime}"`
      );
    }

    // Store in globalThis to survive HMR
    globalThis.__oar_scheduler = jobs;

    console.log(`[Scheduler] Started with ${jobs.length} job(s)`);
  },

  /**
   * Stop all running jobs and clear the scheduler.
   * Use for graceful shutdown or testing.
   */
  shutdown(): void {
    const jobs = globalThis.__oar_scheduler;

    if (!jobs) {
      console.log('[Scheduler] Not running, nothing to shut down');
      return;
    }

    console.log('[Scheduler] Shutting down...');

    for (const job of jobs) {
      job.stop();
    }

    globalThis.__oar_scheduler = undefined;
    console.log('[Scheduler] Shutdown complete');
  },

  /**
   * Check if the scheduler is currently running.
   */
  isRunning(): boolean {
    return globalThis.__oar_scheduler !== undefined;
  },

  /**
   * Get the number of registered jobs.
   * Returns 0 if scheduler is not running.
   */
  getJobCount(): number {
    return globalThis.__oar_scheduler?.length ?? 0;
  },
};

