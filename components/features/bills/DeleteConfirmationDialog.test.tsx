import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import type { Transaction } from '@/lib/types';

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  billId: 'bill-1',
  amount: 16420,
  paidAt: new Date('2025-06-20'),
  notes: 'Test note',
  createdAt: new Date(),
  ...overrides,
});

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    transaction: createMockTransaction(),
    currency: 'USD',
    locale: 'en-US',
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays dialog title when open', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);

    expect(screen.getByText('Delete Payment Record')).toBeInTheDocument();
  });

  it('displays warning about cycle recalculation', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);

    expect(
      screen.getByText(/This will recalculate the billing cycle/i)
    ).toBeInTheDocument();
  });

  it('shows Cancel and Delete buttons', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<DeleteConfirmationDialog {...defaultProps} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onConfirm when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onConfirm).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    render(<DeleteConfirmationDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Delete Payment Record')).not.toBeInTheDocument();
  });
});
