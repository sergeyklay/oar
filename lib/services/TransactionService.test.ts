import { TransactionService } from './TransactionService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db, transactions, bills, billCategories, tags, billsToTags } from '@/db';
import type { PaymentWithBill, Transaction } from '@/lib/types';
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

type QueryBuilder = {
  from: jest.Mock;
  innerJoin: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
};

const createPaymentQueryBuilder = (returnValue: PaymentWithBill[]): QueryBuilder => {
  const orderByMock = jest.fn().mockResolvedValue(returnValue);
  const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
  const secondInnerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
  const firstInnerJoinMock = jest.fn().mockReturnValue({ innerJoin: secondInnerJoinMock });
  const fromMock = jest.fn().mockReturnValue({ innerJoin: firstInnerJoinMock });

  (db.select as jest.Mock).mockReturnValue({ from: fromMock });

  return {
    from: fromMock,
    innerJoin: firstInnerJoinMock,
    where: whereMock,
    orderBy: orderByMock,
    limit: jest.fn(),
  };
};

const createTransactionQueryBuilder = (returnValue: Transaction[]): QueryBuilder => {
  const limitMock = jest.fn((limit: number) => Promise.resolve(returnValue.slice(0, limit)));
  const orderByMock = jest.fn().mockReturnValue({
    limit: limitMock,
    then: (onResolve: (value: Transaction[]) => unknown) => Promise.resolve(returnValue).then(onResolve),
  });
  const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
  const fromMock = jest.fn().mockReturnValue({ where: whereMock });

  (db.select as jest.Mock).mockReturnValue({ from: fromMock });

  return {
    from: fromMock,
    innerJoin: jest.fn(),
    where: whereMock,
    orderBy: orderByMock,
    limit: limitMock,
  };
};

const createTagQueryBuilder = (returnValue: { id: string }[]) => {
  const whereMock = jest.fn().mockReturnValue({
    then: (onResolve: (value: { id: string }[]) => unknown) => Promise.resolve(returnValue).then(onResolve),
  });
  const fromMock = jest.fn().mockReturnValue({ where: whereMock });

  return { from: fromMock, where: whereMock };
};

