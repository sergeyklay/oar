import { getCycleStartDate, isPaymentHistorical } from './billing-cycle';

describe('billing-cycle utilities', () => {
  describe('getCycleStartDate', () => {
    it('returns null for one-time bills', () => {
      const dueDate = new Date('2025-03-15');
      const result = getCycleStartDate(dueDate, 'once');
      expect(result).toBeNull();
    });

    it('calculates correct cycle start for weekly bills', () => {
      const dueDate = new Date('2025-03-15');
      const result = getCycleStartDate(dueDate, 'weekly');
      expect(result).toEqual(new Date('2025-03-08'));
    });

    it('calculates correct cycle start for monthly bills', () => {
      const dueDate = new Date('2025-03-15');
      const result = getCycleStartDate(dueDate, 'monthly');
      expect(result).toEqual(new Date('2025-02-15'));
    });

    it('calculates correct cycle start for quarterly bills', () => {
      const dueDate = new Date('2025-03-15');
      const result = getCycleStartDate(dueDate, 'quarterly');
      expect(result).toEqual(new Date('2024-12-15'));
    });

    it('calculates correct cycle start for yearly bills', () => {
      const dueDate = new Date('2025-03-15');
      const result = getCycleStartDate(dueDate, 'yearly');
      expect(result).toEqual(new Date('2024-03-15'));
    });
  });

  describe('isPaymentHistorical', () => {
    it('returns true when paidAt is before cycle start for monthly bill', () => {
      const bill = {
        dueDate: new Date('2025-03-15'),
        frequency: 'monthly' as const,
      };
      const paidAt = new Date('2025-02-01'); // Before cycle start (Feb 15)

      expect(isPaymentHistorical(bill, paidAt)).toBe(true);
    });

    it('returns false when paidAt is within cycle for monthly bill', () => {
      const bill = {
        dueDate: new Date('2025-03-15'),
        frequency: 'monthly' as const,
      };
      const paidAt = new Date('2025-02-20'); // After cycle start (Feb 15)

      expect(isPaymentHistorical(bill, paidAt)).toBe(false);
    });

    it('returns false for one-time bills regardless of payment date', () => {
      const bill = {
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
      };

      // Early payment - not historical
      expect(isPaymentHistorical(bill, new Date('2025-03-10'))).toBe(false);

      // On due date - not historical
      expect(isPaymentHistorical(bill, new Date('2025-03-15'))).toBe(false);

      // Late payment - not historical
      expect(isPaymentHistorical(bill, new Date('2025-03-20'))).toBe(false);
    });
  });
});

