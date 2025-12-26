import { render, screen } from '@testing-library/react';
import { ForecastSummary } from './ForecastSummary';

jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

describe('ForecastSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays month heading', () => {
    render(
      <ForecastSummary
        billsDueCount={0}
        summary={{
          totalDue: 0,
          totalToSave: 0,
          grandTotal: 0,
        }}
        currency="USD"
        locale="en-US"
        month="2026-01"
      />
    );

    expect(screen.getByRole('heading', { name: /january 2026/i })).toBeInTheDocument();
  });

  describe('Bills Due count', () => {
    it('displays bills due count as first item', () => {
      render(
        <ForecastSummary
          billsDueCount={3}
          summary={{
            totalDue: 45000,
            totalToSave: 0,
            grandTotal: 45000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      expect(screen.getByText('Bills Due')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays zero when no bills are provided', () => {
      render(
        <ForecastSummary
          billsDueCount={0}
          summary={{
            totalDue: 0,
            totalToSave: 0,
            grandTotal: 0,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      expect(screen.getByText('Bills Due')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('updates count when billsDueCount prop changes', () => {
      const { rerender } = render(
        <ForecastSummary
          billsDueCount={1}
          summary={{
            totalDue: 10000,
            totalToSave: 0,
            grandTotal: 10000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();

      rerender(
        <ForecastSummary
          billsDueCount={4}
          summary={{
            totalDue: 50000,
            totalToSave: 0,
            grandTotal: 50000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Total Due', () => {
    it('displays total due amount', () => {
      render(
        <ForecastSummary
          billsDueCount={2}
          summary={{
            totalDue: 30000,
            totalToSave: 0,
            grandTotal: 30000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      const totalDueLabel = screen.getByText('Total Due');
      expect(totalDueLabel).toBeInTheDocument();

      const totalDueRow = totalDueLabel.closest('div');
      expect(totalDueRow).toHaveTextContent('$300.00');
    });
  });

  describe('Total to Save', () => {
    it('always displays total to save', () => {
      render(
        <ForecastSummary
          billsDueCount={2}
          summary={{
            totalDue: 30000,
            totalToSave: 8000,
            grandTotal: 38000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      expect(screen.getByText('Total to Save')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument();
    });
  });

  describe('Grand Total', () => {
    it('displays grand total combining total due and total to save', () => {
      render(
        <ForecastSummary
          billsDueCount={2}
          summary={{
            totalDue: 30000,
            totalToSave: 8000,
            grandTotal: 38000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      expect(screen.getByText('Grand Total')).toBeInTheDocument();
      expect(screen.getByText('$380.00')).toBeInTheDocument();
    });

    it('displays grand total equal to total due when no amortization', () => {
      render(
        <ForecastSummary
          billsDueCount={2}
          summary={{
            totalDue: 30000,
            totalToSave: 0,
            grandTotal: 30000,
          }}
          currency="USD"
          locale="en-US"
          month="2026-01"
        />
      );

      const grandTotalLabel = screen.getByText('Grand Total');
      expect(grandTotalLabel).toBeInTheDocument();

      const grandTotalRow = grandTotalLabel.closest('div');
      expect(grandTotalRow).toHaveTextContent('$300.00');
    });
  });
});

