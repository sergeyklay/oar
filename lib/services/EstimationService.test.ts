import {
  EstimationService,
  AverageLastThreePaymentsStrategy,
  HistoricalMonthStrategy,
} from './EstimationService';
import { TransactionService } from './TransactionService';
import { BillService } from './BillService';
import type { Transaction } from '@/lib/types';
import type { BillWithTags } from '@/db/schema';

jest.mock('./TransactionService');
jest.mock('./BillService');

describe('EstimationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AverageLastThreePaymentsStrategy', () => {
    it('calculates average of last 3 payments', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-2', billId: 'bill-1', amount: 12000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-3', billId: 'bill-1', amount: 11000, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBe(11000);
      expect(TransactionService.getByBillId).toHaveBeenCalledWith('bill-1', {
        limit: 3,
        orderBy: 'paidAt DESC',
      });
    });

    it('rounds average to nearest integer', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-2', billId: 'bill-1', amount: 11000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-3', billId: 'bill-1', amount: 12000, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBe(11000);
    });

    it('rounds up when average is fractional and >= 0.5', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-2', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-3', billId: 'bill-1', amount: 10002, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBe(10001);
    });

    it('rounds down when average is fractional and < 0.5', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-2', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-3', billId: 'bill-1', amount: 10001, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBe(10000);
    });

    it('returns null when no transactions found', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue([]);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBeNull();
    });

    it('works with single transaction', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 15000, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBe(15000);
    });

    it('works with two transactions', async () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 10000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-2', billId: 'bill-1', amount: 20000, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', new Date());

      expect(result).toBe(15000);
    });

    it('returns strategy name', () => {
      const strategy = new AverageLastThreePaymentsStrategy();
      expect(strategy.getName()).toBe('AverageLastThreePayments');
    });
  });

  describe('HistoricalMonthStrategy', () => {
    it('returns amount from same month in previous year', async () => {
      const strategy = new HistoricalMonthStrategy();
      const targetDate = new Date('2025-03-15');
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          billId: 'bill-1',
          amount: 25000,
          paidAt: new Date('2024-03-20'),
          notes: null,
          createdAt: new Date('2024-03-20'),
        },
      ];

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', targetDate);

      expect(result).toBe(25000);
      expect(TransactionService.getByBillIdAndMonth).toHaveBeenCalledWith('bill-1', 3, 2024);
    });

    it('uses most recent payment when multiple transactions in same month', async () => {
      const strategy = new HistoricalMonthStrategy();
      const targetDate = new Date('2025-06-15');
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          billId: 'bill-1',
          amount: 30000,
          paidAt: new Date('2024-06-25'),
          notes: null,
          createdAt: new Date('2024-06-25'),
        },
        {
          id: 'tx-2',
          billId: 'bill-1',
          amount: 28000,
          paidAt: new Date('2024-06-10'),
          notes: null,
          createdAt: new Date('2024-06-10'),
        },
      ];

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', targetDate);

      expect(result).toBe(30000);
    });

    it('returns null when no transactions found for historical month', async () => {
      const strategy = new HistoricalMonthStrategy();
      const targetDate = new Date('2025-03-15');

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue([]);

      const result = await strategy.calculate('bill-1', targetDate);

      expect(result).toBeNull();
    });

    it('handles January correctly (month 1)', async () => {
      const strategy = new HistoricalMonthStrategy();
      const targetDate = new Date('2025-01-15');
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          billId: 'bill-1',
          amount: 20000,
          paidAt: new Date('2024-01-10'),
          notes: null,
          createdAt: new Date('2024-01-10'),
        },
      ];

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', targetDate);

      expect(result).toBe(20000);
      expect(TransactionService.getByBillIdAndMonth).toHaveBeenCalledWith('bill-1', 1, 2024);
    });

    it('handles December correctly (month 12)', async () => {
      const strategy = new HistoricalMonthStrategy();
      const targetDate = new Date('2025-12-15');
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          billId: 'bill-1',
          amount: 35000,
          paidAt: new Date('2024-12-20'),
          notes: null,
          createdAt: new Date('2024-12-20'),
        },
      ];

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await strategy.calculate('bill-1', targetDate);

      expect(result).toBe(35000);
      expect(TransactionService.getByBillIdAndMonth).toHaveBeenCalledWith('bill-1', 12, 2024);
    });

    it('returns strategy name', () => {
      const strategy = new HistoricalMonthStrategy();
      expect(strategy.getName()).toBe('HistoricalMonth');
    });
  });

  describe('EstimationService.estimateAmount', () => {
    const mockBill: BillWithTags = {
      id: 'bill-1',
      title: 'Test Bill',
      amount: 20000,
      amountDue: 20000,
      dueDate: new Date('2025-03-15'),
      endDate: null,
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: true,
      status: 'pending' as const,
      isArchived: false,
      notes: null,
      categoryId: 'category-1',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      tags: [],
      categoryIcon: 'house',
    };

    it('returns historical month estimate when available', async () => {
      const targetDate = new Date('2025-03-15');
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          billId: 'bill-1',
          amount: 25000,
          paidAt: new Date('2024-03-20'),
          notes: null,
          createdAt: new Date('2024-03-20'),
        },
      ];

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await EstimationService.estimateAmount('bill-1', targetDate);

      expect(result).toBe(25000);
      expect(TransactionService.getByBillIdAndMonth).toHaveBeenCalled();
      expect(TransactionService.getByBillId).not.toHaveBeenCalled();
      expect(BillService.getWithTags).not.toHaveBeenCalled();
    });

    it('falls back to average strategy when historical month has no data', async () => {
      const targetDate = new Date('2025-03-15');
      const mockTransactions: Transaction[] = [
        { id: 'tx-1', billId: 'bill-1', amount: 22000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-2', billId: 'bill-1', amount: 23000, paidAt: new Date(), notes: null, createdAt: new Date() },
        { id: 'tx-3', billId: 'bill-1', amount: 24000, paidAt: new Date(), notes: null, createdAt: new Date() },
      ];

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue([]);
      (TransactionService.getByBillId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await EstimationService.estimateAmount('bill-1', targetDate);

      expect(result).toBe(23000);
      expect(TransactionService.getByBillIdAndMonth).toHaveBeenCalled();
      expect(TransactionService.getByBillId).toHaveBeenCalled();
      expect(BillService.getWithTags).not.toHaveBeenCalled();
    });

    it('falls back to bill base amount when no payment history', async () => {
      const targetDate = new Date('2025-03-15');

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue([]);
      (TransactionService.getByBillId as jest.Mock).mockResolvedValue([]);
      (BillService.getWithTags as jest.Mock).mockResolvedValue(mockBill);

      const result = await EstimationService.estimateAmount('bill-1', targetDate);

      expect(result).toBe(20000);
      expect(TransactionService.getByBillIdAndMonth).toHaveBeenCalled();
      expect(TransactionService.getByBillId).toHaveBeenCalled();
      expect(BillService.getWithTags).toHaveBeenCalledWith('bill-1');
    });

    it('throws error when bill not found', async () => {
      const targetDate = new Date('2025-03-15');

      (TransactionService.getByBillIdAndMonth as jest.Mock).mockResolvedValue([]);
      (TransactionService.getByBillId as jest.Mock).mockResolvedValue([]);
      (BillService.getWithTags as jest.Mock).mockResolvedValue(null);

      await expect(EstimationService.estimateAmount('bill-1', targetDate)).rejects.toThrow(
        'Bill not found: bill-1'
      );
    });
  });
});

