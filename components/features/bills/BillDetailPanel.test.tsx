import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useQueryState } from 'nuqs';
import { BillDetailPanel } from './BillDetailPanel';
import type { BillWithTags } from '@/lib/types';
import { skipPayment, archiveBill, deleteBill } from '@/actions/bills';
import { toast } from 'sonner';

jest.mock('nuqs', () => ({
  useQueryState: jest.fn(() => [null, jest.fn()]),
  parseAsString: {
    withOptions: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@/actions/bills', () => ({
  skipPayment: jest.fn(),
  archiveBill: jest.fn(),
  deleteBill: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('./LogPaymentDialog', () => ({
  LogPaymentDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div role="dialog">
        Mock Log Payment Dialog
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
      </div>
    ) : null,
}));

jest.mock('./BillFormDialog', () => ({
  BillFormDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div role="dialog">
        Mock Bill Form Dialog
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
      </div>
    ) : null,
}));

jest.mock('./CloseDetailButton', () => ({
  CloseDetailButton: () => <button aria-label="close">Close</button>,
}));

jest.mock('./PaymentHistorySection', () => ({
  PaymentHistorySection: () => (
    <div data-testid="payment-history-section">Payment History Section</div>
  ),
}));

const createMockBill = (overrides: Partial<BillWithTags> = {}): BillWithTags => ({
  id: 'bill-1',
  title: 'Electric Bill',
  amount: 15000,
  amountDue: 10000,
  dueDate: new Date('2025-12-15'),
  endDate: null,
  frequency: 'monthly',
  isAutoPay: false,
  isVariable: false,
  status: 'pending',
  isArchived: false,
  notes: null,
  categoryId: 'category-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  categoryIcon: 'zap',
  ...overrides,
});

describe('BillDetailPanel', () => {
  describe('header display', () => {
    it('displays bill title', () => {
      const bill = createMockBill({ title: 'Internet Service' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    it('uses status-colored background in header', () => {
      const bill = createMockBill({ status: 'overdue', dueDate: new Date('2025-01-01') });
      const { container } = render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      const header = container.querySelector('div.-mt-4.-mx-4');
      expect(header).toHaveClass('bg-red-500');
    });
  });

  describe('bill status and details block', () => {
    it('displays relative status text (Line 1)', () => {
      // Mocking today as Dec 1, 2025 for this test
      jest.useFakeTimers().setSystemTime(new Date('2025-12-01'));
      const bill = createMockBill({ dueDate: new Date('2025-12-15'), status: 'pending' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Due in 2 weeks')).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('displays formatted full date (Line 2)', () => {
      const bill = createMockBill({ dueDate: new Date('2025-12-15') });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Monday, 15 December 2025')).toBeInTheDocument();
    });

    it('displays formatted amount (Line 3)', () => {
      const bill = createMockBill({ amount: 9999, amountDue: 9999 });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('displays partial payment format when amountDue < amount', () => {
      const bill = createMockBill({ amount: 15000, amountDue: 10000 });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$150\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\(\$150\.00\)/)).toBeInTheDocument();
    });

    it('colors amount red if overdue', () => {
      const bill = createMockBill({ status: 'overdue', amount: 10000, amountDue: 10000 });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      const amount = screen.getByText('$100.00');
      expect(amount).toHaveClass('text-red-500');
    });

    it('displays variable amount note when isVariable is true', () => {
      const bill = createMockBill({ isVariable: true });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText(/variable amount/i)).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('opens log payment dialog when clicking Log Payment', () => {
      const bill = createMockBill();
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      fireEvent.click(screen.getByRole('button', { name: /log payment/i }));

      expect(screen.getByText('Mock Log Payment Dialog')).toBeInTheDocument();
    });

    it('calls skipPayment action and shows toast when clicking Skip', async () => {
      const bill = createMockBill({ title: 'Skip Me' });
      (skipPayment as jest.Mock).mockResolvedValue({ success: true });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      fireEvent.click(screen.getByRole('button', { name: /^skip$/i }));

      expect(skipPayment).toHaveBeenCalledWith({ billId: bill.id });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Payment skipped for "Skip Me"');
      });
    });

    it('disables skip button for one-time bills', () => {
      const bill = createMockBill({ frequency: 'once' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByRole('button', { name: /^skip$/i })).toBeDisabled();
    });

    it('disables both buttons when bill is paid', () => {
      const bill = createMockBill({ status: 'paid' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByRole('button', { name: /log payment/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^skip$/i })).toBeDisabled();
    });

    it('calls archiveBill action and clears selection when clicking Archive', async () => {
      const mockSetSelectedBill = jest.fn();
      (useQueryState as jest.Mock).mockReturnValue([null, mockSetSelectedBill]);
      (archiveBill as jest.Mock).mockResolvedValue({ success: true });

      const bill = createMockBill({ title: 'Archive Me' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      fireEvent.click(screen.getByRole('button', { name: /archive/i }));

      expect(archiveBill).toHaveBeenCalledWith(bill.id, true);
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Bill archived', expect.any(Object));
        expect(mockSetSelectedBill).toHaveBeenCalledWith(null);
      });
    });

    it('opens edit dialog when clicking Edit', () => {
      const bill = createMockBill();
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.getByText('Mock Bill Form Dialog')).toBeInTheDocument();
    });

    it('calls deleteBill action and clears selection after confirmation', async () => {
      const mockSetSelectedBill = jest.fn();
      (useQueryState as jest.Mock).mockReturnValue([null, mockSetSelectedBill]);
      (deleteBill as jest.Mock).mockResolvedValue({ success: true });

      const bill = createMockBill({ title: 'Delete Me' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      // Click Delete to open confirmation
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      // Click Delete in confirmation dialog
      fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(deleteBill).toHaveBeenCalledWith(bill.id);
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Bill deleted', expect.any(Object));
        expect(mockSetSelectedBill).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('notes display', () => {
    it('displays notes with whitespace preservation', () => {
      const bill = createMockBill({
        notes: 'Account: 123\nNotes: Pay fast',
      });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      const notesElement = screen.getByText(/Account: 123/);
      expect(notesElement).toHaveTextContent(/Notes: Pay fast/);
      expect(notesElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('tags display', () => {
    it('displays tags when present', () => {
      const bill = createMockBill({
        tags: [
          { id: 'tag-1', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
        ],
      });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
    });
  });

  describe('removed elements verification', () => {
    it('does not display removed blocks', () => {
      const bill = createMockBill();
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.queryByText('Due Date')).not.toBeInTheDocument();
      expect(screen.queryByText('Repeat Interval')).not.toBeInTheDocument();
      expect(screen.queryByText('Payment')).not.toBeInTheDocument();
      expect(screen.queryByText('Remaining This Cycle')).not.toBeInTheDocument();
    });
  });
});
