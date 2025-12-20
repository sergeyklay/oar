import { PaymentService } from './PaymentService';
import { RecurrenceService } from './RecurrenceService';

jest.mock('./RecurrenceService', () => ({
  RecurrenceService: {
    calculateNextDueDate: jest.fn(),
    deriveStatus: jest.fn(),
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment with updateDueDate=true (Full Payment)', () => {
    it('advances due date and resets amountDue for monthly bill', () => {
      const nextMonth = new Date('2025-04-01');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 20000, true);

      expect(result.nextDueDate).toEqual(nextMonth);
      expect(result.newAmountDue).toBe(20000);
      expect(result.newStatus).toBe('pending');
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        bill.dueDate,
        'monthly'
      );
    });

    it('advances due date and resets amountDue for yearly bill', () => {
      const nextYear = new Date('2026-01-15');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextYear);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 120000,
        amountDue: 120000,
        dueDate: new Date('2025-01-15'),
        frequency: 'yearly' as const,
      };

      const result = PaymentService.processPayment(bill, 120000, true);

      expect(result.nextDueDate).toEqual(nextYear);
      expect(result.newAmountDue).toBe(120000);
      expect(result.newStatus).toBe('pending');
    });

    it('marks one-time bill as paid with zero amountDue', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
      };

      const result = PaymentService.processPayment(bill, 5000, true);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
    });

    it('resets amountDue to base amount even after partial payment', () => {
      const nextMonth = new Date('2025-04-01');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextMonth);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 5000, // Remaining after partial payment
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 5000, true);

      expect(result.newAmountDue).toBe(20000); // Reset to base amount
    });

    it('derives status as overdue when next due date is past', () => {
      const pastDate = new Date('2025-01-01');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(pastDate);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('overdue');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2024-12-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 10000, true);

      expect(result.newStatus).toBe('overdue');
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(pastDate);
    });
  });

  describe('processPayment with updateDueDate=false (Partial Payment)', () => {
    it('reduces amountDue without changing due date', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 15000, false);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(5000);
      expect(RecurrenceService.calculateNextDueDate).not.toHaveBeenCalled();
    });

    it('clamps amountDue to zero when payment exceeds amount due', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 5000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 10000, false);

      expect(result.newAmountDue).toBe(0);
    });

    it('preserves current status based on original due date', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('overdue');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2024-01-01'), // Past date
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 5000, false);

      expect(result.newStatus).toBe('overdue');
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(bill.dueDate);
    });

    it('handles exact payment amount correctly', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 15000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 15000, false);

      expect(result.newAmountDue).toBe(0);
    });

    it('allows multiple partial payments in sequence', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill1 = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result1 = PaymentService.processPayment(bill1, 5000, false);
      expect(result1.newAmountDue).toBe(15000);

      const bill2 = { ...bill1, amountDue: result1.newAmountDue };
      const result2 = PaymentService.processPayment(bill2, 5000, false);
      expect(result2.newAmountDue).toBe(10000);

      const bill3 = { ...bill1, amountDue: result2.newAmountDue };
      const result3 = PaymentService.processPayment(bill3, 10000, false);
      expect(result3.newAmountDue).toBe(0);
    });

    it('works with one-time bills for partial payments', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2025-03-01'),
        frequency: 'once' as const,
      };

      const result = PaymentService.processPayment(bill, 3000, false);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(7000);
      expect(result.newStatus).toBe('pending');
    });

    it('marks one-time bill as paid when fully paid via partial payment mode', () => {
      const bill = {
        amount: 31126,
        amountDue: 31126,
        dueDate: new Date('2026-05-23'),
        frequency: 'once' as const,
      };

      const result = PaymentService.processPayment(bill, 31126, false);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(RecurrenceService.deriveStatus).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles zero payment amount with updateDueDate=false', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 0, false);

      expect(result.newAmountDue).toBe(20000);
    });

    it('handles zero amountDue with new payment', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 0,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 5000, false);

      expect(result.newAmountDue).toBe(0); // Clamped to 0
    });

    it('handles large payment amounts (integer overflow protection)', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 1000000000, // 10 million in minor units
        amountDue: 500000000, // 5 million
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const result = PaymentService.processPayment(bill, 600000000, false);

      expect(result.newAmountDue).toBe(0);
    });
  });
});

