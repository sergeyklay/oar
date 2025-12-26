import { render, screen } from '@testing-library/react';
import { MonthlyHistoryGraph } from './MonthlyHistoryGraph';
import { getMonthlyHistoryChartData } from '@/actions/history';
import type { MonthlyPaymentTotal } from '@/lib/types';

jest.mock('@/actions/history');
jest.mock('./MonthlyHistoryChart', () => ({
  MonthlyHistoryChart: ({
    data,
  }: {
    data: Array<{
      month: string;
      monthLabel: string;
      currentYear: number;
      lastYear: number;
    }>;
  }) => (
    <div data-testid="monthly-history-chart" data-chart-data={JSON.stringify(data)}>
      Chart
    </div>
  ),
}));

const mockGetMonthlyHistoryChartData = getMonthlyHistoryChartData as jest.MockedFunction<
  typeof getMonthlyHistoryChartData
>;

describe('MonthlyHistoryGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('always shows 12 months ending at selected month', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 100000 },
      { month: '2025-02', monthLabel: 'Feb', totalPaid: 150000 },
      { month: '2025-12', monthLabel: 'Dec', totalPaid: 200000 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 90000 },
      { month: '2024-12', monthLabel: 'Dec', totalPaid: 180000 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    const component = await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    const chart = screen.getByTestId('monthly-history-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

    expect(chartData).toHaveLength(12);
    expect(chartData[0].month).toBe('2025-01');
    expect(chartData[0].monthLabel).toBe('Jan');
    expect(chartData[11].month).toBe('2025-12');
    expect(chartData[11].monthLabel).toBe('Dec');
  });

  it('filters out months with zero payments from maps but includes them in chart with zero values', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 100000 },
      { month: '2025-02', monthLabel: 'Feb', totalPaid: 0 },
      { month: '2025-03', monthLabel: 'Mar', totalPaid: 150000 },
      { month: '2025-12', monthLabel: 'Dec', totalPaid: 200000 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 90000 },
      { month: '2024-02', monthLabel: 'Feb', totalPaid: 0 },
      { month: '2024-03', monthLabel: 'Mar', totalPaid: 0 },
      { month: '2024-12', monthLabel: 'Dec', totalPaid: 180000 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    const component = await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    const chart = screen.getByTestId('monthly-history-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

    const febData = chartData.find((item: { month: string }) => item.month === '2025-02');
    expect(febData).toBeDefined();
    expect(febData.currentYear).toBe(0);
    expect(febData.lastYear).toBe(0);

    const marData = chartData.find((item: { month: string }) => item.month === '2025-03');
    expect(marData).toBeDefined();
    expect(marData.currentYear).toBe(150000);
    expect(marData.lastYear).toBe(0);
  });

  it('sets currentYear to 0 when month has no payments', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 100000 },
      { month: '2025-12', monthLabel: 'Dec', totalPaid: 0 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 90000 },
      { month: '2024-12', monthLabel: 'Dec', totalPaid: 180000 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    const component = await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    const chart = screen.getByTestId('monthly-history-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

    const decData = chartData.find((item: { month: string }) => item.month === '2025-12');
    expect(decData).toBeDefined();
    expect(decData.currentYear).toBe(0);
    expect(decData.lastYear).toBe(180000);
  });

  it('sets lastYear to 0 when previous year month has no payments', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 100000 },
      { month: '2025-12', monthLabel: 'Dec', totalPaid: 200000 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 0 },
      { month: '2024-12', monthLabel: 'Dec', totalPaid: 0 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    const component = await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    const chart = screen.getByTestId('monthly-history-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

    const janData = chartData.find((item: { month: string }) => item.month === '2025-01');
    expect(janData).toBeDefined();
    expect(janData.currentYear).toBe(100000);
    expect(janData.lastYear).toBe(0);

    const decData = chartData.find((item: { month: string }) => item.month === '2025-12');
    expect(decData).toBeDefined();
    expect(decData.currentYear).toBe(200000);
    expect(decData.lastYear).toBe(0);
  });

  it('includes all 12 months even when both years have zero payments', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 0 },
      { month: '2025-12', monthLabel: 'Dec', totalPaid: 0 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 0 },
      { month: '2024-12', monthLabel: 'Dec', totalPaid: 0 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    const component = await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    const chart = screen.getByTestId('monthly-history-chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

    expect(chartData).toHaveLength(12);

    chartData.forEach((item: { currentYear: number; lastYear: number }) => {
      expect(item.currentYear).toBe(0);
      expect(item.lastYear).toBe(0);
    });
  });

  it('calculates correct start month for retrospective view', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 100000 },
      { month: '2025-12', monthLabel: 'Dec', totalPaid: 200000 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 90000 },
      { month: '2024-12', monthLabel: 'Dec', totalPaid: 180000 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    expect(mockGetMonthlyHistoryChartData).toHaveBeenCalledWith({
      startMonth: '2025-01',
      months: 12,
      tag: undefined,
    });

    expect(mockGetMonthlyHistoryChartData).toHaveBeenCalledWith({
      startMonth: '2024-01',
      months: 12,
      tag: undefined,
    });
  });

  it('passes tag filter to getMonthlyHistoryChartData', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 100000 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 90000 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    await MonthlyHistoryGraph({
      month: '2025-12',
      tag: 'utilities',
      currency: 'USD',
      locale: 'en-US',
    });

    expect(mockGetMonthlyHistoryChartData).toHaveBeenCalledWith({
      startMonth: '2025-01',
      months: 12,
      tag: 'utilities',
    });

    expect(mockGetMonthlyHistoryChartData).toHaveBeenCalledWith({
      startMonth: '2024-01',
      months: 12,
      tag: 'utilities',
    });
  });

  it('handles year boundary crossing correctly', async () => {
    const currentYearData: MonthlyPaymentTotal[] = [
      { month: '2024-02', monthLabel: 'Feb', totalPaid: 100000 },
      { month: '2025-01', monthLabel: 'Jan', totalPaid: 200000 },
    ];

    const lastYearData: MonthlyPaymentTotal[] = [
      { month: '2023-02', monthLabel: 'Feb', totalPaid: 90000 },
      { month: '2024-01', monthLabel: 'Jan', totalPaid: 180000 },
    ];

    mockGetMonthlyHistoryChartData
      .mockResolvedValueOnce({
        success: true,
        data: currentYearData,
      })
      .mockResolvedValueOnce({
        success: true,
        data: lastYearData,
      });

    await MonthlyHistoryGraph({
      month: '2025-01',
      currency: 'USD',
      locale: 'en-US',
    });

    expect(mockGetMonthlyHistoryChartData).toHaveBeenCalledWith({
      startMonth: '2024-02',
      months: 12,
      tag: undefined,
    });

    expect(mockGetMonthlyHistoryChartData).toHaveBeenCalledWith({
      startMonth: '2023-02',
      months: 12,
      tag: undefined,
    });
  });

  it('displays error message when getMonthlyHistoryChartData fails', async () => {
    mockGetMonthlyHistoryChartData.mockResolvedValueOnce({
      success: false,
      error: 'Failed to fetch chart data',
    });

    const component = await MonthlyHistoryGraph({
      month: '2025-12',
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByText('Failed to fetch chart data')).toBeInTheDocument();
  });
});

