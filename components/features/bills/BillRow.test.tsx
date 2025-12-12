import { render, screen } from '@testing-library/react';
import { BillRow } from './BillRow';
import type { BillWithTags } from '@/db/schema';

jest.mock('./BillStatusBadge', () => ({
  BillStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

jest.mock('./BillActionsMenu', () => ({
  BillActionsMenu: () => <button>Actions</button>,
}));

jest.mock('./BillFormDialog', () => ({
  BillFormDialog: () => null,
}));

jest.mock('./LogPaymentDialog', () => ({
  LogPaymentDialog: () => null,
}));

jest.mock('./PaymentHistoryDialog', () => ({
  PaymentHistoryDialog: () => null,
}));

const createMockBill = (overrides: Partial<BillWithTags> = {}): BillWithTags => ({
  id: 'bill-1',
  title: 'Test Bill',
  amount: 15000,
  amountDue: 15000,
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

const renderBillRow = (bill: BillWithTags) => {
  return render(
    <table>
      <tbody>
        <tr>
          <BillRow bill={bill} currency="USD" locale="en-US" />
        </tr>
      </tbody>
    </table>
  );
};

describe('BillRow', () => {
  describe('isVariable display', () => {
    it('displays (estimate) suffix when bill is variable', () => {
      const variableBill = createMockBill({ isVariable: true, amount: 15000 });

      renderBillRow(variableBill);

      expect(screen.getByText('(estimate)')).toBeInTheDocument();
    });

    it('does not display (estimate) suffix when bill is fixed', () => {
      const fixedBill = createMockBill({ isVariable: false, amount: 15000 });

      renderBillRow(fixedBill);

      expect(screen.queryByText('(estimate)')).not.toBeInTheDocument();
    });

    it('displays formatted amount for variable bill', () => {
      const variableBill = createMockBill({ isVariable: true, amount: 15000 });

      renderBillRow(variableBill);

      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('displays formatted amount for fixed bill', () => {
      const fixedBill = createMockBill({ isVariable: false, amount: 150000 });

      renderBillRow(fixedBill);

      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    });
  });

  describe('bill information display', () => {
    it('displays bill title', () => {
      const bill = createMockBill({ title: 'Electric Bill' });

      renderBillRow(bill);

      expect(screen.getByText('Electric Bill')).toBeInTheDocument();
    });

    it('displays bill frequency', () => {
      const bill = createMockBill({ frequency: 'yearly' });

      renderBillRow(bill);

      expect(screen.getByText('yearly')).toBeInTheDocument();
    });

    it('does not display tags in row (tags shown in detail panel only)', () => {
      const bill = createMockBill({
        tags: [
          { id: 'tag-1', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
        ],
      });

      renderBillRow(bill);

      // Tags should NOT appear in the row - they're displayed in the detail panel
      expect(screen.queryByText('Utilities')).not.toBeInTheDocument();
    });
  });
});

