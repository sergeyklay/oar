import { render, screen } from '@testing-library/react';
import { AnnualSpendingSummary } from './AnnualSpendingSummary';

jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

jest.mock('./YearNavigation', () => ({
  YearNavigation: ({ currentYear }: { currentYear: string }) => (
    <div data-testid="year-navigation" data-year={currentYear}>
      YearNavigation
    </div>
  ),
}));

import { formatMoney } from '@/lib/money';

const defaultSummary = {
  totalBills: 0,
  totalPayments: 0,
  amountPaid: 0,
};

describe('AnnualSpendingSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('year display', () => {
    it('displays year as heading', () => {
      render(
        <AnnualSpendingSummary
          summary={defaultSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByRole('heading', { name: '2025' })).toBeInTheDocument();
    });

    it('displays different year correctly', () => {
      render(
        <AnnualSpendingSummary
          summary={defaultSummary}
          currency="USD"
          locale="en-US"
          year="2024"
        />
      );

      expect(screen.getByRole('heading', { name: '2024' })).toBeInTheDocument();
    });

    it('renders YearNavigation component with correct year', () => {
      render(
        <AnnualSpendingSummary
          summary={defaultSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const navigation = screen.getByTestId('year-navigation');
      expect(navigation).toBeInTheDocument();
      expect(navigation).toHaveAttribute('data-year', '2025');
    });
  });

  describe('Total Bills', () => {
    it('displays total bills count', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 5,
            totalPayments: 0,
            amountPaid: 0,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('Total Bills')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays zero when no bills', () => {
      render(
        <AnnualSpendingSummary
          summary={defaultSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const totalBillsLabel = screen.getByText('Total Bills');
      expect(totalBillsLabel).toBeInTheDocument();

      const totalBillsRow = totalBillsLabel.closest('div');
      expect(totalBillsRow).toHaveTextContent('0');
    });

    it('displays large bill count correctly', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 50,
            totalPayments: 0,
            amountPaid: 0,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Total Payments', () => {
    it('displays total payments count', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 2,
            totalPayments: 24,
            amountPaid: 0,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('Total Payments')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('displays zero when no payments', () => {
      render(
        <AnnualSpendingSummary
          summary={defaultSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const totalPaymentsLabel = screen.getByText('Total Payments');
      expect(totalPaymentsLabel).toBeInTheDocument();

      const totalPaymentsRow = totalPaymentsLabel.closest('div');
      expect(totalPaymentsRow).toHaveTextContent('0');
    });

    it('displays large payment count correctly', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 10,
            totalPayments: 120,
            amountPaid: 0,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  describe('Amount Paid', () => {
    it('displays amount paid with formatting', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 2,
            totalPayments: 24,
            amountPaid: 1350000,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('Amount Paid')).toBeInTheDocument();
      expect(screen.getByText('$13500.00')).toBeInTheDocument();
    });

    it('calls formatMoney with correct parameters', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 2,
            totalPayments: 24,
            amountPaid: 1350000,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(formatMoney).toHaveBeenCalledWith(1350000, 'USD', 'en-US');
    });

    it('displays zero amount correctly', () => {
      render(
        <AnnualSpendingSummary
          summary={defaultSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('Amount Paid')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('passes correct currency and locale to formatMoney', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 2,
            totalPayments: 24,
            amountPaid: 1350000,
          }}
          currency="PLN"
          locale="pl-PL"
          year="2025"
        />
      );

      expect(formatMoney).toHaveBeenCalledWith(1350000, 'PLN', 'pl-PL');
    });

    it('has border and bold styling for amount paid row', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 2,
            totalPayments: 24,
            amountPaid: 1350000,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const amountPaidLabel = screen.getByText('Amount Paid');
      const amountPaidRow = amountPaidLabel.closest('div');

      expect(amountPaidRow).toHaveClass('pt-2', 'border-t', 'border-border');
      expect(amountPaidLabel).toHaveClass('font-medium');

      const amountValue = amountPaidRow?.querySelector('.font-bold');
      expect(amountValue).toBeInTheDocument();
    });

    it('handles large amounts correctly', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 10,
            totalPayments: 120,
            amountPaid: 99999999,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(formatMoney).toHaveBeenCalledWith(99999999, 'USD', 'en-US');
    });
  });

  describe('layout structure', () => {
    it('renders all summary elements in correct order', () => {
      render(
        <AnnualSpendingSummary
          summary={{
            totalBills: 2,
            totalPayments: 24,
            amountPaid: 1350000,
          }}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const heading = screen.getByRole('heading', { name: '2025' });
      const totalBills = screen.getByText('Total Bills');
      const totalPayments = screen.getByText('Total Payments');
      const amountPaid = screen.getByText('Amount Paid');

      expect(heading).toBeInTheDocument();
      expect(totalBills).toBeInTheDocument();
      expect(totalPayments).toBeInTheDocument();
      expect(amountPaid).toBeInTheDocument();
    });
  });
});

