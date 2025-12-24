import { StartupCatchUpService } from './StartupCatchUpService';
import { RecurrenceService } from './RecurrenceService';
import { AutoPayService } from './AutoPayService';

jest.mock('./RecurrenceService', () => ({
  RecurrenceService: {
    checkDailyBills: jest.fn(),
  },
}));

jest.mock('./AutoPayService', () => ({
  AutoPayService: {
    processAutoPay: jest.fn(),
  },
}));

describe('StartupCatchUpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { __oar_catchup_executed?: boolean }).__oar_catchup_executed;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __oar_catchup_executed?: boolean }).__oar_catchup_executed;
  });

  describe('runCatchUp', () => {
    it('calls both services and returns combined result', async () => {
      const overdueResult = { checked: 10, updated: 3 };
      const autoPayResult = {
        processed: 2,
        failed: 0,
        failedIds: [] as string[],
      };

      (RecurrenceService.checkDailyBills as jest.Mock).mockResolvedValue(
        overdueResult
      );
      (AutoPayService.processAutoPay as jest.Mock).mockResolvedValue(autoPayResult);

      const result = await StartupCatchUpService.runCatchUp();

      expect(RecurrenceService.checkDailyBills).toHaveBeenCalledTimes(1);
      expect(AutoPayService.processAutoPay).toHaveBeenCalledTimes(1);
      expect(result.overdueCheck).toEqual(overdueResult);
      expect(result.autoPay).toEqual(autoPayResult);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(globalThis.__oar_catchup_executed).toBe(true);
    });

    it('handles error from checkDailyBills and continues to processAutoPay', async () => {
      const autoPayResult = {
        processed: 1,
        failed: 0,
        failedIds: [] as string[],
      };

      (RecurrenceService.checkDailyBills as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      (AutoPayService.processAutoPay as jest.Mock).mockResolvedValue(autoPayResult);

      const result = await StartupCatchUpService.runCatchUp();

      expect(RecurrenceService.checkDailyBills).toHaveBeenCalledTimes(1);
      expect(AutoPayService.processAutoPay).toHaveBeenCalledTimes(1);
      expect(result.overdueCheck).toEqual({ checked: 0, updated: 0 });
      expect(result.autoPay).toEqual(autoPayResult);
      expect(console.error).toHaveBeenCalledWith(
        '[StartupCatchUpService] Failed to check overdue bills:',
        expect.any(Error)
      );
      expect(globalThis.__oar_catchup_executed).toBe(true);
    });

    it('handles error from processAutoPay and still returns result', async () => {
      const overdueResult = { checked: 5, updated: 2 };

      (RecurrenceService.checkDailyBills as jest.Mock).mockResolvedValue(
        overdueResult
      );
      (AutoPayService.processAutoPay as jest.Mock).mockRejectedValue(
        new Error('AutoPay error')
      );

      const result = await StartupCatchUpService.runCatchUp();

      expect(RecurrenceService.checkDailyBills).toHaveBeenCalledTimes(1);
      expect(AutoPayService.processAutoPay).toHaveBeenCalledTimes(1);
      expect(result.overdueCheck).toEqual(overdueResult);
      expect(result.autoPay).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(console.error).toHaveBeenCalledWith(
        '[StartupCatchUpService] Failed to process auto-pay bills:',
        expect.any(Error)
      );
      expect(globalThis.__oar_catchup_executed).toBe(true);
    });

    it('handles errors from both services and still returns valid result', async () => {
      (RecurrenceService.checkDailyBills as jest.Mock).mockRejectedValue(
        new Error('Recurrence error')
      );
      (AutoPayService.processAutoPay as jest.Mock).mockRejectedValue(
        new Error('AutoPay error')
      );

      const result = await StartupCatchUpService.runCatchUp();

      expect(RecurrenceService.checkDailyBills).toHaveBeenCalledTimes(1);
      expect(AutoPayService.processAutoPay).toHaveBeenCalledTimes(1);
      expect(result.overdueCheck).toEqual({ checked: 0, updated: 0 });
      expect(result.autoPay).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(globalThis.__oar_catchup_executed).toBe(true);
    });

    it('skips execution if already executed (idempotency)', async () => {
      globalThis.__oar_catchup_executed = true;

      const result = await StartupCatchUpService.runCatchUp();

      expect(RecurrenceService.checkDailyBills).not.toHaveBeenCalled();
      expect(AutoPayService.processAutoPay).not.toHaveBeenCalled();
      expect(result.overdueCheck).toEqual({ checked: 0, updated: 0 });
      expect(result.autoPay).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(console.log).toHaveBeenCalledWith(
        '[StartupCatchUpService] Already executed, skipping'
      );
    });

    it('marks as executed after successful completion', async () => {
      (RecurrenceService.checkDailyBills as jest.Mock).mockResolvedValue({
        checked: 0,
        updated: 0,
      });
      (AutoPayService.processAutoPay as jest.Mock).mockResolvedValue({
        processed: 0,
        failed: 0,
        failedIds: [],
      });

      expect(globalThis.__oar_catchup_executed).toBeUndefined();

      await StartupCatchUpService.runCatchUp();

      expect(globalThis.__oar_catchup_executed).toBe(true);
    });

    it('returns result with all required fields', async () => {
      (RecurrenceService.checkDailyBills as jest.Mock).mockResolvedValue({
        checked: 15,
        updated: 5,
      });
      (AutoPayService.processAutoPay as jest.Mock).mockResolvedValue({
        processed: 3,
        failed: 1,
        failedIds: ['bill-1'],
      });

      const result = await StartupCatchUpService.runCatchUp();

      expect(result).toHaveProperty('overdueCheck');
      expect(result.overdueCheck).toHaveProperty('checked');
      expect(result.overdueCheck).toHaveProperty('updated');
      expect(result).toHaveProperty('autoPay');
      expect(result.autoPay).toHaveProperty('processed');
      expect(result.autoPay).toHaveProperty('failed');
      expect(result.autoPay).toHaveProperty('failedIds');
      expect(result).toHaveProperty('completedAt');
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('logs completion message after successful execution', async () => {
      (RecurrenceService.checkDailyBills as jest.Mock).mockResolvedValue({
        checked: 5,
        updated: 2,
      });
      (AutoPayService.processAutoPay as jest.Mock).mockResolvedValue({
        processed: 1,
        failed: 0,
        failedIds: [],
      });

      await StartupCatchUpService.runCatchUp();

      expect(console.log).toHaveBeenCalledWith(
        '[StartupCatchUpService] Starting catch-up logic...'
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[StartupCatchUpService] Overdue check complete:')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[StartupCatchUpService] Auto-pay processing complete:')
      );
      expect(console.log).toHaveBeenCalledWith(
        '[StartupCatchUpService] Catch-up logic complete'
      );
    });
  });
});

