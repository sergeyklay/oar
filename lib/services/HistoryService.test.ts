import { HistoryService } from './HistoryService';
import type { PaymentWithBill, AggregatedBillSpending } from '@/lib/types';

describe('HistoryService', () => {
  describe('calculateSummary', () => {
    it('calculates count and total for multiple payments', () => {
      const payments: PaymentWithBill[] = [
        {
          id: 'tx-1',
          billTitle: 'Rent',
          amount: 200000,
          paidAt: new Date('2025-12-01'),
          notes: null,
          categoryIcon: 'house',
        },
        {
          id: 'tx-2',
          billTitle: 'Internet',
          amount: 8000,
          paidAt: new Date('2025-12-05'),
          notes: null,
          categoryIcon: 'wifi',
        },
        {
          id: 'tx-3',
          billTitle: 'Electric',
          amount: 15000,
          paidAt: new Date('2025-12-10'),
          notes: null,
          categoryIcon: 'zap',
        },
      ];

      const result = HistoryService.calculateSummary(payments);

      expect(result.count).toBe(3);
      expect(result.totalPaid).toBe(223000);
    });

    it('returns zero count and total for empty array', () => {
      const result = HistoryService.calculateSummary([]);

      expect(result.count).toBe(0);
      expect(result.totalPaid).toBe(0);
    });

    it('handles single payment', () => {
      const payments: PaymentWithBill[] = [
        {
          id: 'tx-1',
          billTitle: 'Rent',
          amount: 200000,
          paidAt: new Date('2025-12-01'),
          notes: null,
          categoryIcon: 'house',
        },
      ];

      const result = HistoryService.calculateSummary(payments);

      expect(result.count).toBe(1);
      expect(result.totalPaid).toBe(200000);
    });

    it('handles payments with zero amounts', () => {
      const payments: PaymentWithBill[] = [
        {
          id: 'tx-1',
          billTitle: 'Bill 1',
          amount: 0,
          paidAt: new Date('2025-12-01'),
          notes: null,
          categoryIcon: 'house',
        },
        {
          id: 'tx-2',
          billTitle: 'Bill 2',
          amount: 5000,
          paidAt: new Date('2025-12-05'),
          notes: null,
          categoryIcon: 'wifi',
        },
      ];

      const result = HistoryService.calculateSummary(payments);

      expect(result.count).toBe(2);
      expect(result.totalPaid).toBe(5000);
    });

    it('handles large payment amounts', () => {
      const payments: PaymentWithBill[] = [
        {
          id: 'tx-1',
          billTitle: 'Large Payment',
          amount: 99999999,
          paidAt: new Date('2025-12-01'),
          notes: null,
          categoryIcon: 'house',
        },
      ];

      const result = HistoryService.calculateSummary(payments);

      expect(result.count).toBe(1);
      expect(result.totalPaid).toBe(99999999);
    });

    it('sums all payment amounts correctly', () => {
      const payments: PaymentWithBill[] = [
        {
          id: 'tx-1',
          billTitle: 'Payment 1',
          amount: 1000,
          paidAt: new Date('2025-12-01'),
          notes: null,
          categoryIcon: 'house',
        },
        {
          id: 'tx-2',
          billTitle: 'Payment 2',
          amount: 2000,
          paidAt: new Date('2025-12-02'),
          notes: null,
          categoryIcon: 'wifi',
        },
        {
          id: 'tx-3',
          billTitle: 'Payment 3',
          amount: 3000,
          paidAt: new Date('2025-12-03'),
          notes: null,
          categoryIcon: 'zap',
        },
      ];

      const result = HistoryService.calculateSummary(payments);

      expect(result.totalPaid).toBe(6000);
    });
  });

  describe('calculateAnnualSummary', () => {
    it('calculates summary for multiple bills', () => {
      const aggregatedData: AggregatedBillSpending[] = [
        {
          billId: 'bill-1',
          billTitle: 'Rent',
          categoryIcon: 'house',
          paymentCount: 12,
          totalAmount: 1200000,
          averageAmount: 100000,
        },
        {
          billId: 'bill-2',
          billTitle: 'Internet',
          categoryIcon: 'wifi',
          paymentCount: 12,
          totalAmount: 60000,
          averageAmount: 5000,
        },
        {
          billId: 'bill-3',
          billTitle: 'Electric',
          categoryIcon: 'zap',
          paymentCount: 6,
          totalAmount: 90000,
          averageAmount: 15000,
        },
      ];

      const result = HistoryService.calculateAnnualSummary(aggregatedData);

      expect(result.totalBills).toBe(3);
      expect(result.totalPayments).toBe(30);
      expect(result.amountPaid).toBe(1350000);
    });

    it('returns zero summary for empty array', () => {
      const result = HistoryService.calculateAnnualSummary([]);

      expect(result.totalBills).toBe(0);
      expect(result.totalPayments).toBe(0);
      expect(result.amountPaid).toBe(0);
    });

    it('handles single bill', () => {
      const aggregatedData: AggregatedBillSpending[] = [
        {
          billId: 'bill-1',
          billTitle: 'Rent',
          categoryIcon: 'house',
          paymentCount: 1,
          totalAmount: 100000,
          averageAmount: 100000,
        },
      ];

      const result = HistoryService.calculateAnnualSummary(aggregatedData);

      expect(result.totalBills).toBe(1);
      expect(result.totalPayments).toBe(1);
      expect(result.amountPaid).toBe(100000);
    });

    it('sums payment counts correctly', () => {
      const aggregatedData: AggregatedBillSpending[] = [
        {
          billId: 'bill-1',
          billTitle: 'Bill 1',
          categoryIcon: 'house',
          paymentCount: 5,
          totalAmount: 50000,
          averageAmount: 10000,
        },
        {
          billId: 'bill-2',
          billTitle: 'Bill 2',
          categoryIcon: 'wifi',
          paymentCount: 3,
          totalAmount: 30000,
          averageAmount: 10000,
        },
        {
          billId: 'bill-3',
          billTitle: 'Bill 3',
          categoryIcon: 'zap',
          paymentCount: 7,
          totalAmount: 70000,
          averageAmount: 10000,
        },
      ];

      const result = HistoryService.calculateAnnualSummary(aggregatedData);

      expect(result.totalPayments).toBe(15);
    });

    it('sums total amounts correctly (integer addition)', () => {
      const aggregatedData: AggregatedBillSpending[] = [
        {
          billId: 'bill-1',
          billTitle: 'Bill 1',
          categoryIcon: 'house',
          paymentCount: 1,
          totalAmount: 123456,
          averageAmount: 123456,
        },
        {
          billId: 'bill-2',
          billTitle: 'Bill 2',
          categoryIcon: 'wifi',
          paymentCount: 1,
          totalAmount: 789012,
          averageAmount: 789012,
        },
      ];

      const result = HistoryService.calculateAnnualSummary(aggregatedData);

      expect(result.amountPaid).toBe(912468);
    });

    it('handles bills with zero amounts', () => {
      const aggregatedData: AggregatedBillSpending[] = [
        {
          billId: 'bill-1',
          billTitle: 'Bill 1',
          categoryIcon: 'house',
          paymentCount: 1,
          totalAmount: 0,
          averageAmount: 0,
        },
        {
          billId: 'bill-2',
          billTitle: 'Bill 2',
          categoryIcon: 'wifi',
          paymentCount: 2,
          totalAmount: 10000,
          averageAmount: 5000,
        },
      ];

      const result = HistoryService.calculateAnnualSummary(aggregatedData);

      expect(result.totalBills).toBe(2);
      expect(result.totalPayments).toBe(3);
      expect(result.amountPaid).toBe(10000);
    });
  });
});

