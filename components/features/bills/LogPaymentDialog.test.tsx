import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogPaymentDialog } from './LogPaymentDialog';
import { logPayment } from '@/actions/transactions';
import type { Bill } from '@/lib/types';

jest.mock('@/actions/transactions', () => ({
  logPayment: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockBill: Bill = {
  id: 'bill-1',
  title: 'Internet',
  amount: 5000,
  amountDue: 5000,
  dueDate: new Date('2025-12-01'),
  frequency: 'monthly',
  isAutoPay: false,
  isVariable: false,
  status: 'pending',
  isArchived: false,
  notes: 'Original note',
  categoryId: 'cat-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface SetupOptions {
  props?: Partial<React.ComponentProps<typeof LogPaymentDialog>>;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
}

describe('LogPaymentDialog', () => {
  const setup = ({ props = {}, userEventOptions = {} }: SetupOptions = {}) => {
    const user = userEvent.setup(userEventOptions);
    const onOpenChange = jest.fn();

    const utils = render(
      <LogPaymentDialog
        bill={mockBill}
        open={true}
        onOpenChange={onOpenChange}
        currency="USD"
        {...props}
      />
    );

    return { ...utils, user, onOpenChange } as const;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values from bill', () => {
      setup();

      expect(screen.getByLabelText(/amount/i)).toHaveValue('50');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('');
      expect(screen.getByLabelText(/update due date/i)).toBeChecked();
    });
  });

  describe('payment submission', () => {
    it('calls onPaymentLogged callback after successful payment', async () => {
      (logPayment as jest.Mock).mockResolvedValue({
        success: true,
        data: { transactionId: 'tx-1', isHistorical: false },
      });
      const onPaymentLogged = jest.fn();
      setup({ props: { onPaymentLogged } });

      const form = screen.getByRole('dialog').querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(logPayment).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(onPaymentLogged).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onPaymentLogged callback when payment fails', async () => {
      (logPayment as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Payment failed',
      });
      const onPaymentLogged = jest.fn();
      setup({ props: { onPaymentLogged } });

      const form = screen.getByRole('dialog').querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(logPayment).toHaveBeenCalled();
      });
      expect(onPaymentLogged).not.toHaveBeenCalled();
    });
  });

  describe('form reset logic', () => {
    it('resets form values when reopened', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-01T10:00:00Z'));
      const { user, rerender } = setup({
        userEventOptions: { advanceTimers: jest.advanceTimersByTime },
      });

      const amountInput = screen.getByLabelText(/amount/i);
      const notesInput = screen.getByLabelText(/notes/i);

      await user.clear(amountInput);
      await user.type(amountInput, '75.00');
      await user.type(notesInput, 'Custom note');

      rerender(
        <LogPaymentDialog
          bill={mockBill}
          open={false}
          onOpenChange={jest.fn()}
          currency="USD"
        />
      );

      jest.advanceTimersByTime(1000 * 60 * 60);

      rerender(
        <LogPaymentDialog
          bill={mockBill}
          open={true}
          onOpenChange={jest.fn()}
          currency="USD"
        />
      );

      expect(screen.getByLabelText(/amount/i)).toHaveValue('50');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('');
      expect(screen.getByLabelText(/update due date/i)).toBeChecked();
      expect(screen.getByText(/december 1st, 2025/i)).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('does not update defaults when bill prop changes while already open', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-01T10:00:00Z'));
      const { user, rerender } = setup({
        userEventOptions: { advanceTimers: jest.advanceTimersByTime },
      });

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'User typing...');

      jest.advanceTimersByTime(1000 * 60 * 60);

      const differentBill: Bill = {
        ...mockBill,
        id: 'bill-2',
        amountDue: 12000,
      };

      rerender(
        <LogPaymentDialog
          bill={differentBill}
          open={true}
          onOpenChange={jest.fn()}
          currency="USD"
        />
      );

      expect(screen.getByLabelText(/amount/i)).toHaveValue('50');
      expect(notesInput).toHaveValue('User typing...');
      expect(screen.getByText(/december 1st, 2025/i)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});




