import { render, screen } from '@testing-library/react';
import { BillDetailPanel } from './BillDetailPanel';
import type { BillWithTags } from '@/lib/types';

jest.mock('./BillStatusBadge', () => ({
  BillStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

jest.mock('./CloseDetailButton', () => ({
  CloseDetailButton: () => <button>Close</button>,
}));

const createMockBill = (overrides: Partial<BillWithTags> = {}): BillWithTags => ({
  id: 'bill-1',
  title: 'Electric Bill',
  amount: 15000,
  amountDue: 10000,
  dueDate: new Date('2025-12-15'),
  frequency: 'monthly',
  isAutoPay: false,
  isVariable: false,
  status: 'pending',
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  ...overrides,
});

describe('BillDetailPanel', () => {
  describe('bill information display', () => {
    it('displays bill title', () => {
      const bill = createMockBill({ title: 'Internet Service' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    it('displays formatted amount', () => {
      const bill = createMockBill({ amount: 9999 });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('displays formatted due date', () => {
      const bill = createMockBill({ dueDate: new Date('2025-12-25') });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('December 25, 2025')).toBeInTheDocument();
    });

    it('displays frequency label for monthly', () => {
      const bill = createMockBill({ frequency: 'monthly' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('displays frequency label for yearly', () => {
      const bill = createMockBill({ frequency: 'yearly' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Yearly')).toBeInTheDocument();
    });

    it('displays frequency label for one-time', () => {
      const bill = createMockBill({ frequency: 'once' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('One-time')).toBeInTheDocument();
    });

    it('displays remaining amount due', () => {
      const bill = createMockBill({ amountDue: 5000 });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });
  });

  describe('variable amount indicator', () => {
    it('displays variable amount note when isVariable is true', () => {
      const bill = createMockBill({ isVariable: true });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText(/variable amount/i)).toBeInTheDocument();
    });

    it('does not display variable note when isVariable is false', () => {
      const bill = createMockBill({ isVariable: false });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.queryByText(/variable amount/i)).not.toBeInTheDocument();
    });
  });

  describe('auto-pay indicator', () => {
    it('displays auto-pay section when isAutoPay is true', () => {
      const bill = createMockBill({ isAutoPay: true });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Auto-Pay Enabled')).toBeInTheDocument();
    });

    it('does not display auto-pay section when isAutoPay is false', () => {
      const bill = createMockBill({ isAutoPay: false });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.queryByText('Auto-Pay Enabled')).not.toBeInTheDocument();
    });
  });

  describe('tags display (at bottom per guide requirement)', () => {
    it('displays tags when present', () => {
      const bill = createMockBill({
        tags: [
          { id: 'tag-1', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
          { id: 'tag-2', name: 'Business', slug: 'business', createdAt: new Date() },
        ],
      });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Utilities')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
    });

    it('displays tags section label when tags exist', () => {
      const bill = createMockBill({
        tags: [{ id: 'tag-1', name: 'Personal', slug: 'personal', createdAt: new Date() }],
      });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('does not display tags section when no tags', () => {
      const bill = createMockBill({ tags: [] });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it('displays status badge component', () => {
      const bill = createMockBill({ status: 'overdue' });
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByTestId('status-badge')).toHaveTextContent('overdue');
    });
  });

  describe('close button', () => {
    it('renders close button', () => {
      const bill = createMockBill();
      render(<BillDetailPanel bill={bill} currency="USD" locale="en-US" />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });
});

