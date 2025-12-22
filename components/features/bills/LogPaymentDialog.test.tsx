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
  const setup = (props = {}) => {
    const user = userEvent.setup();
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
    const { user, rerender } = setup();

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

    // 3. Simulate reopening the dialog
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
  });

  it('updates defaults when bill prop changes while open', () => {
    const { rerender } = setup();

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

    expect(screen.getByLabelText(/amount/i)).toHaveValue('120');
  });
});

