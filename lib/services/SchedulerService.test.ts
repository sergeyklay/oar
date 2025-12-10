import { SchedulerService } from './SchedulerService';

jest.mock('cron', () => ({
  CronJob: {
    from: jest.fn(() => ({
      stop: jest.fn(),
    })),
  },
}));

describe('SchedulerService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    globalThis.__oar_scheduler = undefined;
  });

  afterEach(() => {
    SchedulerService.shutdown();
  });

  describe('init', () => {
    it('initializes the scheduler when not running', () => {
      expect(SchedulerService.isRunning()).toBe(false);

      SchedulerService.init();

      expect(SchedulerService.isRunning()).toBe(true);
      // 2 jobs: daily-bill-check and auto-pay-processor
      expect(SchedulerService.getJobCount()).toBe(2);
    });

    it('is idempotent - calling init twice does not create duplicate jobs', () => {
      SchedulerService.init();
      const initialCount = SchedulerService.getJobCount();

      SchedulerService.init();

      expect(SchedulerService.getJobCount()).toBe(initialCount);
    });
  });

  describe('shutdown', () => {
    it('stops all jobs and clears scheduler state', () => {
      SchedulerService.init();
      expect(SchedulerService.isRunning()).toBe(true);

      SchedulerService.shutdown();

      expect(SchedulerService.isRunning()).toBe(false);
      expect(SchedulerService.getJobCount()).toBe(0);
    });

    it('handles shutdown when not running gracefully', () => {
      expect(SchedulerService.isRunning()).toBe(false);

      expect(() => SchedulerService.shutdown()).not.toThrow();
    });
  });

  describe('isRunning', () => {
    it('returns false when scheduler is not initialized', () => {
      expect(SchedulerService.isRunning()).toBe(false);
    });

    it('returns true when scheduler is initialized', () => {
      SchedulerService.init();

      expect(SchedulerService.isRunning()).toBe(true);
    });

    it('returns false after shutdown', () => {
      SchedulerService.init();
      SchedulerService.shutdown();

      expect(SchedulerService.isRunning()).toBe(false);
    });
  });

  describe('getJobCount', () => {
    it('returns 0 when scheduler is not initialized', () => {
      expect(SchedulerService.getJobCount()).toBe(0);
    });

    it('returns correct count when scheduler is running', () => {
      SchedulerService.init();

      // 2 jobs: daily-bill-check and auto-pay-processor
      expect(SchedulerService.getJobCount()).toBe(2);
    });

    it('returns 0 after shutdown', () => {
      SchedulerService.init();
      SchedulerService.shutdown();

      expect(SchedulerService.getJobCount()).toBe(0);
    });
  });

  describe('globalThis singleton pattern', () => {
    it('survives re-import (simulated HMR)', () => {
      SchedulerService.init();
      expect(globalThis.__oar_scheduler).toBeDefined();
      // 2 jobs: daily-bill-check and auto-pay-processor
      expect(globalThis.__oar_scheduler?.length).toBe(2);

      // Simulate another call (like HMR would do)
      SchedulerService.init();

      // Should still have same jobs, not duplicated
      expect(globalThis.__oar_scheduler?.length).toBe(2);
    });

    it('can reinitialize after shutdown', () => {
      SchedulerService.init();
      SchedulerService.shutdown();
      expect(globalThis.__oar_scheduler).toBeUndefined();

      SchedulerService.init();

      expect(globalThis.__oar_scheduler).toBeDefined();
      expect(SchedulerService.isRunning()).toBe(true);
    });
  });
});

