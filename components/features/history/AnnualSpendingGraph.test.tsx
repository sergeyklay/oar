import { render, screen } from '@testing-library/react';
import { AnnualSpendingGraph } from './AnnualSpendingGraph';
import type { AggregatedBillSpending } from '@/lib/types';

jest.mock('./AnnualSpendingChart', () => ({
  AnnualSpendingChart: ({
    data,
    currency,
    locale,
    highlightedBillId,
  }: {
    data: AggregatedBillSpending[];
    currency: string;
    locale: string;
    highlightedBillId?: string;
    onBillClick?: (billId: string) => void;
  }) => (
    <div
      data-testid="annual-spending-chart"
      data-currency={currency}
      data-locale={locale}
      data-highlighted-bill-id={highlightedBillId}
      data-bill-count={data.length}
    >
      Chart
    </div>
  ),
}));

const mockData: AggregatedBillSpending[] = [
  {
    billId: 'bill-1',
    billTitle: 'Rent',
    categoryIcon: 'house',
    paymentCount: 12,
    totalAmount: 1200000,
    averageAmount: 100000,
  },
  {
    billId: 'bill-2',
    billTitle: 'Internet',
    categoryIcon: 'wifi',
    paymentCount: 12,
    totalAmount: 60000,
    averageAmount: 5000,
  },
];

describe('AnnualSpendingGraph', () => {
  describe('rendering with data', () => {
    it('renders chart component with data', () => {
      render(
        <AnnualSpendingGraph
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute('data-bill-count', '2');
    });

    it('passes currency and locale to chart', () => {
      render(
        <AnnualSpendingGraph
          data={mockData}
          currency="PLN"
          locale="pl-PL"
        />
      );

      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toHaveAttribute('data-currency', 'PLN');
      expect(chart).toHaveAttribute('data-locale', 'pl-PL');
    });

    it('passes highlight props to chart', () => {
      render(
        <AnnualSpendingGraph
          data={mockData}
          currency="USD"
          locale="en-US"
          highlightedBillId="bill-1"
        />
      );

      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toHaveAttribute('data-highlighted-bill-id', 'bill-1');
    });

    it('passes onBillClick handler to chart', () => {
      const mockOnBillClick = jest.fn();

      render(
        <AnnualSpendingGraph
          data={mockData}
          currency="USD"
          locale="en-US"
          onBillClick={mockOnBillClick}
        />
      );

      expect(screen.getByTestId('annual-spending-chart')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('passes empty data to chart component', () => {
      render(
        <AnnualSpendingGraph
          data={[]}
          currency="USD"
          locale="en-US"
        />
      );

      expect(screen.getByTestId('annual-spending-chart')).toBeInTheDocument();
      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toHaveAttribute('data-bill-count', '0');
    });
  });

  describe('data passing', () => {
    it('passes all bills to chart component', () => {
      render(
        <AnnualSpendingGraph
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toHaveAttribute('data-bill-count', '2');
    });

    it('handles single bill correctly', () => {
      const singleBill = [mockData[0]];

      render(
        <AnnualSpendingGraph
          data={singleBill}
          currency="USD"
          locale="en-US"
        />
      );

      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toHaveAttribute('data-bill-count', '1');
    });

    it('handles many bills correctly', () => {
      const manyBills: AggregatedBillSpending[] = Array.from({ length: 10 }, (_, i) => ({
        billId: `bill-${i}`,
        billTitle: `Bill ${i}`,
        categoryIcon: 'house',
        paymentCount: 1,
        totalAmount: 10000,
        averageAmount: 10000,
      }));

      render(
        <AnnualSpendingGraph
          data={manyBills}
          currency="USD"
          locale="en-US"
        />
      );

      const chart = screen.getByTestId('annual-spending-chart');
      expect(chart).toHaveAttribute('data-bill-count', '10');
    });
  });

  describe('wrapper styling', () => {
    it('applies correct wrapper classes', () => {
      render(
        <AnnualSpendingGraph
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const wrapper = screen.getByTestId('annual-spending-chart').parentElement;
      expect(wrapper).toHaveClass('bg-card', 'border', 'border-border');
    });
  });
});

