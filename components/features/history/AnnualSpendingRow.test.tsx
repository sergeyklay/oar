import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnualSpendingRow } from './AnnualSpendingRow';
import type { AggregatedBillSpending } from '@/lib/types';

jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

jest.mock('@/components/features/bills/CategoryIcon', () => ({
  CategoryIcon: ({ icon }: { icon: string }) => (
    <span data-testid={`category-icon-${icon}`}>{icon}</span>
  ),
}));

import { formatMoney } from '@/lib/money';

const mockBill: AggregatedBillSpending = {
  billId: 'bill-1',
  billTitle: 'Rent',
  categoryIcon: 'house',
  paymentCount: 12,
  totalAmount: 1200000,
  averageAmount: 100000,
};

describe('AnnualSpendingRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders table row with bill data', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays category icon', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(screen.getByTestId('category-icon-house')).toBeInTheDocument();
    });

    it('displays payment count', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      const paymentCount = screen.getByText('12');
      expect(paymentCount).toBeInTheDocument();
      expect(paymentCount).toHaveClass('font-mono', 'font-medium');
    });

    it('formats average amount using formatMoney', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(formatMoney).toHaveBeenCalledWith(100000, 'USD', 'en-US');
    });

    it('formats total amount using formatMoney', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(formatMoney).toHaveBeenCalledWith(1200000, 'USD', 'en-US');
    });

    it('displays formatted amounts with right alignment', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      const cells = screen.getAllByRole('cell');
      const averageCell = cells.find((cell) => cell.textContent?.includes('$1000.00'));
      const amountCell = cells.find((cell) => cell.textContent?.includes('$12000.00'));

      expect(averageCell).toHaveClass('text-right');
      expect(amountCell).toHaveClass('text-right');
    });

    it('passes correct currency and locale to formatMoney', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="PLN"
              locale="pl-PL"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(formatMoney).toHaveBeenCalledWith(100000, 'PLN', 'pl-PL');
      expect(formatMoney).toHaveBeenCalledWith(1200000, 'PLN', 'pl-PL');
    });
  });

  describe('highlighting', () => {
    it('applies highlight class when highlighted', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={true}
            />
          </tbody>
        </table>
      );

      const row = screen.getByText('Rent').closest('tr');
      expect(row).toHaveClass('bg-accent');
    });

    it('does not apply highlight class when not highlighted', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      const row = screen.getByText('Rent').closest('tr');
      expect(row).not.toHaveClass('bg-accent');
    });
  });

  describe('interactions', () => {
    it('calls onClick when row is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
              onClick={mockOnClick}
            />
          </tbody>
        </table>
      );

      const row = screen.getByText('Rent').closest('tr');
      await user.click(row!);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies cursor pointer style when onClick is provided', () => {
      const mockOnClick = jest.fn();

      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
              onClick={mockOnClick}
            />
          </tbody>
        </table>
      );

      const row = screen.getByText('Rent').closest('tr');
      expect(row).toHaveStyle({ cursor: 'pointer' });
    });

    it('does not apply cursor pointer when onClick is not provided', () => {
      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      const row = screen.getByText('Rent').closest('tr');
      expect(row).not.toHaveStyle({ cursor: 'pointer' });
    });

    it('does not call onClick when handler is not provided', async () => {
      const user = userEvent.setup();

      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={mockBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      const row = screen.getByText('Rent').closest('tr');
      await user.click(row!);

      expect(screen.getByText('Rent')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles zero payment count', () => {
      const zeroBill: AggregatedBillSpending = {
        ...mockBill,
        paymentCount: 0,
        totalAmount: 0,
        averageAmount: 0,
      };

      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={zeroBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(formatMoney).toHaveBeenCalledWith(0, 'USD', 'en-US');
    });

    it('handles single payment correctly', () => {
      const singlePaymentBill: AggregatedBillSpending = {
        ...mockBill,
        paymentCount: 1,
        totalAmount: 50000,
        averageAmount: 50000,
      };

      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={singlePaymentBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(formatMoney).toHaveBeenCalledWith(50000, 'USD', 'en-US');
    });

    it('handles large amounts correctly', () => {
      const largeAmountBill: AggregatedBillSpending = {
        ...mockBill,
        totalAmount: 99999999,
        averageAmount: 8333333,
      };

      render(
        <table>
          <tbody>
            <AnnualSpendingRow
              bill={largeAmountBill}
              currency="USD"
              locale="en-US"
              isHighlighted={false}
            />
          </tbody>
        </table>
      );

      expect(formatMoney).toHaveBeenCalledWith(99999999, 'USD', 'en-US');
      expect(formatMoney).toHaveBeenCalledWith(8333333, 'USD', 'en-US');
    });
  });
});

