import { getForecastData, getForecastDataForRange } from './forecast';
import { ForecastService } from '@/lib/services/ForecastService';
import type { ForecastBill } from '@/lib/services/ForecastService';
import { getLogger } from '@/lib/logger';

jest.mock('@/lib/services/ForecastService');
jest.mock('@/lib/logger');

describe('getForecastData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockForecastBills: ForecastBill[] = [
    {
      id: 'bill-1',
      title: 'Test Bill',
      amount: 10000,
      amountDue: 10000,
      dueDate: new Date('2025-03-15'),
      endDate: null,
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      status: 'pending' as const,
      isArchived: false,
      notes: null,
      categoryId: 'category-1',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      tags: [],
      categoryIcon: 'house',
      displayAmount: 10000,
      isEstimated: false,
      amortizationAmount: null,
    },
  ];

  it('returns forecast data for valid month', async () => {
    (ForecastService.getBillsForMonth as jest.Mock).mockResolvedValue(mockForecastBills);

    const result = await getForecastData({ month: '2025-03' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockForecastBills);
    }
    expect(ForecastService.getBillsForMonth).toHaveBeenCalledWith('2025-03', undefined);
  });

  it('passes tag filter when provided', async () => {
    (ForecastService.getBillsForMonth as jest.Mock).mockResolvedValue(mockForecastBills);

    const result = await getForecastData({ month: '2025-03', tag: 'utilities' });

    expect(result.success).toBe(true);
    expect(ForecastService.getBillsForMonth).toHaveBeenCalledWith('2025-03', 'utilities');
  });

  it('returns error for invalid month format', async () => {
    const result = await getForecastData({ month: '2025-3' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast query parameters');
    }
    expect(ForecastService.getBillsForMonth).not.toHaveBeenCalled();
  });

  it('returns error for month with wrong separator', async () => {
    const result = await getForecastData({ month: '2025/03' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast query parameters');
    }
    expect(ForecastService.getBillsForMonth).not.toHaveBeenCalled();
  });

  it('returns error for incomplete month string', async () => {
    const result = await getForecastData({ month: '2025' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast query parameters');
    }
    expect(ForecastService.getBillsForMonth).not.toHaveBeenCalled();
  });

  it('returns error for empty month string', async () => {
    const result = await getForecastData({ month: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast query parameters');
    }
    expect(ForecastService.getBillsForMonth).not.toHaveBeenCalled();
  });

  it('returns error when ForecastService throws', async () => {
    const dbError = new Error('Database error');
    (ForecastService.getBillsForMonth as jest.Mock).mockRejectedValue(dbError);

    const result = await getForecastData({ month: '2025-03' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to fetch forecast data');
    }

    const logger = getLogger('Actions:Forecast');
    expect(logger.error).toHaveBeenCalledWith(dbError, 'Failed to fetch forecast data');
  });

  it('handles empty array from ForecastService', async () => {
    (ForecastService.getBillsForMonth as jest.Mock).mockResolvedValue([]);

    const result = await getForecastData({ month: '2025-03' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('validates month format strictly (YYYY-MM)', async () => {
    const validMonths = ['2025-01', '2025-12', '2024-03', '2026-06'];

    for (const month of validMonths) {
      (ForecastService.getBillsForMonth as jest.Mock).mockResolvedValue(mockForecastBills);
      const result = await getForecastData({ month });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid month formats', async () => {
    const invalidMonths = ['25-03', '2025-1', '2025-03-15', '2025/03'];

    for (const month of invalidMonths) {
      const result = await getForecastData({ month });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid forecast query parameters');
      }
    }
  });
});

describe('getForecastDataForRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMonthlyTotals = [
    {
      month: '2025-03',
      monthLabel: 'Mar',
      totalDue: 30000,
      totalToSave: 5000,
      grandTotal: 35000,
    },
    {
      month: '2025-04',
      monthLabel: 'Apr',
      totalDue: 20000,
      totalToSave: 0,
      grandTotal: 20000,
    },
  ];

  it('returns monthly totals for valid range', async () => {
    (ForecastService.getBillsForMonthRange as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    const result = await getForecastDataForRange({
      startMonth: '2025-03',
      months: 12,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockMonthlyTotals);
    }
    expect(ForecastService.getBillsForMonthRange).toHaveBeenCalledWith(
      '2025-03',
      12,
      undefined
    );
  });

  it('passes tag filter when provided', async () => {
    (ForecastService.getBillsForMonthRange as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    const result = await getForecastDataForRange({
      startMonth: '2025-03',
      months: 12,
      tag: 'utilities',
    });

    expect(result.success).toBe(true);
    expect(ForecastService.getBillsForMonthRange).toHaveBeenCalledWith(
      '2025-03',
      12,
      'utilities'
    );
  });

  it('uses default months value when not provided', async () => {
    (ForecastService.getBillsForMonthRange as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    await getForecastDataForRange({
      startMonth: '2025-03',
      months: 12,
    });

    expect(ForecastService.getBillsForMonthRange).toHaveBeenCalledWith(
      '2025-03',
      12,
      undefined
    );
  });

  it('returns error for invalid startMonth format', async () => {
    const result = await getForecastDataForRange({
      startMonth: '2025-3',
      months: 12,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast range query parameters');
    }
    expect(ForecastService.getBillsForMonthRange).not.toHaveBeenCalled();
  });

  it('returns error for months less than 1', async () => {
    const result = await getForecastDataForRange({
      startMonth: '2025-03',
      months: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast range query parameters');
    }
    expect(ForecastService.getBillsForMonthRange).not.toHaveBeenCalled();
  });

  it('returns error for months greater than 24', async () => {
    const result = await getForecastDataForRange({
      startMonth: '2025-03',
      months: 25,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid forecast range query parameters');
    }
    expect(ForecastService.getBillsForMonthRange).not.toHaveBeenCalled();
  });

  it('returns error when ForecastService throws', async () => {
    const dbError = new Error('Database error');
    (ForecastService.getBillsForMonthRange as jest.Mock).mockRejectedValue(dbError);

    const result = await getForecastDataForRange({
      startMonth: '2025-03',
      months: 12,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to fetch forecast data for range');
    }

    const logger = getLogger('Actions:Forecast');
    expect(logger.error).toHaveBeenCalledWith(
      dbError,
      'Failed to fetch forecast data for range'
    );
  });

  it('handles empty array from ForecastService', async () => {
    (ForecastService.getBillsForMonthRange as jest.Mock).mockResolvedValue([]);

    const result = await getForecastDataForRange({
      startMonth: '2025-03',
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
      (ForecastService.getBillsForMonthRange as jest.Mock).mockResolvedValue(
        mockMonthlyTotals
      );
      const result = await getForecastDataForRange({
        startMonth,
        months: 12,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts months values from 1 to 24', async () => {
    (ForecastService.getBillsForMonthRange as jest.Mock).mockResolvedValue(
      mockMonthlyTotals
    );

    const validCounts = [1, 12, 24];

    for (const months of validCounts) {
      const result = await getForecastDataForRange({
        startMonth: '2025-03',
        months,
      });
      expect(result.success).toBe(true);
      expect(ForecastService.getBillsForMonthRange).toHaveBeenCalledWith(
        '2025-03',
        months,
        undefined
      );
    }
  });
});

