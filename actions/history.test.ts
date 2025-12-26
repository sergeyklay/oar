import { getMonthlyHistoryData, getMonthlyHistoryChartData } from './history';
import { TransactionService } from '@/lib/services/TransactionService';
import { getLogger } from '@/lib/logger';
import type { PaymentWithBill, MonthlyPaymentTotal } from '@/lib/types';

jest.mock('@/lib/services/TransactionService');
jest.mock('@/lib/logger');

describe('getMonthlyHistoryData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('returns payment data for valid month', async () => {
    (TransactionService.getPaymentsByMonth as jest.Mock).mockResolvedValue(mockPayments);

    const result = await getMonthlyHistoryData({ month: '2025-12' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockPayments);
    }
    expect(TransactionService.getPaymentsByMonth).toHaveBeenCalledWith('2025-12', undefined);
  });

  it('passes tag filter when provided', async () => {
    (TransactionService.getPaymentsByMonth as jest.Mock).mockResolvedValue(mockPayments);

    const result = await getMonthlyHistoryData({ month: '2025-12', tag: 'utilities' });

    expect(result.success).toBe(true);
    expect(TransactionService.getPaymentsByMonth).toHaveBeenCalledWith('2025-12', 'utilities');
  });

  it('returns error for invalid month format', async () => {
    const result = await getMonthlyHistoryData({ month: '2025-3' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history query parameters');
    }
    expect(TransactionService.getPaymentsByMonth).not.toHaveBeenCalled();
  });

  it('returns error for month with wrong separator', async () => {
    const result = await getMonthlyHistoryData({ month: '2025/12' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history query parameters');
    }
    expect(TransactionService.getPaymentsByMonth).not.toHaveBeenCalled();
  });

  it('returns error for incomplete month string', async () => {
    const result = await getMonthlyHistoryData({ month: '2025' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history query parameters');
    }
    expect(TransactionService.getPaymentsByMonth).not.toHaveBeenCalled();
  });

  it('returns error for empty month string', async () => {
    const result = await getMonthlyHistoryData({ month: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history query parameters');
    }
    expect(TransactionService.getPaymentsByMonth).not.toHaveBeenCalled();
  });

  it('returns error when TransactionService throws', async () => {
    const dbError = new Error('Database error');
    (TransactionService.getPaymentsByMonth as jest.Mock).mockRejectedValue(dbError);

    const result = await getMonthlyHistoryData({ month: '2025-12' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to fetch history data');
    }

    const logger = getLogger('Actions:History');
    expect(logger.error).toHaveBeenCalledWith(dbError, 'Failed to fetch history data');
  });

  it('handles empty array from TransactionService', async () => {
    (TransactionService.getPaymentsByMonth as jest.Mock).mockResolvedValue([]);

    const result = await getMonthlyHistoryData({ month: '2025-12' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('validates month format strictly (YYYY-MM)', async () => {
    const validMonths = ['2025-01', '2025-12', '2024-03', '2026-06'];

    for (const month of validMonths) {
      (TransactionService.getPaymentsByMonth as jest.Mock).mockResolvedValue(mockPayments);
      const result = await getMonthlyHistoryData({ month });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid month formats', async () => {
    const invalidMonths = ['25-12', '2025-1', '2025-12-15', '2025/12'];

    for (const month of invalidMonths) {
      const result = await getMonthlyHistoryData({ month });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid history query parameters');
      }
    }
  });
});

describe('getMonthlyHistoryChartData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMonthlyTotals: MonthlyPaymentTotal[] = [
    {
      month: '2025-12',
      monthLabel: 'Dec',
      totalPaid: 208000,
    },
    {
      month: '2026-01',
      monthLabel: 'Jan',
      totalPaid: 150000,
    },
  ];

  it('returns monthly totals for valid range', async () => {
    (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 12,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockMonthlyTotals);
    }
    expect(TransactionService.getMonthlyPaymentTotals).toHaveBeenCalledWith(
      '2025-12',
      12,
      undefined
    );
  });

  it('passes tag filter when provided', async () => {
    (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 12,
      tag: 'utilities',
    });

    expect(result.success).toBe(true);
    expect(TransactionService.getMonthlyPaymentTotals).toHaveBeenCalledWith(
      '2025-12',
      12,
      'utilities'
    );
  });

  it('passes months value to TransactionService', async () => {
    (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 12,
    });

    expect(TransactionService.getMonthlyPaymentTotals).toHaveBeenCalledWith(
      '2025-12',
      12,
      undefined
    );
  });

  it('returns error for invalid startMonth format', async () => {
    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-3',
      months: 12,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history range query parameters');
    }
    expect(TransactionService.getMonthlyPaymentTotals).not.toHaveBeenCalled();
  });

  it('returns error for months less than 1', async () => {
    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history range query parameters');
    }
    expect(TransactionService.getMonthlyPaymentTotals).not.toHaveBeenCalled();
  });

  it('returns error for months greater than 24', async () => {
    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 25,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid history range query parameters');
    }
    expect(TransactionService.getMonthlyPaymentTotals).not.toHaveBeenCalled();
  });

  it('returns error when TransactionService throws', async () => {
    const dbError = new Error('Database error');
    (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockRejectedValue(dbError);

    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 12,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to fetch chart data');
    }

    const logger = getLogger('Actions:History');
    expect(logger.error).toHaveBeenCalledWith(dbError, 'Failed to fetch chart data');
  });

  it('handles empty array from TransactionService', async () => {
    (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockResolvedValue([]);

    const result = await getMonthlyHistoryChartData({
      startMonth: '2025-12',
      months: 12,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('validates startMonth format strictly (YYYY-MM)', async () => {
    const validMonths = ['2025-01', '2025-12', '2024-03', '2026-06'];

    for (const startMonth of validMonths) {
      (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockResolvedValue(
        mockMonthlyTotals
      );
      const result = await getMonthlyHistoryChartData({
        startMonth,
        months: 12,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts months values from 1 to 24', async () => {
    (TransactionService.getMonthlyPaymentTotals as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    const validCounts = [1, 12, 24];

    for (const months of validCounts) {
      const result = await getMonthlyHistoryChartData({
        startMonth: '2025-12',
        months,
      });
      expect(result.success).toBe(true);
      expect(TransactionService.getMonthlyPaymentTotals).toHaveBeenCalledWith(
        '2025-12',
        months,
        undefined
      );
    }
  });
});

