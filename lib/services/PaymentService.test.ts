import { PaymentService } from './PaymentService';
import { RecurrenceService } from './RecurrenceService';
import type { Transaction } from '@/db/schema';

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  billId: 'bill-1',
  amount: 10000,
  paidAt: new Date('2025-01-15'),
  notes: null,
  createdAt: new Date(),
  ...overrides,
});

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
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is within current cycle (Feb 15 - Mar 1)
      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 20000, paidAt, true);

      expect(result.nextDueDate).toEqual(nextMonth);
      expect(result.newAmountDue).toBe(20000);
      expect(result.newStatus).toBe('pending');
      expect(result.isHistorical).toBe(false);
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        bill.dueDate,
        'monthly',
        null
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
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is within current cycle
      const paidAt = new Date('2025-01-10');
      const result = PaymentService.processPayment(bill, 120000, paidAt, true);

      expect(result.nextDueDate).toEqual(nextYear);
      expect(result.newAmountDue).toBe(120000);
      expect(result.newStatus).toBe('pending');
      expect(result.isHistorical).toBe(false);
    });

    it('marks one-time bill as paid with zero amountDue', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is on or after dueDate (current payment)
      const paidAt = new Date('2025-03-15');
      const result = PaymentService.processPayment(bill, 5000, paidAt, true);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(result.isHistorical).toBe(false);
      expect(result.billEnded).toBe(true);
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
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 5000, paidAt, true);

      expect(result.newAmountDue).toBe(20000); // Reset to base amount
      expect(result.isHistorical).toBe(false);
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
        status: 'overdue' as const,
        endDate: null,
      };

      // paidAt is within current cycle
      const paidAt = new Date('2024-11-25');
      const result = PaymentService.processPayment(bill, 10000, paidAt, true);

      expect(result.newStatus).toBe('overdue');
      expect(result.isHistorical).toBe(false);
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
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 15000, paidAt, false);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(5000);
      expect(result.isHistorical).toBe(false);
      expect(RecurrenceService.calculateNextDueDate).not.toHaveBeenCalled();
    });

    it('clamps amountDue to zero when payment exceeds amount due', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 5000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 10000, paidAt, false);

      expect(result.newAmountDue).toBe(0);
      expect(result.isHistorical).toBe(false);
    });

    it('preserves current status based on original due date', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('overdue');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2024-01-01'), // Past date
        frequency: 'monthly' as const,
        status: 'overdue' as const,
        endDate: null,
      };

      // paidAt is within current cycle (Dec 1 - Jan 1)
      const paidAt = new Date('2023-12-15');
      const result = PaymentService.processPayment(bill, 5000, paidAt, false);

      expect(result.newStatus).toBe('overdue');
      expect(result.isHistorical).toBe(false);
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(bill.dueDate);
    });

    it('handles exact payment amount correctly', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 15000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 15000, paidAt, false);

      expect(result.newAmountDue).toBe(0);
      expect(result.isHistorical).toBe(false);
    });

    it('allows multiple partial payments in sequence', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill1 = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result1 = PaymentService.processPayment(bill1, 5000, paidAt, false);
      expect(result1.newAmountDue).toBe(15000);

      const bill2 = { ...bill1, amountDue: result1.newAmountDue };
      const result2 = PaymentService.processPayment(bill2, 5000, paidAt, false);
      expect(result2.newAmountDue).toBe(10000);

      const bill3 = { ...bill1, amountDue: result2.newAmountDue };
      const result3 = PaymentService.processPayment(bill3, 10000, paidAt, false);
      expect(result3.newAmountDue).toBe(0);
    });

    it('works with one-time bills for partial payments', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2025-03-01'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is on the due date (current payment for once bills)
      const paidAt = new Date('2025-03-01');
      const result = PaymentService.processPayment(bill, 3000, paidAt, false);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(7000);
      expect(result.newStatus).toBe('pending');
      expect(result.isHistorical).toBe(false);
    });

    it('marks one-time bill as paid when fully paid via partial payment mode', () => {
      const bill = {
        amount: 31126,
        amountDue: 31126,
        dueDate: new Date('2024-05-23'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is on the due date (current payment for once bills)
      const paidAt = new Date('2024-05-23');
      const result = PaymentService.processPayment(bill, 31126, paidAt, false);

      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(result.isHistorical).toBe(false);
      expect(result.billEnded).toBe(true);
      expect(RecurrenceService.deriveStatus).not.toHaveBeenCalled();
    });
  });

  describe('bill end detection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('detects bill end when next due date exceeds endDate', () => {
      const nextDueDate = new Date('2025-04-15');
      const endDate = new Date('2025-03-20');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextDueDate);

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-15'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate,
      };

      const paidAt = new Date('2025-03-14');
      const result = PaymentService.processPayment(bill, 20000, paidAt, true);

      expect(result.billEnded).toBe(true);
      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        bill.dueDate,
        'monthly',
        endDate
      );
    });

    it('detects bill end for one-time bills', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-03-15');
      const result = PaymentService.processPayment(bill, 5000, paidAt, true);

      expect(result.billEnded).toBe(true);
      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
    });

    it('detects bill end when interval changed to once and fully paid via partial payment', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-03-15');
      const result = PaymentService.processPayment(bill, 10000, paidAt, false);

      expect(result.billEnded).toBe(true);
      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
    });

    it('does not detect bill end when next due date does not exceed endDate', () => {
      const nextDueDate = new Date('2025-04-15');
      const endDate = new Date('2025-05-20');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextDueDate);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-15'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate,
      };

      const paidAt = new Date('2025-03-14');
      const result = PaymentService.processPayment(bill, 20000, paidAt, true);

      expect(result.billEnded).toBe(false);
      expect(result.nextDueDate).toEqual(nextDueDate);
      expect(result.newAmountDue).toBe(20000);
      expect(result.newStatus).toBe('pending');
    });

    it('does not detect bill end for recurring bills without endDate', () => {
      const nextDueDate = new Date('2025-04-15');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextDueDate);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-15'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-03-14');
      const result = PaymentService.processPayment(bill, 20000, paidAt, true);

      expect(result.billEnded).toBe(false);
      expect(result.nextDueDate).toEqual(nextDueDate);
    });

    it('does not detect bill end for partial payments on recurring bills', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-15'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-03-14');
      const result = PaymentService.processPayment(bill, 5000, paidAt, false);

      expect(result.billEnded).toBe(false);
      expect(result.nextDueDate).toBeNull();
      expect(result.newAmountDue).toBe(15000);
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
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 0, paidAt, false);

      expect(result.newAmountDue).toBe(20000);
      expect(result.isHistorical).toBe(false);
    });

    it('handles zero amountDue with new payment', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 0,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 5000, paidAt, false);

      expect(result.newAmountDue).toBe(0); // Clamped to 0
      expect(result.isHistorical).toBe(false);
    });

    it('handles large payment amounts (integer overflow protection)', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 1000000000, // 10 million in minor units
        amountDue: 500000000, // 5 million
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const paidAt = new Date('2025-02-28');
      const result = PaymentService.processPayment(bill, 600000000, paidAt, false);

      expect(result.newAmountDue).toBe(0);
      expect(result.isHistorical).toBe(false);
    });
  });

  describe('historical payment detection', () => {
    it('detects historical payment for monthly bill when paidAt is before cycle start', () => {
      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is 3 months before dueDate (clearly before cycle start of Feb 1)
      const paidAt = new Date('2024-12-01');
      const result = PaymentService.processPayment(bill, 20000, paidAt, true);

      expect(result.isHistorical).toBe(true);
      expect(result.newAmountDue).toBe(20000); // Unchanged
      expect(result.newStatus).toBe('pending'); // Unchanged
      expect(result.nextDueDate).toBeNull(); // No change
    });

    it('treats payment within cycle as current for monthly bill', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(new Date('2025-04-01'));
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is within current cycle (Feb 1 - Mar 1)
      const paidAt = new Date('2025-02-15');
      const result = PaymentService.processPayment(bill, 20000, paidAt, true);

      expect(result.isHistorical).toBe(false);
      expect(result.nextDueDate).toEqual(new Date('2025-04-01'));
    });

    it('treats early payment on one-time bill as current and marks as paid', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is before dueDate - early payment should still mark as paid
      const paidAt = new Date('2025-03-10');
      const result = PaymentService.processPayment(bill, 5000, paidAt, true);

      expect(result.isHistorical).toBe(false);
      expect(result.newAmountDue).toBe(0);
      expect(result.newStatus).toBe('paid');
    });

    it('treats payment on dueDate as current for one-time bill', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is on dueDate
      const paidAt = new Date('2025-03-15');
      const result = PaymentService.processPayment(bill, 5000, paidAt, true);

      expect(result.isHistorical).toBe(false);
      expect(result.newStatus).toBe('paid');
    });

    it('detects historical payment for weekly bill', () => {
      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'weekly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      // paidAt is 2 weeks before dueDate (before cycle start of Mar 8)
      const paidAt = new Date('2025-03-01');
      const result = PaymentService.processPayment(bill, 5000, paidAt, true);

      expect(result.isHistorical).toBe(true);
    });
  });

  describe('recalculateBillFromPayments', () => {
    it('returns base state for one-time bill with no payments', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2025-12-23'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns: Transaction[] = [];

      const result = PaymentService.recalculateBillFromPayments(bill, txns);

      expect(result.amountDue).toBe(10000);
      expect(result.status).toBe('pending');
      expect(result.nextDueDate).toBeNull();
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(bill.dueDate);
    });

    it('reverts to previous cycle when no current payments but cycle was advanced', () => {
      const previousDueDate = new Date('2026-12-23');
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2027-12-23'),
        frequency: 'yearly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns: Transaction[] = [];

      const result = PaymentService.recalculateBillFromPayments(bill, txns);

      expect(result.amountDue).toBe(10000);
      expect(result.status).toBe('pending');
      expect(result.nextDueDate).toEqual(previousDueDate);
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(previousDueDate);
    });

    it('keeps current cycle when previous cycle was fully paid', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2027-12-23'),
        frequency: 'yearly' as const,
        status: 'pending' as const,
      };

      const txns: Transaction[] = [
        createTransaction({ amount: 10000, paidAt: new Date('2026-12-20') }),
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns);

      expect(result.amountDue).toBe(10000);
      expect(result.status).toBe('pending');
      expect(result.nextDueDate).toBeNull();
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(bill.dueDate);
    });

    it('reverts to previous cycle with partial payment when previous cycle had partial payment', () => {
      const previousDueDate = new Date('2026-12-23');
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2027-12-23'),
        frequency: 'yearly' as const,
        status: 'pending' as const,
      };

      const txns: Transaction[] = [
        createTransaction({ amount: 5000, paidAt: new Date('2026-12-20') }),
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns);

      expect(result.amountDue).toBe(5000);
      expect(result.status).toBe('pending');
      expect(result.nextDueDate).toEqual(previousDueDate);
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(previousDueDate);
    });

    it('advances cycle when total paid in current cycle >= amountDue', () => {
      const nextDueDate = new Date('2025-04-01');
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextDueDate);
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns = [
        {
          id: 'tx-1',
          amount: 20000,
          paidAt: new Date('2025-02-28'),
        },
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns as Transaction[]);

      expect(result.amountDue).toBe(20000);
      expect(result.status).toBe('pending');
      expect(result.nextDueDate).toEqual(nextDueDate);
      expect(RecurrenceService.calculateNextDueDate).toHaveBeenCalledWith(
        bill.dueDate,
        'monthly'
      );
    });

    it('marks one-time bill as paid when total paid >= amountDue', () => {
      (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

      const bill = {
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-03-15'),
        frequency: 'once' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns = [
        {
          id: 'tx-1',
          amount: 5000,
          paidAt: new Date('2025-03-15'),
        },
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns as Transaction[]);

      expect(result.amountDue).toBe(0);
      expect(result.status).toBe('paid');
      expect(result.nextDueDate).toBeNull();
    });

    it('reduces amountDue for partial payment in current cycle', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns = [
        {
          id: 'tx-1',
          amount: 5000,
          paidAt: new Date('2025-02-28'),
        },
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns as Transaction[]);

      expect(result.amountDue).toBe(15000);
      expect(result.status).toBe('pending');
      expect(result.nextDueDate).toBeNull();
      expect(RecurrenceService.deriveStatus).toHaveBeenCalledWith(bill.dueDate);
    });

    it('sums multiple payments in current cycle', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns = [
        {
          id: 'tx-1',
          amount: 5000,
          paidAt: new Date('2025-02-28'),
        },
        {
          id: 'tx-2',
          amount: 3000,
          paidAt: new Date('2025-02-25'),
        },
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns as Transaction[]);

      expect(result.amountDue).toBe(12000);
    });

    it('excludes historical payments from calculation', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns = [
        {
          id: 'tx-1',
          amount: 5000,
          paidAt: new Date('2025-02-28'),
        },
        {
          id: 'tx-2',
          amount: 10000,
          paidAt: new Date('2024-12-01'),
        },
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns as Transaction[]);

      expect(result.amountDue).toBe(15000);
    });

    it('clamps amountDue to zero when overpayment occurs', () => {
      (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');

      const bill = {
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
        status: 'pending' as const,
        endDate: null,
      };

      const txns = [
        {
          id: 'tx-1',
          amount: 25000,
          paidAt: new Date('2025-02-28'),
        },
      ];

      const result = PaymentService.recalculateBillFromPayments(bill, txns as Transaction[]);

      expect(result.amountDue).toBe(0);
    });
  });

  describe('doesPaymentAffectCurrentCycle', () => {
    it('returns true when payment is in current cycle', () => {
      const bill = {
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const tx = {
        id: 'tx-1',
        amount: 10000,
        paidAt: new Date('2025-02-28'),
      };

      const result = PaymentService.doesPaymentAffectCurrentCycle(bill, tx as Transaction);

      expect(result).toBe(true);
    });

    it('returns false when payment is historical and not in previous cycle', () => {
      const bill = {
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const tx = {
        id: 'tx-1',
        amount: 10000,
        paidAt: new Date('2024-12-01'),
      };

      const result = PaymentService.doesPaymentAffectCurrentCycle(bill, tx as Transaction);

      expect(result).toBe(false);
    });

    it('returns true when payment is in previous cycle (caused advancement)', () => {
      const bill = {
        dueDate: new Date('2025-03-01'),
        frequency: 'monthly' as const,
      };

      const tx = {
        id: 'tx-1',
        amount: 10000,
        paidAt: new Date('2025-01-15'),
      };

      const result = PaymentService.doesPaymentAffectCurrentCycle(bill, tx as Transaction);

      expect(result).toBe(true);
    });

    it('returns true for one-time bills regardless of payment date', () => {
      const bill = {
        dueDate: new Date('2025-03-01'),
        frequency: 'once' as const,
      };

      const tx = {
        id: 'tx-1',
        amount: 10000,
        paidAt: new Date('2024-12-01'),
      };

      const result = PaymentService.doesPaymentAffectCurrentCycle(bill, tx as Transaction);

      expect(result).toBe(true);
    });

    it('returns true for yearly bills when payment is in previous cycle', () => {
      const bill = {
        dueDate: new Date('2027-12-23'),
        frequency: 'yearly' as const,
      };

      const tx = {
        id: 'tx-1',
        amount: 10000,
        paidAt: new Date('2026-12-25'),
      };

      const result = PaymentService.doesPaymentAffectCurrentCycle(bill, tx as Transaction);

      expect(result).toBe(true);
    });
  });
});

