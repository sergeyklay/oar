import { HistoryService } from './HistoryService';
import type { PaymentWithBill } from '@/lib/types';

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
});

