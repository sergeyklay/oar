import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogPaymentDialog } from './LogPaymentDialog';
import type { Bill } from '@/lib/types';

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PointerEvent for Radix UI components
if (!global.PointerEvent) {
  (global as unknown as Record<string, unknown>).PointerEvent = class PointerEvent extends Event {
    constructor(type: string, params: Record<string, unknown> = {}) {
      super(type, params);
    }
  };
}

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

describe('LogPaymentDialog', () => {
  const setup = (props = {}, userEventOptions = {}) => {
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
    return { ...utils, user, onOpenChange };
  };

  it('initializes with default values from bill', () => {
    setup();

    // amount: 5000 cents -> 50
    expect(screen.getByLabelText(/amount/i)).toHaveValue('50');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('');
    expect(screen.getByLabelText(/update due date/i)).toBeChecked();
  });

  it('resets form values when reopened', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-01T10:00:00Z'));
    const { user, rerender } = setup({}, { advanceTimers: jest.advanceTimersByTime });

    // 1. Change some values
    const amountInput = screen.getByLabelText(/amount/i);
    const notesInput = screen.getByLabelText(/notes/i);

    await user.clear(amountInput);
    await user.type(amountInput, '75.00');
    await user.type(notesInput, 'Custom note');

    expect(amountInput).toHaveValue('75.00');
    expect(notesInput).toHaveValue('Custom note');

    // 2. Simulate closing the dialog
    rerender(
      <LogPaymentDialog
        bill={mockBill}
        open={false}
        onOpenChange={jest.fn()}
        currency="USD"
      />
    );

    // 3. Move time forward and reopen
    jest.advanceTimersByTime(1000 * 60 * 60); // 1 hour later
    rerender(
      <LogPaymentDialog
        bill={mockBill}
        open={true}
        onOpenChange={jest.fn()}
        currency="USD"
      />
    );

    // 4. Verify values are reset to defaults
    expect(screen.getByLabelText(/amount/i)).toHaveValue('50');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('');
    expect(screen.getByLabelText(/update due date/i)).toBeChecked();
    // Verify date is displayed correctly
    expect(screen.getByText(/december 1st, 2025/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('does not update defaults when bill prop changes while already open', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-01T10:00:00Z'));
    const { user, rerender } = setup({}, { advanceTimers: jest.advanceTimersByTime });

    // Change input to show it persists
    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'User typing...');

    // Move time forward
    jest.advanceTimersByTime(1000 * 60 * 60); // 1 hour later

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

    // Should still have the initial bill's amount and user's typing
    expect(screen.getByLabelText(/amount/i)).toHaveValue('50');
    expect(notesInput).toHaveValue('User typing...');
    // Should still have the OLD date
    expect(screen.getByText(/december 1st, 2025/i)).toBeInTheDocument();

    jest.useRealTimers();
  });
});

