import { DueDateService } from './DueDateService';
import { addDays, subDays, addMonths } from 'date-fns';

describe('DueDateService', () => {
  describe('formatRelativeDueDate', () => {
    const today = new Date();

    describe('paid status', () => {
      it('returns "Paid" regardless of due date', () => {
        const pastDate = subDays(today, 30);

        const result = DueDateService.formatRelativeDueDate(pastDate, 'paid');

        expect(result).toBe('Paid');
      });

      it('returns "Paid" even for future due dates', () => {
        const futureDate = addDays(today, 30);

        const result = DueDateService.formatRelativeDueDate(futureDate, 'paid');

        expect(result).toBe('Paid');
      });
    });

    describe('overdue dates', () => {
      it('returns singular form for 1 day overdue', () => {
        const yesterday = subDays(today, 1);

        const result = DueDateService.formatRelativeDueDate(yesterday, 'overdue');

        expect(result).toBe('Overdue by 1 day');
      });

      it('returns plural form for multiple days overdue', () => {
        const fiveDaysAgo = subDays(today, 5);

        const result = DueDateService.formatRelativeDueDate(fiveDaysAgo, 'overdue');

        expect(result).toBe('Overdue by 5 days');
      });

      it('handles pending status for overdue dates', () => {
        const tenDaysAgo = subDays(today, 10);

        const result = DueDateService.formatRelativeDueDate(tenDaysAgo, 'pending');

        expect(result).toBe('Overdue by 10 days');
      });
    });

    describe('today and tomorrow', () => {
      it('returns "Due today" for today', () => {
        const result = DueDateService.formatRelativeDueDate(today, 'pending');

        expect(result).toBe('Due today');
      });

      it('returns "Due tomorrow" for tomorrow', () => {
        const tomorrow = addDays(today, 1);

        const result = DueDateService.formatRelativeDueDate(tomorrow, 'pending');

        expect(result).toBe('Due tomorrow');
      });
    });

    describe('days range (2-13 days)', () => {
      it('returns "Due in N days" for 2-6 days', () => {
        const threeDays = addDays(today, 3);

        const result = DueDateService.formatRelativeDueDate(threeDays, 'pending');

        expect(result).toBe('Due in 3 days');
      });

      it('returns "Due in 1 week" for exactly 7 days', () => {
        const sevenDays = addDays(today, 7);

        const result = DueDateService.formatRelativeDueDate(sevenDays, 'pending');

        expect(result).toBe('Due in 1 week');
      });

      it('returns "Due in N days" for 8-13 days', () => {
        const tenDays = addDays(today, 10);

        const result = DueDateService.formatRelativeDueDate(tenDays, 'pending');

        expect(result).toBe('Due in 10 days');
      });
    });

    describe('weeks range (14-27 days)', () => {
      it('returns "Due in 2 weeks" for 14 days', () => {
        const fourteenDays = addDays(today, 14);

        const result = DueDateService.formatRelativeDueDate(fourteenDays, 'pending');

        expect(result).toBe('Due in 2 weeks');
      });

      it('returns "Due in 3 weeks" for 21 days', () => {
        const twentyOneDays = addDays(today, 21);

        const result = DueDateService.formatRelativeDueDate(twentyOneDays, 'pending');

        expect(result).toBe('Due in 3 weeks');
      });
    });

    describe('months range', () => {
      it('returns "Due in about 1 month" for 28-45 days', () => {
        const thirtyDays = addDays(today, 30);

        const result = DueDateService.formatRelativeDueDate(thirtyDays, 'pending');

        expect(result).toBe('Due in about 1 month');
      });

      it('returns "Due in N months" for 2-5 months', () => {
        const threeMonths = addMonths(today, 3);

        const result = DueDateService.formatRelativeDueDate(threeMonths, 'pending');

        expect(result).toBe('Due in 3 months');
      });

      it.each([
        ['Due in over 6 months', 6],
        ['Due in over 7 months', 7],
        ['Due in over 8 months', 8],
        ['Due in over 9 months', 9],
        ['Due in over 10 months', 10],
        ['Due in over 11 months', 11],
      ])('returns "%s" for %d months', (expected, months) => {
        const date = addMonths(today, months);

        const result = DueDateService.formatRelativeDueDate(date, 'pending');

        expect(result).toBe(expected);
      });

      it('returns "Due in about a year" for 12 months', () => {
        const twelveMonths = addMonths(today, 12);

        const result = DueDateService.formatRelativeDueDate(twelveMonths, 'pending');

        expect(result).toBe('Due in about a year');
      });

      it('returns "Due in over a year" for 13+ months', () => {
        const thirteenMonths = addMonths(today, 13);

        const result = DueDateService.formatRelativeDueDate(thirteenMonths, 'pending');

        expect(result).toBe('Due in over a year');
      });
    });
  });
});

