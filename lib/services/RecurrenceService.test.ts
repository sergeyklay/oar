import { RecurrenceService } from './RecurrenceService';

describe('RecurrenceService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
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
    it('returns stub response with zero counts', async () => {
      const result = await RecurrenceService.checkDailyBills();

      expect(result).toEqual({ checked: 0, updated: 0 });
    });

    it('returns a promise', () => {
      const result = RecurrenceService.checkDailyBills();

      expect(result).toBeInstanceOf(Promise);
    });
  });
});

