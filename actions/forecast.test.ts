import { getForecastData } from './forecast';
import { ForecastService } from '@/lib/services/ForecastService';
import type { ForecastBill } from '@/lib/services/ForecastService';

jest.mock('@/lib/services/ForecastService');

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
    (ForecastService.getBillsForMonth as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await getForecastData({ month: '2025-03' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to fetch forecast data');
    }
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

