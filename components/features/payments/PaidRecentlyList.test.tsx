import { render, screen } from '@testing-library/react';
import { PaidRecentlyList } from './PaidRecentlyList';
import { PaymentWithBill } from '@/lib/types';

jest.mock('@/lib/money', () => ({
  formatMoney: (amount: number, currency: string) => `${amount / 100} ${currency}`,
}));

describe('PaidRecentlyList', () => {
  const defaultProps = {
    currency: 'USD',
    locale: 'en-US',
  };

  describe('empty state', () => {
    it('displays empty state message when no payments', () => {
      render(<PaidRecentlyList payments={[]} {...defaultProps} />);

      expect(screen.getByText('No payments in this time range.')).toBeInTheDocument();
      expect(
        screen.getByText('Payments will appear here when you log them on your bills.')
      ).toBeInTheDocument();
    });

    it('does not render table when no payments', () => {
      render(<PaidRecentlyList payments={[]} {...defaultProps} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('with payments', () => {
    const mockPayments: PaymentWithBill[] = [
      {
        id: 'tx-1',
        billTitle: 'Rent',
        amount: 100000,
        paidAt: new Date('2025-12-15T10:00:00'),
        notes: null,
        categoryIcon: 'house',
      },
      {
        id: 'tx-2',
        billTitle: 'Electric Bill',
        amount: 15000,
        paidAt: new Date('2025-12-14T10:00:00'),
        notes: 'Paid via bank transfer',
        categoryIcon: 'zap',
      },
    ];

    it('renders table with correct column headers', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Amount Paid' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Payment Date' })).toBeInTheDocument();
    });

    it('displays payment bill title', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Electric Bill')).toBeInTheDocument();
    });

    it('displays formatted payment amount', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      expect(screen.getByText('1000 USD')).toBeInTheDocument();
      expect(screen.getByText('150 USD')).toBeInTheDocument();
    });

    it('displays formatted payment date', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      expect(screen.getByText('Mon, Dec 15')).toBeInTheDocument();
      expect(screen.getByText('Sun, Dec 14')).toBeInTheDocument();
    });

    it('displays payment notes when present', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      expect(screen.getByText('Paid via bank transfer')).toBeInTheDocument();
    });

    it('does not display empty notes placeholder', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      const rentRow = rows[1];

      expect(rentRow).not.toHaveTextContent('null');
      expect(rentRow).not.toHaveTextContent('undefined');
    });

    it('renders correct number of rows', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3);
    });
  });

  describe('accessibility', () => {
    const mockPayments: PaymentWithBill[] = [
      {
        id: 'tx-1',
        billTitle: 'Internet',
        amount: 5000,
        paidAt: new Date('2025-12-18T10:00:00'),
        notes: 'Monthly subscription',
        categoryIcon: 'wifi',
      },
    ];

    it('uses semantic table elements', () => {
      render(<PaidRecentlyList payments={mockPayments} {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('rowgroup')).toHaveLength(2);
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    });
  });
});

