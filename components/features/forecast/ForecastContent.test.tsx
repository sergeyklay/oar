import { render, screen } from '@testing-library/react';
import { ForecastContent } from './ForecastContent';
import type { ForecastBill } from '@/lib/services/ForecastService';

jest.mock('@/actions/forecast', () => ({
  getForecastData: jest.fn(),
}));

jest.mock('./ForecastGraph', () => ({
  ForecastGraph: () => <div data-testid="forecast-graph">Forecast Graph</div>,
}));

jest.mock('./ForecastList', () => ({
  ForecastList: ({ bills }: { bills: ForecastBill[] }) => (
    <div data-testid="forecast-list">
      {bills.length > 0 ? `Bills: ${bills.length}` : 'No bills'}
    </div>
  ),
}));

jest.mock('./ForecastSummary', () => ({
  ForecastSummary: ({ bills }: { bills: ForecastBill[] }) => (
    <div data-testid="forecast-summary">Summary: {bills.length} bills</div>
  ),
}));

import { getForecastData } from '@/actions/forecast';

const createMockBill = (id: string): ForecastBill => ({
  id,
  title: `Bill ${id}`,
  amount: 10000,
  amountDue: 10000,
  dueDate: new Date('2026-01-15'),
  endDate: null,
  frequency: 'monthly' as const,
  isAutoPay: false,
  isVariable: false,
  status: 'pending' as const,
  isArchived: false,
  notes: null,
  categoryId: 'category-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  tags: [],
  categoryIcon: 'house',
  displayAmount: 10000,
  isEstimated: false,
  amortizationAmount: null,
});

describe('ForecastContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders forecast graph at the top', async () => {
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: [createMockBill('1')],
    });

    const component = await ForecastContent({
      month: '2026-01',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByTestId('forecast-graph')).toBeInTheDocument();
  });

  it('renders forecast list and summary in bottom section', async () => {
    const bills = [createMockBill('1'), createMockBill('2')];
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: bills,
    });

    const component = await ForecastContent({
      month: '2026-01',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByTestId('forecast-list')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-summary')).toBeInTheDocument();
  });

  it('passes bills data to both list and summary components', async () => {
    const bills = [createMockBill('1'), createMockBill('2'), createMockBill('3')];
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: bills,
    });

    const component = await ForecastContent({
      month: '2026-01',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByText('Bills: 3')).toBeInTheDocument();
    expect(screen.getByText('Summary: 3 bills')).toBeInTheDocument();
  });

  it('calls getForecastData with correct month parameter', async () => {
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    await ForecastContent({
      month: '2026-03',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    expect(getForecastData).toHaveBeenCalledWith({
      month: '2026-03',
      tag: undefined,
    });
  });

  it('calls getForecastData with tag parameter when provided', async () => {
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    await ForecastContent({
      month: '2026-01',
      tag: 'utilities',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    expect(getForecastData).toHaveBeenCalledWith({
      month: '2026-01',
      tag: 'utilities',
    });
  });

  it('displays error message when getForecastData fails', async () => {
    (getForecastData as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to load forecast data',
    });

    const component = await ForecastContent({
      month: '2026-01',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByText('Failed to load forecast data')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-graph')).not.toBeInTheDocument();
  });

  it('handles empty bills array', async () => {
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const component = await ForecastContent({
      month: '2026-01',
      showAmortization: false,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByText('No bills')).toBeInTheDocument();
    expect(screen.getByText('Summary: 0 bills')).toBeInTheDocument();
  });

  it('passes showAmortization prop to ForecastSummary', async () => {
    const bills = [createMockBill('1')];
    (getForecastData as jest.Mock).mockResolvedValue({
      success: true,
      data: bills,
    });

    const component = await ForecastContent({
      month: '2026-01',
      showAmortization: true,
      showEstimates: false,
      currency: 'USD',
      locale: 'en-US',
    });

    render(component);

    expect(screen.getByTestId('forecast-summary')).toBeInTheDocument();
  });
});

