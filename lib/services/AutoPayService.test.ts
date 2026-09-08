import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { AutoPayService } from './AutoPayService';
import { db, resetDbMocks } from '@/db';
import { RecurrenceService } from './RecurrenceService';
import { SettingsService } from './SettingsService';
import { DateAdjustmentService } from './DateAdjustmentService';
import type { Bill } from '@/db/schema';
import { getLogger } from '@/lib/logger';

vi.mock('@/lib/logger');

vi.mock('@/db');

vi.mock('./RecurrenceService', () => ({
  RecurrenceService: {
    calculateNextDueDate: vi.fn(),
    deriveStatus: vi.fn(),
  },
}));

vi.mock('./SettingsService', () => ({
  SettingsService: {
    getWeekendAdjustment: vi.fn(),
    getAutoLogAutoPay: vi.fn(),
  },
}));

vi.mock('./DateAdjustmentService', () => ({
  DateAdjustmentService: {
    getEffectiveStrategy: vi.fn(),
    adjustPaymentDate: vi.fn(),
  },
}));

describe('AutoPayService', () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  /**
   * Helper to create a mock bill with default values.
   */
  const createMockBill = (overrides: Partial<Bill> = {}): Bill => {
    const { endDate, ...restOverrides } = overrides;
    return {
      id: 'bill-1',
      title: 'Test Bill',
      amount: 9999, // $99.99 in minor units
      amountDue: 9999,
      dueDate: new Date(),
      endDate: endDate ?? null,
      frequency: 'monthly',
      isAutoPay: true,
      isVariable: false,
      status: 'pending',
      isArchived: false,
      notes: null,
      categoryId: 'category-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      weekendAdjustment: null,
      ...restOverrides,
    };
  };

  /**
   * Helper to set up db.select mock to return specific bills.
   */
  const mockSelectBills = (billsToReturn: Bill[]) => {
    const selectBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(billsToReturn),
    };
    (db.select as Mock).mockReturnValue(selectBuilder);
  };

  describe('processAutoPay', () => {
    beforeEach(() => {
      (SettingsService.getAutoLogAutoPay as Mock).mockResolvedValue(true);
    });

    it('returns early when auto-log is disabled', async () => {
      (SettingsService.getAutoLogAutoPay as Mock).mockResolvedValue(false);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(SettingsService.getAutoLogAutoPay).toHaveBeenCalled();
      expect(db.select).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('processes eligible auto-pay bill when auto-log is enabled', async () => {
      const mockBill = createMockBill({
        id: 'bill-monthly',
        dueDate: new Date(),
        frequency: 'monthly',
        amountDue: 9999,
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');
      (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
      (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('unchanged');
      (DateAdjustmentService.adjustPaymentDate as Mock).mockImplementation((date) => date);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      expect(SettingsService.getAutoLogAutoPay).toHaveBeenCalled();
      expect(db.transaction).toHaveBeenCalled();
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        mockBill.dueDate,
        'monthly',
        null,
      );
    });

    it('skips bills with amountDue = 0', async () => {
      mockSelectBills([]);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('skips non-auto-pay bills', async () => {
      // Non-auto-pay bills should not be returned by the query
      // (filtered at DB level), so we return empty array
      mockSelectBills([]);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('skips already-paid bills', async () => {
      // Already-paid bills won't be returned by query (status='pending' filter)
      mockSelectBills([]);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('skips future due dates', async () => {
      // Future due dates won't be returned by query (dueDate <= today filter)
      mockSelectBills([]);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('handles one-time auto-pay bill', async () => {
      // Setup: One-time bill
      const mockBill = createMockBill({
        id: 'bill-once',
        frequency: 'once',
      });
      mockSelectBills([mockBill]);

      // Mock RecurrenceService to return null (no next occurrence)
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(null);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).toHaveBeenCalled();
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        mockBill.dueDate,
        'once',
        null,
      );
      // deriveStatus should NOT be called for one-time bills
      expect(RecurrenceService.deriveStatus).not.toHaveBeenCalled();
    });

    it('catches up on missed days (backlog)', async () => {
      // Setup: Bill with due date 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const mockBill = createMockBill({
        id: 'bill-backlog',
        dueDate: threeDaysAgo,
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      // Verify the original due date (3 days ago) was used
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        threeDaysAgo,
        'monthly',
        null,
      );
    });

    it('skips archived bills', async () => {
      // Archived bills won't be returned by query (isArchived=false filter)
      mockSelectBills([]);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('processes multiple eligible bills', async () => {
      // Setup: 3 eligible auto-pay bills
      const mockBills = [
        createMockBill({ id: 'bill-1' }),
        createMockBill({ id: 'bill-2' }),
        createMockBill({ id: 'bill-3' }),
      ];
      mockSelectBills(mockBills);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 3,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).toHaveBeenCalledTimes(3);
    });

    it('continues processing after individual failure', async () => {
      // Setup: 3 bills, second one will fail
      const mockBills = [
        createMockBill({ id: 'bill-1' }),
        createMockBill({ id: 'bill-2' }),
        createMockBill({ id: 'bill-3' }),
      ];
      mockSelectBills(mockBills);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      // Make the second transaction call throw an error
      let callCount = 0;
      (db.transaction as Mock).mockImplementation((callback) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Simulated database error');
        }
        return callback(db);
      });

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 2,
        failed: 1,
        failedIds: ['bill-2'],
      });
    });

    it('uses bill.dueDate as paidAt timestamp', async () => {
      vi.useFakeTimers();
      const specificDate = new Date('2025-01-15T00:00:00.000Z');
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));

      const mockBill = createMockBill({
        id: 'bill-specific-date',
        dueDate: specificDate,
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date('2025-02-15T00:00:00.000Z');
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');
      (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
      (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('unchanged');
      (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(specificDate);

      let insertedPaidAt: Date | undefined;
      (db.transaction as Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn((data: { paidAt: Date }) => {
              insertedPaidAt = data.paidAt;
              return { run: vi.fn() };
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({ run: vi.fn() }),
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(insertedPaidAt).toEqual(specificDate);

      vi.useRealTimers();
    });

    it('creates transaction with correct notes and amount', async () => {
      const mockBill = createMockBill({
        id: 'bill-verify-transaction',
        amount: 12345,
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      let insertedData: { billId: string; amount: number; notes: string } | undefined;
      (db.transaction as Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn((data: { billId: string; amount: number; notes: string }) => {
              insertedData = data;
              return { run: vi.fn() };
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({ run: vi.fn() }),
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(insertedData).toBeDefined();
      expect(insertedData?.billId).toBe('bill-verify-transaction');
      expect(insertedData?.amount).toBe(12345);
      expect(insertedData?.notes).toBe('Logged by Oar');
    });

    it('handles yearly frequency bills', async () => {
      const mockBill = createMockBill({
        id: 'bill-yearly',
        frequency: 'yearly',
      });
      mockSelectBills([mockBill]);

      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextYear);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        mockBill.dueDate,
        'yearly',
        null,
      );
    });

    it('derives overdue status when next due date is in past', async () => {
      const mockBill = createMockBill({
        id: 'bill-overdue-next',
      });
      mockSelectBills([mockBill]);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(pastDate);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('overdue');

      let updatedStatus: string | undefined;
      (db.transaction as Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({ run: vi.fn() }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn((data: { status: string }) => {
              updatedStatus = data.status;
              return {
                where: vi.fn().mockReturnValue({ run: vi.fn() }),
              };
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(pastDate);
      expect(updatedStatus).toBe('overdue');
    });

    it('updates bill with new due date for recurring bills', async () => {
      const mockBill = createMockBill({
        id: 'bill-verify-update',
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date('2025-02-15T00:00:00.000Z');
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      let updatedDueDate: Date | undefined;
      (db.transaction as Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({ run: vi.fn() }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn((data: { dueDate: Date }) => {
              updatedDueDate = data.dueDate;
              return {
                where: vi.fn().mockReturnValue({ run: vi.fn() }),
              };
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(updatedDueDate).toEqual(nextMonth);
    });

    it('marks one-time bill as paid without advancing due date', async () => {
      const originalDueDate = new Date('2025-01-15T00:00:00.000Z');
      const mockBill = createMockBill({
        id: 'bill-once-verify',
        frequency: 'once',
        dueDate: originalDueDate,
      });
      mockSelectBills([mockBill]);

      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(null);

      let updatedData: { status: string; dueDate?: Date } | undefined;
      (db.transaction as Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({ run: vi.fn() }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn((data: { status: string; dueDate?: Date }) => {
              updatedData = data;
              return {
                where: vi.fn().mockReturnValue({ run: vi.fn() }),
              };
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(updatedData?.status).toBe('paid');
      expect(updatedData?.dueDate).toBeUndefined();
    });

    it('logs error when bill processing fails', async () => {
      const mockBill = createMockBill({ id: 'bill-error' });
      mockSelectBills([mockBill]);

      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(new Date());
      (db.transaction as Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await AutoPayService.processAutoPay();

      const logger = getLogger('test');
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to process bill bill-error',
      );
    });

    it('returns empty result when no eligible bills exist', async () => {
      mockSelectBills([]);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 0,
        failed: 0,
        failedIds: [],
      });
      expect(db.select).toHaveBeenCalled();
    });

    it('uses adjusted date for eligibility check with previous_business_day strategy', async () => {
      vi.useFakeTimers();
      const today = new Date('2025-01-10T12:00:00.000Z');
      vi.setSystemTime(today);

      const saturday = new Date('2025-01-11T00:00:00.000Z');
      const friday = new Date('2025-01-10T00:00:00.000Z');

      const mockBill = createMockBill({
        id: 'bill-weekend',
        dueDate: saturday,
        weekendAdjustment: 'previous_business_day',
      });
      mockSelectBills([mockBill]);

      (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
      (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('previous_business_day');
      (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(friday);

      const nextMonth = new Date('2025-02-11T00:00:00.000Z');
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      (db.transaction as Mock).mockImplementation((callback) => callback(db));

      const result = await AutoPayService.processAutoPay();

      expect(result.processed).toBe(1);
      expect(DateAdjustmentService.getEffectiveStrategy).toHaveBeenCalledWith(
        'previous_business_day',
        'unchanged',
      );
      expect(DateAdjustmentService.adjustPaymentDate).toHaveBeenCalledWith(
        saturday,
        'previous_business_day',
      );
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        saturday,
        'monthly',
        null,
      );

      vi.useRealTimers();
    });

    it('skips bill when adjusted date is in future', async () => {
      vi.useFakeTimers();
      const today = new Date('2025-01-12T12:00:00.000Z');
      vi.setSystemTime(today);

      const saturday = new Date('2025-01-11T00:00:00.000Z');
      const monday = new Date('2025-01-13T00:00:00.000Z');

      const mockBill = createMockBill({
        id: 'bill-future',
        dueDate: saturday,
        weekendAdjustment: 'next_business_day',
      });
      mockSelectBills([mockBill]);

      (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
      (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('next_business_day');
      (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(monday);

      const result = await AutoPayService.processAutoPay();

      expect(result.processed).toBe(0);
      expect(db.transaction).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('uses anchor date for recurrence calculation', async () => {
      vi.useFakeTimers();
      const today = new Date('2025-01-10T12:00:00.000Z');
      vi.setSystemTime(today);

      const saturday = new Date('2025-01-11T00:00:00.000Z');
      const friday = new Date('2025-01-10T00:00:00.000Z');

      const mockBill = createMockBill({
        id: 'bill-anchor',
        dueDate: saturday,
        weekendAdjustment: 'previous_business_day',
      });
      mockSelectBills([mockBill]);

      (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
      (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('previous_business_day');
      (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(friday);

      const nextMonth = new Date('2025-02-11T00:00:00.000Z');
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      await AutoPayService.processAutoPay();

      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        saturday,
        'monthly',
        null,
      );
      expect(RecurrenceService.calculateNextDueDate).not.toHaveBeenCalledWith(
        friday,
        'monthly',
        null,
      );

      vi.useRealTimers();
    });

    it('creates transaction with adjusted date as paidAt', async () => {
      vi.useFakeTimers();
      const today = new Date('2025-01-10T12:00:00.000Z');
      vi.setSystemTime(today);

      const saturday = new Date('2025-01-11T00:00:00.000Z');
      const friday = new Date('2025-01-10T00:00:00.000Z');

      const mockBill = createMockBill({
        id: 'bill-paid-at',
        dueDate: saturday,
        weekendAdjustment: 'previous_business_day',
      });
      mockSelectBills([mockBill]);

      (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
      (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('previous_business_day');
      (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(friday);

      const nextMonth = new Date('2025-02-11T00:00:00.000Z');
      (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');

      let insertedPaidAt: Date | undefined;
      (db.transaction as Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn((data: { paidAt: Date }) => {
              insertedPaidAt = data.paidAt;
              return { run: vi.fn() };
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({ run: vi.fn() }),
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(insertedPaidAt).toEqual(friday);

      vi.useRealTimers();
    });

    describe('timezone-agnostic eligibility (regression: premature processing bug)', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
        (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('unchanged');
        (DateAdjustmentService.adjustPaymentDate as Mock).mockImplementation((date) => date);
        (RecurrenceService.calculateNextDueDate as Mock).mockReturnValue(
          new Date('2026-02-02T23:00:00.000Z'),
        );
        (RecurrenceService.deriveStatus as Mock).mockReturnValue('pending');
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it.each([
        {
          timezone: 'Poland (UTC+1)',
          dueDateUTC: '2026-01-01T23:00:00.000Z',
          cronTimeUTC: '2026-01-01T00:05:00.000Z',
          shouldProcess: false,
          description: 'Jan 2 00:00 Poland at Jan 1 00:05 UTC',
        },
        {
          timezone: 'Poland (UTC+1)',
          dueDateUTC: '2026-01-01T23:00:00.000Z',
          cronTimeUTC: '2026-01-02T00:05:00.000Z',
          shouldProcess: true,
          description: 'Jan 2 00:00 Poland at Jan 2 00:05 UTC',
        },
        {
          timezone: 'Japan (UTC+9)',
          dueDateUTC: '2026-01-01T15:00:00.000Z',
          cronTimeUTC: '2026-01-01T00:05:00.000Z',
          shouldProcess: false,
          description: 'Jan 2 00:00 Japan at Jan 1 00:05 UTC',
        },
        {
          timezone: 'Japan (UTC+9)',
          dueDateUTC: '2026-01-01T15:00:00.000Z',
          cronTimeUTC: '2026-01-01T16:00:00.000Z',
          shouldProcess: true,
          description: 'Jan 2 00:00 Japan at Jan 1 16:00 UTC',
        },
        {
          timezone: 'New York (UTC-5)',
          dueDateUTC: '2026-01-02T05:00:00.000Z',
          cronTimeUTC: '2026-01-02T00:05:00.000Z',
          shouldProcess: false,
          description: 'Jan 2 00:00 New York at Jan 2 00:05 UTC',
        },
        {
          timezone: 'New York (UTC-5)',
          dueDateUTC: '2026-01-02T05:00:00.000Z',
          cronTimeUTC: '2026-01-02T06:00:00.000Z',
          shouldProcess: true,
          description: 'Jan 2 00:00 New York at Jan 2 06:00 UTC',
        },
      ])(
        '$timezone: $description → $shouldProcess',
        async ({ dueDateUTC, cronTimeUTC, shouldProcess }) => {
          vi.setSystemTime(new Date(cronTimeUTC));

          const mockBill = createMockBill({
            id: 'bill-tz-test',
            dueDate: new Date(dueDateUTC),
          });
          mockSelectBills([mockBill]);

          const result = await AutoPayService.processAutoPay();

          if (shouldProcess) {
            expect(result.processed).toBe(1);
            expect(db.transaction).toHaveBeenCalled();
          } else {
            expect(result.processed).toBe(0);
            expect(db.transaction).not.toHaveBeenCalled();
          }
        },
      );
    });
  });
});
