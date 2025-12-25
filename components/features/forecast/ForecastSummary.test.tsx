import { render, screen } from '@testing-library/react';
import { ForecastSummary } from './ForecastSummary';
import type { ForecastBill } from '@/lib/services/ForecastService';

jest.mock('@/lib/services/ForecastService');
jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

import { ForecastService } from '@/lib/services/ForecastService';

const createMockBill = (id: string, displayAmount: number, amortizationAmount: number | null = null): ForecastBill => ({
  id,
  title: `Bill ${id}`,
  amount: displayAmount,
  amountDue: displayAmount,
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
  displayAmount,
  isEstimated: false,
  amortizationAmount,
});

describe('ForecastSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays summary heading', () => {
    (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
      totalDue: 0,
      totalToSave: 0,
      grandTotal: 0,
    });

    render(
      <ForecastSummary
        bills={[]}
        currency="USD"
        locale="en-US"
        showAmortization={false}
      />
    );

    expect(screen.getByRole('heading', { name: /summary/i })).toBeInTheDocument();
  });

  describe('Bills Due count', () => {
    it('displays bills due count as first item', () => {
      const bills = [
        createMockBill('1', 10000),
        createMockBill('2', 20000),
        createMockBill('3', 15000),
      ];

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 45000,
        totalToSave: 0,
        grandTotal: 45000,
      });

      render(
        <ForecastSummary
          bills={bills}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      expect(screen.getByText('Bills Due')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays zero when no bills are provided', () => {
      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 0,
        totalToSave: 0,
        grandTotal: 0,
      });

      render(
        <ForecastSummary
          bills={[]}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      expect(screen.getByText('Bills Due')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('updates count when bills array changes', () => {
      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 10000,
        totalToSave: 0,
        grandTotal: 10000,
      });

      const { rerender } = render(
        <ForecastSummary
          bills={[createMockBill('1', 10000)]}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 50000,
        totalToSave: 0,
        grandTotal: 50000,
      });

      rerender(
        <ForecastSummary
          bills={[
            createMockBill('1', 10000),
            createMockBill('2', 20000),
            createMockBill('3', 15000),
            createMockBill('4', 5000),
          ]}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Total Due', () => {
    it('displays total due amount', () => {
      const bills = [
        createMockBill('1', 10000),
        createMockBill('2', 20000),
      ];

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 30000,
        totalToSave: 0,
        grandTotal: 30000,
      });

      render(
        <ForecastSummary
          bills={bills}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      const totalDueLabel = screen.getByText('Total Due');
      expect(totalDueLabel).toBeInTheDocument();

      const totalDueRow = totalDueLabel.closest('div');
      expect(totalDueRow).toHaveTextContent('$300.00');
    });
  });

  describe('Total to Save', () => {
    it('displays total to save when showAmortization is true', () => {
      const bills = [
        createMockBill('1', 10000, 5000),
        createMockBill('2', 20000, 3000),
      ];

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 30000,
        totalToSave: 8000,
        grandTotal: 38000,
      });

      render(
        <ForecastSummary
          bills={bills}
          currency="USD"
          locale="en-US"
          showAmortization={true}
        />
      );

      expect(screen.getByText('Total to Save')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument();
    });

    it('hides total to save when showAmortization is false', () => {
      const bills = [
        createMockBill('1', 10000, 5000),
      ];

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 10000,
        totalToSave: 5000,
        grandTotal: 15000,
      });

      render(
        <ForecastSummary
          bills={bills}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      expect(screen.queryByText('Total to Save')).not.toBeInTheDocument();
    });
  });

  describe('Grand Total', () => {
    it('displays grand total combining total due and total to save', () => {
      const bills = [
        createMockBill('1', 10000, 5000),
        createMockBill('2', 20000, 3000),
      ];

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 30000,
        totalToSave: 8000,
        grandTotal: 38000,
      });

      render(
        <ForecastSummary
          bills={bills}
          currency="USD"
          locale="en-US"
          showAmortization={true}
        />
      );

      expect(screen.getByText('Grand Total')).toBeInTheDocument();
      expect(screen.getByText('$380.00')).toBeInTheDocument();
    });

    it('displays grand total equal to total due when no amortization', () => {
      const bills = [
        createMockBill('1', 10000),
        createMockBill('2', 20000),
      ];

      (ForecastService.calculateSummary as jest.Mock).mockReturnValue({
        totalDue: 30000,
        totalToSave: 0,
        grandTotal: 30000,
      });

      render(
        <ForecastSummary
          bills={bills}
          currency="USD"
          locale="en-US"
          showAmortization={false}
        />
      );

      const grandTotalLabel = screen.getByText('Grand Total');
      expect(grandTotalLabel).toBeInTheDocument();

      const grandTotalRow = grandTotalLabel.closest('div');
      expect(grandTotalRow).toHaveTextContent('$300.00');
    });
  });
});

