import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnualSpendingList } from './AnnualSpendingList';
import type { AggregatedBillSpending } from '@/lib/types';

jest.mock('./AnnualSpendingRow', () => ({
  AnnualSpendingRow: ({
    bill,
    isHighlighted,
    onClick,
  }: {
    bill: AggregatedBillSpending;
    isHighlighted: boolean;
    onClick?: () => void;
  }) => (
    <tr
      data-testid={`row-${bill.billId}`}
      data-highlighted={isHighlighted}
      onClick={onClick}
    >
      <td>{bill.billTitle}</td>
      <td>{bill.paymentCount}</td>
      <td>{bill.totalAmount}</td>
    </tr>
  ),
}));

jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

const mockBills: AggregatedBillSpending[] = [
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

describe('AnnualSpendingList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering with data', () => {
    it('renders table with header row', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Payments' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Average' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
    });

    it('renders row for each bill', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByTestId('row-bill-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-bill-2')).toBeInTheDocument();
    });

    it('passes bill data to row components', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const row1 = screen.getByTestId('row-bill-1');
      expect(row1).toHaveTextContent('Rent');
      expect(row1).toHaveTextContent('12');

      const row2 = screen.getByTestId('row-bill-2');
      expect(row2).toHaveTextContent('Internet');
      expect(row2).toHaveTextContent('12');
    });

    it('passes currency and locale to row components', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="PLN"
          locale="pl-PL"
          year="2025"
        />
      );

      expect(screen.getByTestId('row-bill-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-bill-2')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('displays empty message when no bills', () => {
      render(
        <AnnualSpendingList
          bills={[]}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('No payments in 2025')).toBeInTheDocument();
      expect(screen.getByText('Try selecting a different year.')).toBeInTheDocument();
    });

    it('displays correct year in empty message', () => {
      render(
        <AnnualSpendingList
          bills={[]}
          currency="USD"
          locale="en-US"
          year="2024"
        />
      );

      expect(screen.getByText('No payments in 2024')).toBeInTheDocument();
    });

    it('does not render table when empty', () => {
      render(
        <AnnualSpendingList
          bills={[]}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('highlighting', () => {
    it('passes highlight state to row when bill is highlighted', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
          highlightedBillId="bill-1"
        />
      );

      const row1 = screen.getByTestId('row-bill-1');
      const row2 = screen.getByTestId('row-bill-2');

      expect(row1).toHaveAttribute('data-highlighted', 'true');
      expect(row2).toHaveAttribute('data-highlighted', 'false');
    });

    it('does not highlight any row when no bill is highlighted', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const row1 = screen.getByTestId('row-bill-1');
      const row2 = screen.getByTestId('row-bill-2');

      expect(row1).toHaveAttribute('data-highlighted', 'false');
      expect(row2).toHaveAttribute('data-highlighted', 'false');
    });

    it('updates highlight when highlightedBillId changes', () => {
      const { rerender } = render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
          highlightedBillId="bill-1"
        />
      );

      let row1 = screen.getByTestId('row-bill-1');
      expect(row1).toHaveAttribute('data-highlighted', 'true');

      rerender(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
          highlightedBillId="bill-2"
        />
      );

      row1 = screen.getByTestId('row-bill-1');
      const row2 = screen.getByTestId('row-bill-2');
      expect(row1).toHaveAttribute('data-highlighted', 'false');
      expect(row2).toHaveAttribute('data-highlighted', 'true');
    });
  });

  describe('interactions', () => {
    it('calls onBillClick when row is clicked', async () => {
      const user = userEvent.setup();
      const mockOnBillClick = jest.fn();

      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
          onBillClick={mockOnBillClick}
        />
      );

      const row1 = screen.getByTestId('row-bill-1');
      await user.click(row1);

      expect(mockOnBillClick).toHaveBeenCalledWith('bill-1');
      expect(mockOnBillClick).toHaveBeenCalledTimes(1);
    });

    it('calls onBillClick for different bills', async () => {
      const user = userEvent.setup();
      const mockOnBillClick = jest.fn();

      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
          onBillClick={mockOnBillClick}
        />
      );

      await user.click(screen.getByTestId('row-bill-1'));
      await user.click(screen.getByTestId('row-bill-2'));

      expect(mockOnBillClick).toHaveBeenCalledWith('bill-1');
      expect(mockOnBillClick).toHaveBeenCalledWith('bill-2');
      expect(mockOnBillClick).toHaveBeenCalledTimes(2);
    });

    it('does not call onBillClick when handler is not provided', async () => {
      const user = userEvent.setup();

      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const row1 = screen.getByTestId('row-bill-1');
      await user.click(row1);

      expect(screen.getByTestId('row-bill-1')).toBeInTheDocument();
    });
  });

  describe('table structure', () => {
    it('renders table with correct structure', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('bill-table');
    });

    it('has right-aligned columns for Payments, Average, and Amount', () => {
      render(
        <AnnualSpendingList
          bills={mockBills}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const paymentsHeader = screen.getByRole('columnheader', { name: 'Payments' });
      const averageHeader = screen.getByRole('columnheader', { name: 'Average' });
      const amountHeader = screen.getByRole('columnheader', { name: 'Amount' });

      expect(paymentsHeader).toHaveClass('text-right');
      expect(averageHeader).toHaveClass('text-right');
      expect(amountHeader).toHaveClass('text-right');
    });

    it('handles single bill correctly', () => {
      const singleBill = [mockBills[0]];

      render(
        <AnnualSpendingList
          bills={singleBill}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByTestId('row-bill-1')).toBeInTheDocument();
      expect(screen.queryByTestId('row-bill-2')).not.toBeInTheDocument();
    });
  });
});

