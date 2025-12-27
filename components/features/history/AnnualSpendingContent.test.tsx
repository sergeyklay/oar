import { render, screen } from '@testing-library/react';
import { AnnualSpendingContent } from './AnnualSpendingContent';
import { getAnnualSpendingData } from '@/actions/history';
import { HistoryService } from '@/lib/services/HistoryService';

jest.mock('@/actions/history', () => ({
  getAnnualSpendingData: jest.fn(),
}));

jest.mock('@/lib/services/HistoryService', () => ({
  HistoryService: {
    calculateAnnualSummary: jest.fn(),
  },
}));

jest.mock('./AnnualSpendingInteractive', () => ({
  AnnualSpendingInteractive: ({
    data,
    currency,
    locale,
    year,
  }: {
    data: unknown[];
    summary: unknown;
    currency: string;
    locale: string;
    year: string;
  }) => (
    <div
      data-testid="annual-spending-interactive"
      data-currency={currency}
      data-locale={locale}
      data-year={year}
      data-bill-count={Array.isArray(data) ? data.length : 0}
    >
      Interactive
    </div>
  ),
}));

import type { AggregatedBillSpending, AnnualSpendingSummary } from '@/lib/types';

const mockData: AggregatedBillSpending[] = [
  {
    billId: 'bill-1',
    billTitle: 'Rent',
    categoryIcon: 'house',
    paymentCount: 12,
    totalAmount: 1200000,
    averageAmount: 100000,
  },
];

const mockSummary: AnnualSpendingSummary = {
  totalBills: 1,
  totalPayments: 12,
  amountPaid: 1200000,
};

describe('AnnualSpendingContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful data loading', () => {
    it('renders interactive component with fetched data', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue(mockSummary);

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      expect(screen.getByTestId('annual-spending-interactive')).toBeInTheDocument();
    });

    it('calls getAnnualSpendingData with correct year', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue(mockSummary);

      await AnnualSpendingContent({
        year: '2024',
        currency: 'USD',
        locale: 'en-US',
      });

      expect(getAnnualSpendingData).toHaveBeenCalledWith({ year: '2024' });
    });

    it('calculates summary using HistoryService', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue(mockSummary);

      await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      expect(HistoryService.calculateAnnualSummary).toHaveBeenCalledWith(mockData);
    });

    it('passes data and summary to interactive component', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue(mockSummary);

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      const interactive = screen.getByTestId('annual-spending-interactive');
      expect(interactive).toHaveAttribute('data-bill-count', '1');
    });

    it('passes currency and locale to interactive component', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue(mockSummary);

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'PLN',
        locale: 'pl-PL',
      });

      render(component);

      const interactive = screen.getByTestId('annual-spending-interactive');
      expect(interactive).toHaveAttribute('data-currency', 'PLN');
      expect(interactive).toHaveAttribute('data-locale', 'pl-PL');
    });

    it('handles empty data array', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue({
        totalBills: 0,
        totalPayments: 0,
        amountPaid: 0,
      });

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      const interactive = screen.getByTestId('annual-spending-interactive');
      expect(interactive).toHaveAttribute('data-bill-count', '0');
    });
  });

  describe('error handling', () => {
    it('displays error message when action fails', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch data',
      });

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
      expect(screen.queryByTestId('annual-spending-interactive')).not.toBeInTheDocument();
    });

    it('displays default error message when error is not provided', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: false,
        error: null,
      });

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      expect(screen.getByText('Failed to load annual spending data')).toBeInTheDocument();
    });

    it('does not calculate summary when action fails', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      expect(HistoryService.calculateAnnualSummary).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles null data from action', async () => {
      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue({
        totalBills: 0,
        totalPayments: 0,
        amountPaid: 0,
      });

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      const interactive = screen.getByTestId('annual-spending-interactive');
      expect(interactive).toHaveAttribute('data-bill-count', '0');
    });

    it('handles multiple bills correctly', async () => {
      const multipleBills: AggregatedBillSpending[] = [
        mockData[0],
        {
          billId: 'bill-2',
          billTitle: 'Internet',
          categoryIcon: 'wifi',
          paymentCount: 12,
          totalAmount: 60000,
          averageAmount: 5000,
        },
      ];

      (getAnnualSpendingData as jest.Mock).mockResolvedValue({
        success: true,
        data: multipleBills,
      });
      (HistoryService.calculateAnnualSummary as jest.Mock).mockReturnValue({
        totalBills: 2,
        totalPayments: 24,
        amountPaid: 1260000,
      });

      const component = await AnnualSpendingContent({
        year: '2025',
        currency: 'USD',
        locale: 'en-US',
      });

      render(component);

      const interactive = screen.getByTestId('annual-spending-interactive');
      expect(interactive).toHaveAttribute('data-bill-count', '2');
    });
  });
});

