import { AutoPayService } from './AutoPayService';
import { db, resetDbMocks } from '@/db';
import { RecurrenceService } from './RecurrenceService';
import type { Bill } from '@/db/schema';

// Mock the database module
jest.mock('@/db');

// Mock RecurrenceService
jest.mock('./RecurrenceService', () => ({
  RecurrenceService: {
    calculateNextDueDate: jest.fn(),
    deriveStatus: jest.fn(),
  },
}));

describe('AutoPayService', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    // Suppress console.log/error in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Helper to create a mock bill with default values.
   */
  const createMockBill = (overrides: Partial<Bill> = {}): Bill => ({
    id: 'bill-1',
    title: 'Test Bill',
    amount: 9999, // $99.99 in minor units
    amountDue: 9999,
    dueDate: new Date(),
    frequency: 'monthly',
    isAutoPay: true,
    isVariable: false,
    status: 'pending',
    isArchived: false,
    notes: null,
    categoryId: 'category-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  /**
   * Helper to set up db.select mock to return specific bills.
   */
  const mockSelectBills = (billsToReturn: Bill[]) => {
    const selectBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(billsToReturn),
    };
    (db.select as jest.Mock).mockReturnValue(selectBuilder);
  };

  describe('processAutoPay', () => {
    it('processes eligible auto-pay bill', async () => {
      // Setup: Bill with isAutoPay=true, status='pending', dueDate=today
      const mockBill = createMockBill({
        id: 'bill-monthly',
        dueDate: new Date(),
        frequency: 'monthly',
      });
      mockSelectBills([mockBill]);

      // Mock RecurrenceService to return next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      // Action
      const result = await AutoPayService.processAutoPay();

      // Assert
      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).toHaveBeenCalled();
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        mockBill.dueDate,
        'monthly'
      );
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
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      expect(db.transaction).toHaveBeenCalled();
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        mockBill.dueDate,
        'once'
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
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      // Verify the original due date (3 days ago) was used
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        threeDaysAgo,
        'monthly'
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
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

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
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      // Make the second transaction call throw an error
      let callCount = 0;
      (db.transaction as jest.Mock).mockImplementation((callback) => {
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
      const specificDate = new Date('2025-01-15T00:00:00.000Z');
      const mockBill = createMockBill({
        id: 'bill-specific-date',
        dueDate: specificDate,
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date('2025-02-15T00:00:00.000Z');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      let insertedPaidAt: Date | undefined;
      (db.transaction as jest.Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn((data: { paidAt: Date }) => {
              insertedPaidAt = data.paidAt;
              return { run: jest.fn() };
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
            }),
          }),
        };
        return callback(mockTx);
      });

      await AutoPayService.processAutoPay();

      expect(insertedPaidAt).toEqual(specificDate);
    });

    it('creates transaction with correct notes and amount', async () => {
      const mockBill = createMockBill({
        id: 'bill-verify-transaction',
        amount: 12345,
      });
      mockSelectBills([mockBill]);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      let insertedData: { billId: string; amount: number; notes: string } | undefined;
      (db.transaction as jest.Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn((data: { billId: string; amount: number; notes: string }) => {
              insertedData = data;
              return { run: jest.fn() };
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
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
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextYear);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const result = await AutoPayService.processAutoPay();

      expect(result).toEqual({
        processed: 1,
        failed: 0,
        failedIds: [],
      });
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        mockBill.dueDate,
        'yearly'
      );
    });

    it('derives overdue status when next due date is in past', async () => {
      const mockBill = createMockBill({
        id: 'bill-overdue-next',
      });
      mockSelectBills([mockBill]);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(pastDate);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('overdue');

      let updatedStatus: string | undefined;
      (db.transaction as jest.Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({ run: jest.fn() }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn((data: { status: string }) => {
              updatedStatus = data.status;
              return {
                where: jest.fn().mockReturnValue({ run: jest.fn() }),
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
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      let updatedDueDate: Date | undefined;
      (db.transaction as jest.Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({ run: jest.fn() }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn((data: { dueDate: Date }) => {
              updatedDueDate = data.dueDate;
              return {
                where: jest.fn().mockReturnValue({ run: jest.fn() }),
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

      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      let updatedData: { status: string; dueDate?: Date } | undefined;
      (db.transaction as jest.Mock).mockImplementation((callback) => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({ run: jest.fn() }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn((data: { status: string; dueDate?: Date }) => {
              updatedData = data;
              return {
                where: jest.fn().mockReturnValue({ run: jest.fn() }),
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

      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(new Date());
      (db.transaction as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const errorSpy = jest.spyOn(console, 'error');

      await AutoPayService.processAutoPay();

      expect(errorSpy).toHaveBeenCalledWith(
        '[AutoPayService] Failed to process bill bill-error:',
        expect.any(Error)
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
  });
});

