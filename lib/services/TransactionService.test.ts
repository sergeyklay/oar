import { TransactionService } from './TransactionService';
import { db, transactions, bills } from '@/db';
import { PaymentWithBill } from '@/lib/types';
import { startOfDay, endOfDay, subDays } from 'date-fns';

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  transactions: {
    id: 'transactions.id',
    billId: 'transactions.bill_id',
    amount: 'transactions.amount',
    paidAt: 'transactions.paid_at',
    notes: 'transactions.notes',
  },
  bills: {
    id: 'bills.id',
    title: 'bills.title',
    categoryId: 'bills.category_id',
  },
  billCategories: {
    id: 'bill_categories.id',
    icon: 'bill_categories.icon',
  },
}));

const mockGte = jest.fn();
const mockLte = jest.fn();
const mockAnd = jest.fn();

jest.mock('drizzle-orm', () => ({
  gte: (...args: unknown[]) => {
    mockGte(...args);
    return { type: 'gte', args };
  },
  lte: (...args: unknown[]) => {
    mockLte(...args);
    return { type: 'lte', args };
  },
  and: (...args: unknown[]) => {
    mockAnd(...args);
    return { type: 'and', args };
  },
  desc: jest.fn((col) => ({ type: 'desc', col })),
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
}));

describe('TransactionService', () => {
  describe('getRecentPayments', () => {
    const FIXED_DATE = new Date('2025-12-19T14:30:00.000Z');

    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
      jest.setSystemTime(FIXED_DATE);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const mockPayments: PaymentWithBill[] = [
      {
        id: 'tx-1',
        billTitle: 'Rent',
        amount: 5000,
        paidAt: new Date(),
        notes: 'Monthly rent',
        categoryIcon: 'house',
      },
    ];

    const setupDbMock = (returnValue: PaymentWithBill[]) => {
      const orderByMock = jest.fn().mockResolvedValue(returnValue);
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const secondInnerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
      const firstInnerJoinMock = jest.fn().mockReturnValue({ innerJoin: secondInnerJoinMock });
      const fromMock = jest.fn().mockReturnValue({ innerJoin: firstInnerJoinMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return { orderByMock, whereMock, innerJoinMock: firstInnerJoinMock, fromMock };
    };

    it('fetches payments within date range', async () => {
      const { fromMock, innerJoinMock } = setupDbMock(mockPayments);

      const result = await TransactionService.getRecentPayments(7);

      expect(result).toEqual(mockPayments);
      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(transactions);
      expect(innerJoinMock).toHaveBeenCalledWith(bills, expect.anything());
    });

    it('returns empty array when no payments found', async () => {
      setupDbMock([]);

      const result = await TransactionService.getRecentPayments(7);

      expect(result).toEqual([]);
    });

    it('calculates date range for days=0 (today only)', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(0);

      const expectedStart = startOfDay(FIXED_DATE);
      const expectedEnd = endOfDay(FIXED_DATE);

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
    });

    it('calculates date range for days=1 (today or yesterday)', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(1);

      const expectedStart = startOfDay(subDays(FIXED_DATE, 1));
      const expectedEnd = endOfDay(FIXED_DATE);

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
    });

    it('calculates date range for days=7 (last 7 days)', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(7);

      const expectedStart = startOfDay(subDays(FIXED_DATE, 7));
      const expectedEnd = endOfDay(FIXED_DATE);

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
    });

    it('calculates date range for days=30 (last 30 days)', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(30);

      const expectedStart = startOfDay(subDays(FIXED_DATE, 30));
      const expectedEnd = endOfDay(FIXED_DATE);

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
    });

    it('combines date conditions with and()', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(7);

      expect(mockAnd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'gte' }),
        expect.objectContaining({ type: 'lte' })
      );
    });
  });
});