const createBillsToTagsQueryBuilder = (returnValue: { billId: string }[]) => {
  const whereMock = jest.fn().mockReturnValue({
    then: (onResolve: (value: { billId: string }[]) => unknown) => Promise.resolve(returnValue).then(onResolve),
  });
  const fromMock = jest.fn().mockReturnValue({ where: whereMock });

  return { from: fromMock, where: whereMock };
};

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentPayments', () => {
    const FIXED_DATE = new Date('2025-12-19T14:30:00.000Z');

    beforeEach(() => {
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
        paidAt: new Date('2025-12-18T10:00:00.000Z'),
        notes: 'Monthly rent',
        categoryIcon: 'house',
      },
    ];

    describe('when fetching without tag filter', () => {
      it('returns payments within the specified date range', async () => {
        const builder = createPaymentQueryBuilder(mockPayments);

        const result = await TransactionService.getRecentPayments(7);

        expect(result).toEqual(mockPayments);
        expect(builder.from).toHaveBeenCalledWith(transactions);
        expect(builder.innerJoin).toHaveBeenCalledWith(bills, expect.anything());
      });

      it('returns empty array when no payments found', async () => {
        createPaymentQueryBuilder([]);

        const result = await TransactionService.getRecentPayments(7);

        expect(result).toEqual([]);
      });
    });

    describe('when calculating date ranges', () => {
      it('uses today only when days is 0', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getRecentPayments(0);

        expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, startOfDay(FIXED_DATE));
        expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfDay(FIXED_DATE));
      });

      it('includes yesterday when days is 1', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getRecentPayments(1);

        expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, startOfDay(subDays(FIXED_DATE, 1)));
        expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfDay(FIXED_DATE));
      });

      it('includes last 7 days when days is 7', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getRecentPayments(7);

        expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, startOfDay(subDays(FIXED_DATE, 7)));
        expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfDay(FIXED_DATE));
      });

      it('includes last 30 days when days is 30', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getRecentPayments(30);

        expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, startOfDay(subDays(FIXED_DATE, 30)));
        expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfDay(FIXED_DATE));
      });

      it('combines date conditions with and()', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getRecentPayments(7);

        expect(mockAnd).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'gte' }),
          expect.objectContaining({ type: 'lte' })
        );
      });
    });

    describe('when filtering by tag', () => {
      it('returns payments for bills with the specified tag', async () => {
        const tagBuilder = createTagQueryBuilder([{ id: 'tag-1' }]);
        const billsToTagsBuilder = createBillsToTagsQueryBuilder([{ billId: 'bill-1' }]);
        (db.select as jest.Mock)
          .mockReturnValueOnce({ from: tagBuilder.from })
          .mockReturnValueOnce({ from: billsToTagsBuilder.from });
        const paymentBuilder = createPaymentQueryBuilder(mockPayments);

        const result = await TransactionService.getRecentPayments(7, 'utilities');

        expect(result).toEqual(mockPayments);
        expect(mockEq).toHaveBeenCalledWith(tags.slug, 'utilities');
        expect(mockInArray).toHaveBeenCalledWith(transactions.billId, ['bill-1']);
        expect(paymentBuilder.from).toHaveBeenCalledWith(transactions);
      });

      it('returns empty array when tag does not exist', async () => {
        const tagBuilder = createTagQueryBuilder([]);
        (db.select as jest.Mock).mockReturnValue({ from: tagBuilder.from });

        const result = await TransactionService.getRecentPayments(7, 'nonexistent');

        expect(result).toEqual([]);
        expect(db.select).toHaveBeenCalledTimes(1);
      });

      it('returns empty array when tag exists but no bills have it', async () => {
        const tagBuilder = createTagQueryBuilder([{ id: 'tag-1' }]);
        const billsToTagsBuilder = createBillsToTagsQueryBuilder([]);
        (db.select as jest.Mock)
          .mockReturnValueOnce({ from: tagBuilder.from })
          .mockReturnValueOnce({ from: billsToTagsBuilder.from });

        const result = await TransactionService.getRecentPayments(7, 'utilities');

        expect(result).toEqual([]);
        expect(db.select).toHaveBeenCalledTimes(2);
      });
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

    describe('when date is valid', () => {
      it('returns payments for the specified date', async () => {
        const builder = createPaymentQueryBuilder(mockPayments);

        const result = await TransactionService.getPaymentsByDate('2025-12-15');

        expect(result).toEqual(mockPayments);
        expect(builder.from).toHaveBeenCalledWith(transactions);
        expect(builder.innerJoin).toHaveBeenCalledWith(bills, expect.anything());
      });

      it('calculates date range from start to end of day', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByDate('2025-12-15');

        const dateObj = parse('2025-12-15', 'yyyy-MM-dd', new Date());
        expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, startOfDay(dateObj));
        expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfDay(dateObj));
      });

      it('orders results by paidAt descending', async () => {
        const builder = createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByDate('2025-12-15');

        expect(builder.orderBy).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
      });

      it('combines date conditions with and()', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByDate('2025-12-15');

        expect(mockAnd).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'gte' }),
          expect.objectContaining({ type: 'lte' })
        );
      });

      it('returns empty array when no payments found', async () => {
        createPaymentQueryBuilder([]);

        const result = await TransactionService.getPaymentsByDate('2025-12-15');

        expect(result).toEqual([]);
      });
    });

    describe('when filtering by tag', () => {
      it('returns payments for bills with the specified tag', async () => {
        const tagBuilder = createTagQueryBuilder([{ id: 'tag-1' }]);
        const billsToTagsBuilder = createBillsToTagsQueryBuilder([{ billId: 'bill-1' }]);
        (db.select as jest.Mock)
          .mockReturnValueOnce({ from: tagBuilder.from })
          .mockReturnValueOnce({ from: billsToTagsBuilder.from });
        createPaymentQueryBuilder(mockPayments);

        const result = await TransactionService.getPaymentsByDate('2025-12-15', 'utilities');

        expect(result).toEqual(mockPayments);
        expect(mockEq).toHaveBeenCalledWith(tags.slug, 'utilities');
        expect(mockInArray).toHaveBeenCalledWith(transactions.billId, ['bill-1']);
      });

      it('returns empty array when tag does not exist', async () => {
        const tagBuilder = createTagQueryBuilder([]);
        (db.select as jest.Mock).mockReturnValue({ from: tagBuilder.from });

        const result = await TransactionService.getPaymentsByDate('2025-12-15', 'nonexistent');

        expect(result).toEqual([]);
      });
    });

    describe('when date is invalid', () => {
      it('throws error for non-date string', async () => {
        await expect(TransactionService.getPaymentsByDate('not-a-date')).rejects.toThrow(
          'Invalid date format: "not-a-date". Expected YYYY-MM-DD format.'
        );
      });

      it('throws error for invalid month', async () => {
        await expect(TransactionService.getPaymentsByDate('2025-13-01')).rejects.toThrow(
          'Invalid date format: "2025-13-01". Expected YYYY-MM-DD format.'
        );
      });

      it('throws error for invalid day', async () => {
        await expect(TransactionService.getPaymentsByDate('2025-12-32')).rejects.toThrow(
          'Invalid date format: "2025-12-32". Expected YYYY-MM-DD format.'
        );
      });

      it('throws error for invalid day in February', async () => {
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

    describe('when fetching without options', () => {
      it('returns all transactions for the bill', async () => {
        const builder = createTransactionQueryBuilder(mockTransactions);

        const result = await TransactionService.getByBillId('bill-1');

        expect(result).toEqual(mockTransactions);
        expect(builder.from).toHaveBeenCalledWith(transactions);
        expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
      });

      it('orders by paidAt ascending by default', async () => {
        const builder = createTransactionQueryBuilder(mockTransactions);

        await TransactionService.getByBillId('bill-1');

        expect(builder.orderBy).toHaveBeenCalledWith(transactions.paidAt);
      });

      it('returns empty array when no transactions found', async () => {
        createTransactionQueryBuilder([]);

        const result = await TransactionService.getByBillId('bill-1');

        expect(result).toEqual([]);
      });
    });

    describe('when specifying orderBy', () => {
      it('orders by paidAt descending when specified', async () => {
        const builder = createTransactionQueryBuilder(mockTransactions);

        await TransactionService.getByBillId('bill-1', { orderBy: 'paidAt DESC' });

        expect(builder.orderBy).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
      });
    });

    describe('when specifying limit', () => {
      it('returns only the specified number of transactions', async () => {
        const builder = createTransactionQueryBuilder(mockTransactions);

        const result = await TransactionService.getByBillId('bill-1', { limit: 2 });

        expect(result).toHaveLength(2);
        expect(result).toEqual(mockTransactions.slice(0, 2));
        expect(builder.limit).toHaveBeenCalledWith(2);
      });

      it('applies limit with descending order', async () => {
        const builder = createTransactionQueryBuilder(mockTransactions);

        await TransactionService.getByBillId('bill-1', { orderBy: 'paidAt DESC', limit: 1 });

        expect(builder.orderBy).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
        expect(builder.limit).toHaveBeenCalledWith(1);
      });
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

    const createMonthQueryBuilder = (returnValue: Transaction[]): QueryBuilder => {
      const orderByMock = jest.fn().mockResolvedValue(returnValue);
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return {
        from: fromMock,
        innerJoin: jest.fn(),
        where: whereMock,
        orderBy: orderByMock,
        limit: jest.fn(),
      };
    };

    describe('when fetching transactions', () => {
      it('returns transactions for the specified month and year', async () => {
        const builder = createMonthQueryBuilder(mockTransactions);

        const result = await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

        expect(result).toEqual(mockTransactions);
        expect(builder.from).toHaveBeenCalledWith(transactions);
      });

      it('filters by billId and month range', async () => {
        createMonthQueryBuilder(mockTransactions);

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
        const builder = createMonthQueryBuilder(mockTransactions);

        await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

        expect(builder.orderBy).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
      });

      it('returns empty array when no transactions found', async () => {
        createMonthQueryBuilder([]);

        const result = await TransactionService.getByBillIdAndMonth('bill-1', 3, 2024);

        expect(result).toEqual([]);
      });
    });

    describe('when handling edge cases', () => {
      it('handles January correctly (month 1)', async () => {
        createMonthQueryBuilder(mockTransactions);

        await TransactionService.getByBillIdAndMonth('bill-1', 1, 2024);

        expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
      });

      it('handles December correctly (month 12)', async () => {
        createMonthQueryBuilder(mockTransactions);

        await TransactionService.getByBillIdAndMonth('bill-1', 12, 2024);

        expect(mockEq).toHaveBeenCalledWith(transactions.billId, 'bill-1');
      });
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

    describe('when fetching without tag filter', () => {
      it('returns payments for the specified month', async () => {
        const builder = createPaymentQueryBuilder(mockPayments);

        const result = await TransactionService.getPaymentsByMonth('2025-12');

        expect(result).toEqual(mockPayments);
        expect(builder.from).toHaveBeenCalledWith(transactions);
      });

      it('calculates month range from start to end of month', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByMonth('2025-12');

        const monthDate = parse('2025-12', 'yyyy-MM', new Date());
        expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, startOfMonth(monthDate));
        expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfMonth(monthDate));
      });

      it('orders results by paidAt descending', async () => {
        const builder = createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByMonth('2025-12');

        expect(builder.orderBy).toHaveBeenCalledWith(expect.objectContaining({ type: 'desc' }));
      });

      it('combines date conditions with and()', async () => {
        createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByMonth('2025-12');

        expect(mockAnd).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'gte' }),
          expect.objectContaining({ type: 'lte' })
        );
      });

      it('returns empty array when no payments found', async () => {
        createPaymentQueryBuilder([]);

        const result = await TransactionService.getPaymentsByMonth('2025-12');

        expect(result).toEqual([]);
      });
    });

    describe('when filtering by tag', () => {
      it('returns payments for bills with the specified tag', async () => {
        const tagBuilder = createTagQueryBuilder([{ id: 'tag-1' }]);
        const billsToTagsBuilder = createBillsToTagsQueryBuilder([{ billId: 'bill-1' }]);
        (db.select as jest.Mock)
          .mockReturnValueOnce({ from: tagBuilder.from })
          .mockReturnValueOnce({ from: billsToTagsBuilder.from });
        const paymentBuilder = createPaymentQueryBuilder(mockPayments);

        await TransactionService.getPaymentsByMonth('2025-12', 'utilities');

        expect(mockEq).toHaveBeenCalledWith(tags.slug, 'utilities');
        expect(mockInArray).toHaveBeenCalledWith(transactions.billId, ['bill-1']);
        expect(paymentBuilder.from).toHaveBeenCalledWith(transactions);
      });

      it('returns empty array when tag does not exist', async () => {
        const tagBuilder = createTagQueryBuilder([]);
        (db.select as jest.Mock).mockReturnValue({ from: tagBuilder.from });

        const result = await TransactionService.getPaymentsByMonth('2025-12', 'nonexistent');

        expect(result).toEqual([]);
      });

      it('returns empty array when tag exists but no bills have it', async () => {
        const tagBuilder = createTagQueryBuilder([{ id: 'tag-1' }]);
        const billsToTagsBuilder = createBillsToTagsQueryBuilder([]);
        (db.select as jest.Mock)
          .mockReturnValueOnce({ from: tagBuilder.from })
          .mockReturnValueOnce({ from: billsToTagsBuilder.from });

        const result = await TransactionService.getPaymentsByMonth('2025-12', 'utilities');

        expect(result).toEqual([]);
      });
    });
  });

  describe('getMonthlyPaymentTotals', () => {
    const createTotalsQueryBuilder = (returnValue: { amount: number }[]) => {
      const whereMock = jest.fn().mockResolvedValue(returnValue);
      const innerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
      const fromMock = jest.fn().mockReturnValue({ innerJoin: innerJoinMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return { whereMock, innerJoinMock, fromMock };
    };

    describe('when fetching without tag filter', () => {
      it('returns monthly totals for specified range', async () => {
        createTotalsQueryBuilder([{ amount: 208000 }]);

        const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          month: '2025-12',
          monthLabel: 'Dec',
          totalPaid: 208000,
        });
      });

      it('calculates correct month ranges for multiple months', async () => {
        createTotalsQueryBuilder([{ amount: 10000 }]);

        await TransactionService.getMonthlyPaymentTotals('2025-12', 3);

        expect(mockGte).toHaveBeenCalledTimes(3);
        expect(mockLte).toHaveBeenCalledTimes(3);
      });

      it('sums transaction amounts for each month', async () => {
        createTotalsQueryBuilder([
          { amount: 100000 },
          { amount: 50000 },
          { amount: 30000 },
        ]);

        const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1);

        expect(result[0].totalPaid).toBe(180000);
      });

      it('returns zero total for months with no payments', async () => {
        createTotalsQueryBuilder([]);

        const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1);

        expect(result[0].totalPaid).toBe(0);
      });

      it('formats month labels correctly for full year', async () => {
        createTotalsQueryBuilder([{ amount: 10000 }]);

        const result = await TransactionService.getMonthlyPaymentTotals('2025-01', 12);

        expect(result[0].monthLabel).toBe('Jan');
        expect(result[1].monthLabel).toBe('Feb');
        expect(result[11].monthLabel).toBe('Dec');
      });

      it('handles multiple months correctly', async () => {
        createTotalsQueryBuilder([{ amount: 10000 }]);

        const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 12);

        expect(result).toHaveLength(12);
        expect(result[0].month).toBe('2025-12');
        expect(result[11].month).toBe('2026-11');
      });
    });

    describe('when filtering by tag', () => {
      it('returns totals for bills with the specified tag', async () => {
        const tagBuilder = createTagQueryBuilder([{ id: 'tag-1' }]);
        const billsToTagsBuilder = createBillsToTagsQueryBuilder([{ billId: 'bill-1' }]);
        (db.select as jest.Mock)
          .mockReturnValueOnce({ from: tagBuilder.from })
          .mockReturnValueOnce({ from: billsToTagsBuilder.from });
        createTotalsQueryBuilder([{ amount: 10000 }]);

        await TransactionService.getMonthlyPaymentTotals('2025-12', 1, 'utilities');

        expect(mockEq).toHaveBeenCalledWith(tags.slug, 'utilities');
        expect(mockInArray).toHaveBeenCalledWith(transactions.billId, ['bill-1']);
      });

      it('returns empty array when tag does not exist', async () => {
        const tagBuilder = createTagQueryBuilder([]);
        (db.select as jest.Mock).mockReturnValue({ from: tagBuilder.from });

        const result = await TransactionService.getMonthlyPaymentTotals('2025-12', 1, 'nonexistent');

        expect(result).toEqual([]);
      });
    });
  });

  describe('getPaymentsByYearAggregatedByBill', () => {
    type YearAggregationResult = {
      billId: string;
      billTitle: string;
      categoryIcon: string;
      amount: number;
    };

    const createYearQueryBuilder = (returnValue: YearAggregationResult[]) => {
      const orderByMock = jest.fn().mockResolvedValue(returnValue);
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const secondInnerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
      const firstInnerJoinMock = jest.fn().mockReturnValue({ innerJoin: secondInnerJoinMock });
      const fromMock = jest.fn().mockReturnValue({ innerJoin: firstInnerJoinMock });

      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return {
        from: fromMock,
        innerJoin: firstInnerJoinMock,
        where: whereMock,
        orderBy: orderByMock,
      };
    };

    it('returns empty array for invalid year string', async () => {
      const result = await TransactionService.getPaymentsByYearAggregatedByBill('invalid');

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('returns empty array for non-numeric year', async () => {
      const result = await TransactionService.getPaymentsByYearAggregatedByBill('abcd');

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('queries transactions within year range', async () => {
      createYearQueryBuilder([]);

      await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      const yearStart = parse('2025-01-01', 'yyyy-MM-dd', new Date());
      const yearEnd = parse('2025-12-31', 'yyyy-MM-dd', new Date());

      expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, yearStart);
      expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, endOfDay(yearEnd));
      expect(mockAnd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'gte' }),
        expect.objectContaining({ type: 'lte' })
      );
    });

    it('aggregates payments by bill with correct calculations', async () => {
      const mockResults: YearAggregationResult[] = [
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-2', billTitle: 'Internet', categoryIcon: 'wifi', amount: 5000 },
      ];

      createYearQueryBuilder(mockResults);

      const result = await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        billId: 'bill-1',
        billTitle: 'Rent',
        categoryIcon: 'house',
        paymentCount: 2,
        totalAmount: 200000,
        averageAmount: 100000,
      });
      expect(result[1]).toMatchObject({
        billId: 'bill-2',
        billTitle: 'Internet',
        categoryIcon: 'wifi',
        paymentCount: 1,
        totalAmount: 5000,
        averageAmount: 5000,
      });
    });

    it('sorts results by totalAmount descending', async () => {
      const mockResults: YearAggregationResult[] = [
        { billId: 'bill-2', billTitle: 'Internet', categoryIcon: 'wifi', amount: 5000 },
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
      ];

      createYearQueryBuilder(mockResults);

      const result = await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(result[0].totalAmount).toBeGreaterThan(result[1].totalAmount);
      expect(result[0].billId).toBe('bill-1');
      expect(result[1].billId).toBe('bill-2');
    });

    it('calculates average correctly with rounding', async () => {
      const mockResults: YearAggregationResult[] = [
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100001 },
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100002 },
      ];

      createYearQueryBuilder(mockResults);

      const result = await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(result[0].totalAmount).toBe(300003);
      expect(result[0].paymentCount).toBe(3);
      expect(result[0].averageAmount).toBe(100001);
    });

    it('handles single payment per bill', async () => {
      const mockResults: YearAggregationResult[] = [
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-2', billTitle: 'Internet', categoryIcon: 'wifi', amount: 5000 },
      ];

      createYearQueryBuilder(mockResults);

      const result = await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(result).toHaveLength(2);
      expect(result[0].paymentCount).toBe(1);
      expect(result[0].averageAmount).toBe(result[0].totalAmount);
      expect(result[1].paymentCount).toBe(1);
      expect(result[1].averageAmount).toBe(result[1].totalAmount);
    });

    it('returns empty array when no payments found', async () => {
      createYearQueryBuilder([]);

      const result = await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(result).toEqual([]);
    });

    it('handles multiple payments for multiple bills', async () => {
      const mockResults: YearAggregationResult[] = [
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-1', billTitle: 'Rent', categoryIcon: 'house', amount: 100000 },
        { billId: 'bill-2', billTitle: 'Internet', categoryIcon: 'wifi', amount: 5000 },
        { billId: 'bill-2', billTitle: 'Internet', categoryIcon: 'wifi', amount: 6000 },
        { billId: 'bill-2', billTitle: 'Internet', categoryIcon: 'wifi', amount: 5000 },
        { billId: 'bill-3', billTitle: 'Electric', categoryIcon: 'zap', amount: 15000 },
      ];

      createYearQueryBuilder(mockResults);

      const result = await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(result).toHaveLength(3);
      expect(result[0].billId).toBe('bill-1');
      expect(result[0].totalAmount).toBe(200000);
      expect(result[1].billId).toBe('bill-2');
      expect(result[1].totalAmount).toBe(16000);
      expect(result[2].billId).toBe('bill-3');
      expect(result[2].totalAmount).toBe(15000);
    });

    it('orders query results by billId', async () => {
      const builder = createYearQueryBuilder([]);

      await TransactionService.getPaymentsByYearAggregatedByBill('2025');

      expect(builder.orderBy).toHaveBeenCalledWith(transactions.billId);
    });
  });
});
