import { CronJob } from 'cron';
import { getLogger } from '@/lib/logger';

const logger = getLogger('Scheduler');

/**
 * SchedulerService - Manages background cron jobs for Oar.
 *
 * Architecture Notes:
 * - Uses globalThis for singleton to survive Next.js HMR (Hot Module Replacement)
 * - Module-level variables reset during HMR, but globalThis persists
 * - This pattern is identical to the Prisma client singleton pattern
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
 */
const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: 'daily-bill-check',
    // Run at midnight every day (00:00)
    cronTime: '0 0 * * *',
    handler: async () => {
      // Dynamic import to allow tree-shaking and avoid circular dependencies
      const { RecurrenceService } = await import('./RecurrenceService');
      const result = await RecurrenceService.checkDailyBills();

      logger.info(
        {
          checked: result.checked,
          updated: result.updated,
        },
        'Daily bill check complete'
      );
    },
    runOnInit: false,
  },
  {
    name: 'auto-pay-processor',
    // Run at 00:05 daily (after daily-bill-check at 00:00)
    // This ensures overdue statuses are updated before auto-pay processing
    cronTime: '5 0 * * *',
    handler: async () => {
      // Dynamic import to allow tree-shaking and avoid circular dependencies
      const { AutoPayService } = await import('./AutoPayService');
      const result = await AutoPayService.processAutoPay();

      logger.info(
        {
          processed: result.processed,
          failed: result.failed,
        },
        'Auto-pay complete'
      );

      if (result.failed > 0) {
        logger.warn(
          {
            failedIds: result.failedIds,
          },
          'Failed bill IDs'
        );
      }
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
      logger.info({ jobName: definition.name }, 'Job started');
      try {
        await definition.handler();
        logger.info({ jobName: definition.name }, 'Job completed successfully');
      } catch (error) {
        logger.error(error, `Job "${definition.name}" failed`);
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
      logger.info('Already initialized, skipping');
      return;
    }

    logger.info('Initializing...');

    // Create and register all jobs
    const jobs: CronJob[] = [];

    for (const definition of JOB_DEFINITIONS) {
      const job = createJob(definition);
      jobs.push(job);
      logger.info(
        {
          jobName: definition.name,
          cronTime: definition.cronTime,
        },
        'Registered job'
      );
    }

    // Store in globalThis to survive HMR
    globalThis.__oar_scheduler = jobs;

    logger.info({ jobCount: jobs.length }, 'Started scheduler');
  },

  /**
   * Stop all running jobs and clear the scheduler.
   * Use for graceful shutdown or testing.
   */
  shutdown(): void {
    const jobs = globalThis.__oar_scheduler;

    if (!jobs) {
      logger.info('Not running, nothing to shut down');
      return;
    }

    logger.info('Shutting down...');

    for (const job of jobs) {
      job.stop();
    }

    globalThis.__oar_scheduler = undefined;
    logger.info('Shutdown complete');
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

