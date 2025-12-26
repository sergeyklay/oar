import { TransactionService } from './TransactionService';
import { db, transactions, bills } from '@/db';
import { PaymentWithBill, Transaction } from '@/lib/types';
import { startOfDay, endOfDay, subDays, parse, startOfMonth, endOfMonth } from 'date-fns';

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
  tags: {
    id: 'tags.id',
    slug: 'tags.slug',
  },
  billsToTags: {
    billId: 'bills_to_tags.bill_id',
    tagId: 'bills_to_tags.tag_id',
  },
}));

const mockGte = jest.fn();
const mockLte = jest.fn();
const mockAnd = jest.fn();
const mockEq = jest.fn();
const mockInArray = jest.fn();

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
  eq: (...args: unknown[]) => {
    mockEq(...args);
    return { type: 'eq', a: args[0], b: args[1] };
  },
  inArray: (...args: unknown[]) => {
    mockInArray(...args);
    return { type: 'inArray', args };
  },
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

  describe('getPaymentsByDate', () => {
    const mockPayments: PaymentWithBill[] = [
      {
        id: 'tx-1',
        billTitle: 'Rent',
        amount: 5000,
        paidAt: new Date('2025-12-15T10:30:00.000Z'),
        notes: 'Monthly rent',
        categoryIcon: 'house',
      },
      {
        id: 'tx-2',
        billTitle: 'Electric',
        amount: 2500,
        paidAt: new Date('2025-12-15T14:45:00.000Z'),
        notes: null,
        categoryIcon: 'zap',
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetches payments for a specific date', async () => {
      const { fromMock, innerJoinMock } = setupDbMock(mockPayments);

      const result = await TransactionService.getPaymentsByDate('2025-12-15');

      expect(result).toEqual(mockPayments);
      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(transactions);
      expect(innerJoinMock).toHaveBeenCalledWith(bills, expect.anything());
    });

    it('returns empty array when no payments found for date', async () => {
      setupDbMock([]);

      const result = await TransactionService.getPaymentsByDate('2025-12-15');

      expect(result).toEqual([]);
    });

    it('calculates correct date range for the specified date', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getPaymentsByDate('2025-12-15');

      const dateObj = parse('2025-12-15', 'yyyy-MM-dd', new Date());
      const expectedStart = startOfDay(dateObj);
      const expectedEnd = endOfDay(dateObj);

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
    });

    it('combines date conditions with and()', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getPaymentsByDate('2025-12-15');

      expect(mockAnd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'gte' }),
        expect.objectContaining({ type: 'lte' })
      );
    });

    it('orders results by paidAt descending', async () => {
      const { orderByMock } = setupDbMock(mockPayments);

      await TransactionService.getPaymentsByDate('2025-12-15');

      expect(orderByMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
    });

    it('throws error for invalid date string', async () => {
      await expect(TransactionService.getPaymentsByDate('not-a-date')).rejects.toThrow(
        'Invalid date format: "not-a-date". Expected YYYY-MM-DD format.'
      );
    });

    it('throws error for invalid month and day', async () => {
      await expect(TransactionService.getPaymentsByDate('2025-13-45')).rejects.toThrow(
        'Invalid date format: "2025-13-45". Expected YYYY-MM-DD format.'
      );
    });

    it('throws error for invalid day for month', async () => {
      await expect(TransactionService.getPaymentsByDate('2025-02-30')).rejects.toThrow(
        'Invalid date format: "2025-02-30". Expected YYYY-MM-DD format.'
      );
    });

    it('throws error for empty string', async () => {
      await expect(TransactionService.getPaymentsByDate('')).rejects.toThrow(
        'Invalid date format: "". Expected YYYY-MM-DD format.'
      );
    });

    it('throws error for incomplete date', async () => {
      await expect(TransactionService.getPaymentsByDate('2025-12')).rejects.toThrow(
        'Invalid date format: "2025-12". Expected YYYY-MM-DD format.'
      );
    });

    it('still works correctly with valid date', async () => {
      const { fromMock } = setupDbMock(mockPayments);

      const result = await TransactionService.getPaymentsByDate('2025-12-15');

      expect(result).toEqual(mockPayments);
      expect(fromMock).toHaveBeenCalledWith(transactions);
    });
  });

  describe('getByBillId', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        billId: 'bill-1',
        amount: 10000,
        paidAt: new Date('2025-01-15'),
        notes: null,
        createdAt: new Date('2025-01-15'),
      },
      {
        id: 'tx-2',
        billId: 'bill-1',
        amount: 12000,
        paidAt: new Date('2025-02-15'),
        notes: null,
        createdAt: new Date('2025-02-15'),
      },
      {
        id: 'tx-3',
        billId: 'bill-1',
        amount: 11000,
        paidAt: new Date('2025-03-15'),
        notes: null,
        createdAt: new Date('2025-03-15'),
      },
    ];

    const setupDbMock = (returnValue: Transaction[]) => {
      const limitMock = jest.fn((limit: number) => {
        return Promise.resolve(returnValue.slice(0, limit));
      });
      const orderByMock = jest.fn().mockReturnValue({
        limit: limitMock,
        then: (onResolve: (value: Transaction[]) => unknown) => {
          return Promise.resolve(returnValue).then(onResolve);
        },
      });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return { orderByMock, whereMock, fromMock, limitMock };
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetches all transactions for a bill', async () => {
      const { fromMock } = setupDbMock(mockTransactions);

      const result = await TransactionService.getByBillId('bill-1');

      expect(result).toEqual(mockTransactions);
      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(transactions);
      expect(mockAnd).not.toHaveBeenCalled();
    });

    it('orders by paidAt ascending by default', async () => {
      const { orderByMock } = setupDbMock(mockTransactions);

      await TransactionService.getByBillId('bill-1');

      expect(orderByMock).toHaveBeenCalledWith(transactions.paidAt);
    });

    it('orders by paidAt descending when specified', async () => {
      const { orderByMock } = setupDbMock(mockTransactions);

      await TransactionService.getByBillId('bill-1', { orderBy: 'paidAt DESC' });

      expect(orderByMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
    });

    it('applies limit when specified', async () => {
      const { limitMock } = setupDbMock(mockTransactions);

      const result = await TransactionService.getByBillId('bill-1', { limit: 2 });

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockTransactions.slice(0, 2));
      expect(limitMock).toHaveBeenCalledWith(2);
    });

    it('returns empty array when no transactions found', async () => {
      setupDbMock([]);

      const result = await TransactionService.getByBillId('bill-1');

      expect(result).toEqual([]);
    });

    it('filters by billId correctly', async () => {
      setupDbMock(mockTransactions);

      await TransactionService.getByBillId('bill-1');

      expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
    });
  });

  describe('getByBillIdAndMonth', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        billId: 'bill-1',
        amount: 25000,
        paidAt: new Date('2024-03-20'),
        notes: null,
        createdAt: new Date('2024-03-20'),
      },
      {
        id: 'tx-2',
        billId: 'bill-1',
        amount: 24000,
        paidAt: new Date('2024-03-10'),
        notes: null,
        createdAt: new Date('2024-03-10'),
      },
    ];

    const setupDbMock = (returnValue: Transaction[]) => {
      const orderByMock = jest.fn().mockResolvedValue(returnValue);
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return { orderByMock, whereMock, fromMock };
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetches transactions for specific month and year', async () => {
      const { fromMock } = setupDbMock(mockTransactions);

      const result = await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

      expect(result).toEqual(mockTransactions);
      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(transactions);
    });

    it('filters by billId and month range', async () => {
      setupDbMock(mockTransactions);

      await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

      expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
      expect(mockGte).toHaveBeenCalled();
      expect(mockLte).toHaveBeenCalled();
      expect(mockAnd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'eq' }),
        expect.objectContaining({ type: 'gte' }),
        expect.objectContaining({ type: 'lte' })
      );
    });

    it('orders by paidAt descending', async () => {
      const { orderByMock } = setupDbMock(mockTransactions);

      await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

      expect(orderByMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
    });

    it('returns empty array when no transactions found for month', async () => {
      setupDbMock([]);

      const result = await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

      expect(result).toEqual([]);
    });

    it('handles January correctly (month 1)', async () => {
      setupDbMock(mockTransactions);

      await TransactionService.getByBillIdAndMonth('bill-1', 1, 2024);

      expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
    });

    it('handles December correctly (month 12)', async () => {
      setupDbMock(mockTransactions);

      await TransactionService.getByBillIdAndMonth('bill-1', 12, 2024);

      expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
    });
  });

  describe('getPaymentsByMonth', () => {
    const mockPayments: PaymentWithBill[] = [
      {
        id: 'tx-1',
        billTitle: 'Rent',
        amount: 200000,
        paidAt: new Date('2025-12-15'),
        notes: null,
        categoryIcon: 'house',
      },
      {
        id: 'tx-2',
        billTitle: 'Internet',
        amount: 8000,
        paidAt: new Date('2025-12-20'),
        notes: null,
        categoryIcon: 'wifi',
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetches payments for a specific month', async () => {
      const { fromMock } = setupDbMock(mockPayments);

      const result = await TransactionService.getPaymentsByMonth('2025-12');

      expect(result).toEqual(mockPayments);
      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(transactions);
    });

    it('calculates correct month range', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getPaymentsByMonth('2025-12');

      const monthDate = parse('2025-12', 'yyyy-MM', new Date());
      const expectedStart = startOfMonth(monthDate);
      const expectedEnd = endOfMonth(monthDate);

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
    });

    it('combines date conditions with and()', async () => {
      setupDbMock(mockPayments);

      await TransactionService.getPaymentsByMonth('2025-12');

      expect(mockAnd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'gte' }),
        expect.objectContaining({ type: 'lte' })
      );
    });

    it('orders results by paidAt descending', async () => {
      const { orderByMock } = setupDbMock(mockPayments);

      await TransactionService.getPaymentsByMonth('2025-12');

      expect(orderByMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
    });

    it('returns empty array when no payments found', async () => {
      setupDbMock([]);

      const result = await TransactionService.getPaymentsByMonth('2025-12');

      expect(result).toEqual([]);
    });

    it('filters by tag when provided', async () => {
      const tagFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([{ id: 'tag-1' }]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValueOnce({ from: tagFromMock });

      const billsToTagsFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([{ billId: 'bill-1' }]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValueOnce({ from: billsToTagsFromMock });

      setupDbMock(mockPayments);

      await TransactionService.getPaymentsByMonth('2025-12', 'utilities');

      expect(mockEq).toHaveBeenCalledWith(expect.anything(), 'utilities');
      expect(mockInArray).toHaveBeenCalled();
    });

    it('returns empty array when tag does not exist', async () => {
      const tagFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValue({ from: tagFromMock });

      const result = await TransactionService.getPaymentsByMonth('2025-12', 'nonexistent');

      expect(result).toEqual([]);
    });

    it('returns empty array when tag exists but no bills have it', async () => {
      const tagFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([{ id: 'tag-1' }]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValueOnce({ from: tagFromMock });

      const billsToTagsFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValueOnce({ from: billsToTagsFromMock });

      const result = await TransactionService.getPaymentsByMonth('2025-12', 'utilities');

      expect(result).toEqual([]);
    });
  });

  describe('getMonthlyPaymentTotals', () => {

    const setupDbMock = (returnValue: { amount: number }[]) => {
      const whereMock = jest.fn().mockResolvedValue(returnValue);
      const innerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
      const fromMock = jest.fn().mockReturnValue({ innerJoin: innerJoinMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return { whereMock, innerJoinMock, fromMock };
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetches monthly totals for specified range', async () => {
      setupDbMock([{ amount: 208000 }]);

      const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1);

      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2025-12');
      expect(result[0].monthLabel).toBe('Dec');
    });

    it('calculates correct month ranges for multiple months', async () => {
      setupDbMock([{ amount: 10000 }]);

      await TransactionService.getMonthlyPaymentTotals('2025-12', 3);

      expect(mockGte).toHaveBeenCalledTimes(3);
      expect(mockLte).toHaveBeenCalledTimes(3);
    });

    it('sums transaction amounts for each month', async () => {
      setupDbMock([
        { amount: 100000 },
        { amount: 50000 },
        { amount: 30000 },
      ]);

      const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1);

      expect(result[0].totalPaid).toBe(180000);
    });

    it('returns zero total for months with no payments', async () => {
      setupDbMock([]);

      const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1);

      expect(result[0].totalPaid).toBe(0);
    });

    it('formats month labels correctly', async () => {
      setupDbMock([{ amount: 10000 }]);

      const result = await TransactionService.getMonthlyPaymentTotals('2025-01', 12);

      expect(result[0].monthLabel).toBe('Jan');
      expect(result[1].monthLabel).toBe('Feb');
      expect(result[11].monthLabel).toBe('Dec');
    });

    it('filters by tag when provided', async () => {
      const tagFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([{ id: 'tag-1' }]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValueOnce({ from: tagFromMock });

      const billsToTagsFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([{ billId: 'bill-1' }]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValueOnce({ from: billsToTagsFromMock });

      setupDbMock([{ amount: 10000 }]);

      await TransactionService.getMonthlyPaymentTotals('2025-12', 1, 'utilities');

      expect(mockEq).toHaveBeenCalledWith(expect.anything(), 'utilities');
      expect(mockInArray).toHaveBeenCalled();
    });

    it('returns empty array when tag does not exist', async () => {
      const tagFromMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ then: (onResolve: (value: unknown[]) => unknown) => Promise.resolve([]).then(onResolve) }) });
      (db.select as jest.Mock).mockReturnValue({ from: tagFromMock });

      const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('handles multiple months correctly', async () => {
      setupDbMock([{ amount: 10000 }]);

      const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 12);

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe('2025-12');
      expect(result[11].month).toBe('2026-11');
    });
  });
});
