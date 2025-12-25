import { getBillDatesForMonth, getPaymentDatesForMonth } from './calendar';
import { db, bills, transactions } from '@/db';
import { startOfMonth, endOfMonth } from 'date-fns';

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  bills: {
    dueDate: 'bills.due_date',
    status: 'bills.status',
    isArchived: 'bills.is_archived',
  },
  transactions: {
    paidAt: 'transactions.paid_at',
  },
}));

const mockGte = jest.fn();
const mockLte = jest.fn();
const mockAnd = jest.fn();
const mockEq = jest.fn();

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
  eq: (...args: unknown[]) => {
    mockEq(...args);
    return { type: 'eq', args };
  },
}));

describe('getBillDatesForMonth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupDbMock = (returnValue: Array<{ dueDate: Date; status: string }>) => {
    const whereMock = jest.fn().mockResolvedValue(returnValue);
    const fromMock = jest.fn().mockReturnValue({ where: whereMock });
    (db.select as jest.Mock).mockReturnValue({ from: fromMock });

    return { whereMock, fromMock };
  };

  it('fetches bill statuses for a given month', async () => {
    const mockBills = [
      { dueDate: new Date('2025-12-15'), status: 'pending' },
      { dueDate: new Date('2025-12-20'), status: 'overdue' },
    ];
    setupDbMock(mockBills);

    const result = await getBillDatesForMonth('2025-12');

    expect(result).toEqual({
      '2025-12-15': ['pending'],
      '2025-12-20': ['overdue'],
    });
    expect(db.select).toHaveBeenCalled();
  });

  it('groups multiple bills on the same date', async () => {
    const mockBills = [
      { dueDate: new Date('2025-12-15'), status: 'pending' },
      { dueDate: new Date('2025-12-15'), status: 'paid' },
      { dueDate: new Date('2025-12-20'), status: 'overdue' },
    ];
    setupDbMock(mockBills);

    const result = await getBillDatesForMonth('2025-12');

    expect(result['2025-12-15']).toContain('pending');
    expect(result['2025-12-15']).toContain('paid');
    expect(result['2025-12-20']).toEqual(['overdue']);
  });

  it('filters to non-archived bills only', async () => {
    setupDbMock([]);

    await getBillDatesForMonth('2025-12');

    expect(mockEq).toHaveBeenCalledWith(bills.isArchived, false);
  });

  it('calculates correct month date range', async () => {
    setupDbMock([]);

    await getBillDatesForMonth('2025-12');

    const monthDate = new Date(2025, 11, 1);
    const expectedStart = startOfMonth(monthDate);
    const expectedEnd = endOfMonth(monthDate);

    expect(mockGte).toHaveBeenCalledWith(bills.dueDate, expectedStart);
    expect(mockLte).toHaveBeenCalledWith(bills.dueDate, expectedEnd);
  });

  it('returns empty map when no bills found', async () => {
    setupDbMock([]);

    const result = await getBillDatesForMonth('2025-12');

    expect(result).toEqual({});
  });
});

describe('getPaymentDatesForMonth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupDbMock = (returnValue: Array<{ paidAt: Date }>) => {
    const whereMock = jest.fn().mockResolvedValue(returnValue);
    const fromMock = jest.fn().mockReturnValue({ where: whereMock });
    (db.select as jest.Mock).mockReturnValue({ from: fromMock });

    return { whereMock, fromMock };
  };

  it('fetches payment dates for a given month', async () => {
    const mockTransactions = [
      { paidAt: new Date('2025-12-15T10:30:00.000Z') },
      { paidAt: new Date('2025-12-20T14:45:00.000Z') },
    ];
    setupDbMock(mockTransactions);

    const result = await getPaymentDatesForMonth('2025-12');

    expect(result).toEqual({
      '2025-12-15': true,
      '2025-12-20': true,
    });
    expect(db.select).toHaveBeenCalled();
  });

  it('marks dates with payments as true', async () => {
    const mockTransactions = [
      { paidAt: new Date('2025-12-15T10:30:00.000Z') },
      { paidAt: new Date('2025-12-15T14:45:00.000Z') },
      { paidAt: new Date('2025-12-20T09:00:00.000Z') },
    ];
    setupDbMock(mockTransactions);

    const result = await getPaymentDatesForMonth('2025-12');

    expect(result['2025-12-15']).toBe(true);
    expect(result['2025-12-20']).toBe(true);
  });

  it('calculates correct month date range', async () => {
    setupDbMock([]);

    await getPaymentDatesForMonth('2025-12');

    const monthDate = new Date(2025, 11, 1);
    const expectedStart = startOfMonth(monthDate);
    const expectedEnd = endOfMonth(monthDate);

    expect(mockGte).toHaveBeenCalledWith(transactions.paidAt, expectedStart);
    expect(mockLte).toHaveBeenCalledWith(transactions.paidAt, expectedEnd);
  });

  it('returns empty map when no payments found', async () => {
    setupDbMock([]);

    const result = await getPaymentDatesForMonth('2025-12');

    expect(result).toEqual({});
  });
});

