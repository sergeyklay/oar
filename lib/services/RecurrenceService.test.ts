// Mock the database module before importing RecurrenceService
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/db/schema', () => ({
  bills: {
    id: 'id',
    status: 'status',
    isArchived: 'isArchived',
  },
}));

import { RecurrenceService } from './RecurrenceService';
import { db } from '@/db';

describe('RecurrenceService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNextDueDate', () => {
    it('returns null for one-time bills', () => {
      const currentDate = new Date('2025-01-15');

      const result = RecurrenceService.calculateNextDueDate(currentDate, 'once');

      expect(result).toBeNull();
    });

    it('calculates next month for monthly bills', () => {
      const currentDate = new Date('2025-01-15');

      const result = RecurrenceService.calculateNextDueDate(currentDate, 'monthly');

      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(1); // February (0-indexed)
      expect(result!.getDate()).toBe(15);
    });

    it('calculates next year for yearly bills', () => {
      const currentDate = new Date('2025-06-20');

      const result = RecurrenceService.calculateNextDueDate(currentDate, 'yearly');

      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(5); // June (0-indexed)
      expect(result!.getDate()).toBe(20);
    });

    it('handles month-end dates correctly for monthly bills', () => {
      const currentDate = new Date('2025-01-31');

      const result = RecurrenceService.calculateNextDueDate(currentDate, 'monthly');

      expect(result).not.toBeNull();
      // rrule skips months without day 31, so Jan 31 -> Mar 31
      expect(result!.getMonth()).toBe(2); // March (0-indexed)
      expect(result!.getDate()).toBe(31);
    });

    it('handles leap year dates for yearly bills', () => {
      const currentDate = new Date('2024-02-29'); // Leap year date

      const result = RecurrenceService.calculateNextDueDate(currentDate, 'yearly');

      expect(result).not.toBeNull();
      // rrule jumps to next Feb 29 occurrence (2028, next leap year)
      expect(result!.getFullYear()).toBe(2028);
      expect(result!.getMonth()).toBe(1); // February
      expect(result!.getDate()).toBe(29);
    });
  });

  describe('deriveStatus', () => {
    it('returns pending for future due dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const result = RecurrenceService.deriveStatus(futureDate);

      expect(result).toBe('pending');
    });

    it('returns pending for today', () => {
      const today = new Date();

      const result = RecurrenceService.deriveStatus(today);

      expect(result).toBe('pending');
    });

    it('returns overdue for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const result = RecurrenceService.deriveStatus(pastDate);

      expect(result).toBe('overdue');
    });

    it('returns overdue for dates far in the past', () => {
      const pastDate = new Date('2020-01-01');

      const result = RecurrenceService.deriveStatus(pastDate);

      expect(result).toBe('overdue');
    });

    it('ignores time component when comparing dates', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of day

      const result = RecurrenceService.deriveStatus(today);

      expect(result).toBe('pending');
    });
  });

  describe('checkDailyBills', () => {
    const mockSelect = db.select as jest.Mock;
    const mockUpdate = db.update as jest.Mock;

    it('returns zero counts when no pending bills exist', async () => {
      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 0, updated: 0 });
      expect(mockSelect).toHaveBeenCalled();
    });

    it('updates overdue bills and returns correct counts', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockOverdueBill = {
        id: 'bill-1',
        title: 'Test Bill',
        dueDate: yesterday,
        status: 'pending',
      };

      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockOverdueBill]),
        }),
      });

      const mockSetFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      mockUpdate.mockReturnValue({ set: mockSetFn });

      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 1, updated: 1 });
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSetFn).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'overdue',
          updatedAt: expect.any(Date),
        })
      );
    });

    it('does not update bills due in the future', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockFutureBill = {
        id: 'bill-2',
        title: 'Future Bill',
        dueDate: tomorrow,
        status: 'pending',
      };

      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockFutureBill]),
        }),
      });

      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 1, updated: 0 });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('does not update bills due today', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const mockTodayBill = {
        id: 'bill-today',
        title: 'Due Today Bill',
        dueDate: today,
        status: 'pending',
      };

      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTodayBill]),
        }),
      });

      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 1, updated: 0 });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('correctly counts mixed bills (some overdue, some not)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockBills = [
        { id: 'bill-1', title: 'Overdue Bill', dueDate: yesterday, status: 'pending' },
        { id: 'bill-2', title: 'Future Bill', dueDate: tomorrow, status: 'pending' },
      ];

      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockBills),
        }),
      });

      mockUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 2, updated: 1 });
    });

    it('updates multiple overdue bills correctly', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockBills = [
        { id: 'bill-1', title: 'Old Overdue', dueDate: twoDaysAgo, status: 'pending' },
        { id: 'bill-2', title: 'Recent Overdue', dueDate: yesterday, status: 'pending' },
      ];

      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockBills),
        }),
      });

      mockUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 2, updated: 2 });
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('logs message for each overdue bill', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockOverdueBill = {
        id: 'bill-1',
        title: 'Rent Payment',
        dueDate: yesterday,
        status: 'pending',
      };

      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockOverdueBill]),
        }),
      });

      mockUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await RecurrenceService.checkDailyBills();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[RecurrenceService] Bill "Rent Payment" marked overdue')
      );
    });

    it('returns a promise', () => {
      mockSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = RecurrenceService.checkDailyBills();

      expect(result).toBeInstanceOf(Promise);
    });
  });
});

