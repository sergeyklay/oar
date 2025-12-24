import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentHistorySection } from './PaymentHistorySection';
import { getTransactionsByBillId, deleteTransaction, updateTransaction } from '@/actions/transactions';
import type { Transaction } from '@/lib/types';

const mockRefresh = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

jest.mock('@/actions/transactions', () => ({
  getTransactionsByBillId: jest.fn(),
  deleteTransaction: jest.fn(),
  updateTransaction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn((message, options) => mockToastSuccess(message, options)),
    error: jest.fn((message, options) => mockToastError(message, options)),
  },
}));

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  billId: 'bill-1',
  amount: 16420,
  paidAt: new Date('2025-06-20'),
  notes: null,
  createdAt: new Date(),
  ...overrides,
});

describe('PaymentHistorySection', () => {
  const defaultProps = {
    billId: 'bill-1',
    currency: 'USD',
    locale: 'en-US',
    isExpanded: false,
    onExpandChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    (getTransactionsByBillId as jest.Mock).mockReset();
    (deleteTransaction as jest.Mock).mockReset();
    (updateTransaction as jest.Mock).mockReset();
  });

  describe('collapsed state', () => {
    it('displays "View Payment History" title', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...defaultProps} />);

      expect(screen.getByText('View Payment History')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });
    });

    it('displays "Loading..." subtitle while fetching', async () => {
      let resolvePromise: (value: Transaction[]) => void;
      const pendingPromise = new Promise<Transaction[]>((resolve) => {
        resolvePromise = resolve;
      });
      (getTransactionsByBillId as jest.Mock).mockReturnValue(pendingPromise);

      render(<PaymentHistorySection {...defaultProps} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      resolvePromise!([]);
      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });
    });

    it('displays "No Payments" when no transactions exist', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });
    });

    it('displays last payment info when transactions exist', async () => {
      const transactions = [createMockTransaction({ amount: 16420, paidAt: new Date('2025-06-20') })];
      (getTransactionsByBillId as jest.Mock).mockResolvedValue(transactions);
      render(<PaymentHistorySection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Last Paid \$164\.20 on Fri, Jun 20/)).toBeInTheDocument();
      });
    });

    it('calls onExpandChange(true) when clicked', async () => {
      const user = userEvent.setup();
      const onExpandChange = jest.fn();
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...defaultProps} onExpandChange={onExpandChange} />);

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      expect(onExpandChange).toHaveBeenCalledWith(true);
    });
  });

  describe('expanded state', () => {
    const expandedProps = { ...defaultProps, isExpanded: true };

    it('displays "Payment History" header with back arrow', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...expandedProps} />);

      expect(screen.getByText('Payment History')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();
      });
    });

    it('calls onExpandChange(false) when back button clicked', async () => {
      const user = userEvent.setup();
      const onExpandChange = jest.fn();
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...expandedProps} onExpandChange={onExpandChange} />);

      await waitFor(() => {
        expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button'));

      expect(onExpandChange).toHaveBeenCalledWith(false);
    });

    it('displays "No payments recorded yet." when no transactions', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...expandedProps} />);

      await waitFor(() => {
        expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();
      });
    });

    it('displays transaction list with formatted data', async () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', amount: 16420, paidAt: new Date('2025-06-26') }),
        createMockTransaction({ id: 'tx-2', amount: 15845, paidAt: new Date('2025-05-26'), notes: 'May payment' }),
      ];
      (getTransactionsByBillId as jest.Mock).mockResolvedValue(transactions);
      render(<PaymentHistorySection {...expandedProps} />);

      await waitFor(() => {
        expect(screen.getByText('26/06/2025')).toBeInTheDocument();
        expect(screen.getByText('$164.20')).toBeInTheDocument();
        expect(screen.getByText('26/05/2025')).toBeInTheDocument();
        expect(screen.getByText('$158.45')).toBeInTheDocument();
        expect(screen.getByText('May payment')).toBeInTheDocument();
      });
    });

    it('displays empty string for transactions without notes', async () => {
      const transactions = [createMockTransaction({ notes: null })];
      (getTransactionsByBillId as jest.Mock).mockResolvedValue(transactions);
      render(<PaymentHistorySection {...expandedProps} />);

      await waitFor(() => {
        expect(screen.getByText('$164.20')).toBeInTheDocument();
      });

      const noteElements = screen.getAllByText('');
      expect(noteElements.length).toBeGreaterThan(0);
    });
  });

  describe('data fetching', () => {
    it('fetches transactions on mount with correct billId', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      render(<PaymentHistorySection {...defaultProps} billId="test-bill-123" />);

      expect(getTransactionsByBillId).toHaveBeenCalledWith('test-bill-123');

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });
    });

    it('refetches when billId changes', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      const { rerender } = render(<PaymentHistorySection {...defaultProps} billId="bill-1" />);

      expect(getTransactionsByBillId).toHaveBeenCalledWith('bill-1');

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });

      rerender(<PaymentHistorySection {...defaultProps} billId="bill-2" />);

      expect(getTransactionsByBillId).toHaveBeenCalledWith('bill-2');
      expect(getTransactionsByBillId).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });
    });

    it('refetches when refreshKey changes', async () => {
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([]);
      const { rerender } = render(<PaymentHistorySection {...defaultProps} refreshKey={0} />);

      await waitFor(() => {
        expect(screen.getByText('No Payments')).toBeInTheDocument();
      });
      expect(getTransactionsByBillId).toHaveBeenCalledTimes(1);

      const newTransaction = createMockTransaction({ amount: 5000, paidAt: new Date('2025-07-15') });
      (getTransactionsByBillId as jest.Mock).mockResolvedValue([newTransaction]);

      rerender(<PaymentHistorySection {...defaultProps} refreshKey={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Last Paid \$50\.00 on Tue, Jul 15/)).toBeInTheDocument();
      });
      expect(getTransactionsByBillId).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleDelete', () => {
    const expandedProps = { ...defaultProps, isExpanded: true };

    it('deletes transaction and refetches on success', async () => {
      const user = userEvent.setup();
      const transactions = [
        createMockTransaction({ id: 'tx-1', amount: 16420, paidAt: new Date('2025-06-26') }),
        createMockTransaction({ id: 'tx-2', amount: 15845, paidAt: new Date('2025-05-26') }),
      ];
      const remainingTransactions = [transactions[1]];

      (getTransactionsByBillId as jest.Mock)
        .mockResolvedValueOnce(transactions)
        .mockResolvedValueOnce(remainingTransactions);

      (deleteTransaction as jest.Mock).mockResolvedValue({ success: true });

      render(<PaymentHistorySection {...expandedProps} />);

      await waitFor(() => {
        expect(screen.getByText('26/06/2025')).toBeInTheDocument();
      });

      const dateText = screen.getByText('26/06/2025');
      const transactionRow = dateText.closest('div');
      if (transactionRow) {
        await user.click(transactionRow);
      } else {
        await user.click(dateText);
      }

      await waitFor(() => {
        expect(screen.getByText('Selected Payment')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete this payment/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(deleteTransaction).toHaveBeenCalledWith({ id: 'tx-1' });
        expect(mockToastSuccess).toHaveBeenCalledWith('Payment deleted', {
          description: 'Payment record has been removed.',
        });
      });

      await waitFor(() => {
        expect(getTransactionsByBillId).toHaveBeenCalledTimes(2);
        expect(getTransactionsByBillId).toHaveBeenLastCalledWith('bill-1');
      });

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.queryByText('26/06/2025')).not.toBeInTheDocument();
        expect(screen.getByText('26/05/2025')).toBeInTheDocument();
        expect(screen.queryByText('Selected Payment')).not.toBeInTheDocument();
      });
    });

    it('shows error toast on delete failure', async () => {
      const user = userEvent.setup();
      const transactions = [
        createMockTransaction({ id: 'tx-1', amount: 16420, paidAt: new Date('2025-06-26') }),
      ];

      (getTransactionsByBillId as jest.Mock).mockResolvedValue(transactions);
      (deleteTransaction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to delete payment',
      });

      render(<PaymentHistorySection {...expandedProps} />);

      await waitFor(() => {
        expect(screen.getByText('26/06/2025')).toBeInTheDocument();
      });

      const dateText = screen.getByText('26/06/2025');
      const transactionRow = dateText.closest('div');
      if (transactionRow) {
        await user.click(transactionRow);
      } else {
        await user.click(dateText);
      }

      await waitFor(() => {
        expect(screen.getByText('Selected Payment')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete this payment/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /^delete$/i });
        return confirmButton;
      });

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(deleteTransaction).toHaveBeenCalledWith({ id: 'tx-1' });
        expect(mockToastError).toHaveBeenCalledWith('Failed to delete payment', {
          description: 'Failed to delete payment',
        });
        expect(mockToastSuccess).not.toHaveBeenCalled();
        expect(mockRefresh).not.toHaveBeenCalled();
      });
    });

    it('does nothing when no transaction is selected', async () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', amount: 16420, paidAt: new Date('2025-06-26') }),
      ];

      (getTransactionsByBillId as jest.Mock).mockResolvedValue(transactions);
      (deleteTransaction as jest.Mock).mockResolvedValue({ success: true });

      render(<PaymentHistorySection {...expandedProps} />);

      await waitFor(() => {
        expect(screen.getByText('26/06/2025')).toBeInTheDocument();
      });

      expect(screen.getByText('Select a payment to view and edit')).toBeInTheDocument();
      expect(deleteTransaction).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
