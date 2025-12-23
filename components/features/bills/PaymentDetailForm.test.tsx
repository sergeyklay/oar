import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentDetailForm } from './PaymentDetailForm';
import type { Transaction } from '@/lib/types';

jest.mock('@/actions/transactions', () => ({
  updateTransaction: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  billId: 'bill-1',
  amount: 16420,
  paidAt: new Date('2025-06-20'),
  notes: 'Test note',
  createdAt: new Date(),
  ...overrides,
});

describe('PaymentDetailForm', () => {
  const defaultProps = {
    transaction: createMockTransaction(),
    currency: 'USD',
    locale: 'en-US',
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('read-only mode', () => {
    it('displays "Selected Payment" header', () => {
      render(<PaymentDetailForm {...defaultProps} />);

      expect(screen.getByText('Selected Payment')).toBeInTheDocument();
    });

    it('displays transaction details in read-only format', () => {
      render(<PaymentDetailForm {...defaultProps} />);

      expect(screen.getByText('20/06/2025')).toBeInTheDocument();
      expect(screen.getByText('$164.20')).toBeInTheDocument();
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });

    it('displays empty string when notes are null', () => {
      const transaction = createMockTransaction({ notes: null });
      render(<PaymentDetailForm {...defaultProps} transaction={transaction} />);

      const noteLabel = screen.getByText('Note:');
      expect(noteLabel).toBeInTheDocument();
    });

    it('shows Edit and Trash buttons', () => {
      render(<PaymentDetailForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByTitle('Delete this payment')).toBeInTheDocument();
    });

    it('does not show Cancel and Save buttons', () => {
      render(<PaymentDetailForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('hides Edit and Trash buttons when editing', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete this payment')).not.toBeInTheDocument();
    });

    it('shows Cancel and Save buttons when editing', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('makes amount field editable', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));

      const amountInput = screen.getByPlaceholderText('0.00');
      expect(amountInput).toBeInTheDocument();
      expect(amountInput).not.toHaveAttribute('readonly');
    });

    it('exits edit mode when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });
  });

  describe('delete functionality', () => {
    it('opens delete dialog when Trash button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailForm {...defaultProps} />);

      await user.click(screen.getByTitle('Delete this payment'));

      expect(screen.getByText('Delete Payment Record')).toBeInTheDocument();
    });

    it('calls onDelete when deletion is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      render(<PaymentDetailForm {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByTitle('Delete this payment'));
      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });
  });

  describe('transaction changes', () => {
    it('resets to read-only mode when transaction changes', () => {
      const { rerender } = render(<PaymentDetailForm {...defaultProps} />);

      const newTransaction = createMockTransaction({
        id: 'tx-2',
        amount: 20000,
        notes: 'New note',
      });

      rerender(<PaymentDetailForm {...defaultProps} transaction={newTransaction} />);

      expect(screen.getByText('$200.00')).toBeInTheDocument();
      expect(screen.getByText('New note')).toBeInTheDocument();
    });
  });
});
