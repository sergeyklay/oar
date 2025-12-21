import { render, screen } from '@testing-library/react';
import { BillRow } from './BillRow';
import type { BillWithTags, BillFrequency } from '@/lib/types';

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
  notes: null,
  categoryId: 'category-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  categoryIcon: 'house',
  ...overrides,
});

const renderBillRow = (bill: BillWithTags) => {
  return render(
    <table>
      <tbody>
        <tr>
          <BillRow
            bill={bill}
            currency="USD"
            locale="en-US"
          />
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

    it('displays bill frequency as human-readable label', () => {
      const bill = createMockBill({ frequency: 'yearly' });

      renderBillRow(bill);

      expect(screen.getByText('Every year')).toBeInTheDocument();
    });

    it('displays correct human-readable label for all frequency types', () => {
      const frequencies: Array<{ freq: BillFrequency; expected: string }> = [
        { freq: 'weekly', expected: 'Every week' },
        { freq: 'biweekly', expected: 'Every 2 weeks' },
        { freq: 'twicemonthly', expected: 'Twice per month' },
        { freq: 'monthly', expected: 'Every month' },
        { freq: 'bimonthly', expected: 'Every 2 months' },
        { freq: 'quarterly', expected: 'Every 3 months' },
        { freq: 'yearly', expected: 'Every year' },
        { freq: 'once', expected: 'Never' },
      ];

      for (const { freq, expected } of frequencies) {
        const bill = createMockBill({ frequency: freq });
        const { unmount } = renderBillRow(bill);
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      }
    });

    it('does not display tags in row (tags shown in detail panel only)', () => {
      const bill = createMockBill({
        tags: [
          { id: 'tag-1', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
        ],
      });

      renderBillRow(bill);

      expect(screen.queryByText('Utilities')).not.toBeInTheDocument();
    });
  });

  describe('paid status display', () => {
    it('hides secondary due date for paid one-time bills', () => {
      const paidOneTimeBill = createMockBill({
        status: 'paid',
        frequency: 'once',
        dueDate: new Date('2025-12-15'),
      });

      renderBillRow(paidOneTimeBill);

      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.queryByText('Mon, Dec 15')).not.toBeInTheDocument();
    });

    it('shows secondary due date for unpaid one-time bills', () => {
      const pendingOneTimeBill = createMockBill({
        status: 'pending',
        frequency: 'once',
        dueDate: new Date('2025-12-15'),
      });

      renderBillRow(pendingOneTimeBill);

      expect(screen.getByText('Mon, Dec 15')).toBeInTheDocument();
    });

    it('shows secondary due date for recurring bills regardless of status', () => {
      const monthlyBill = createMockBill({
        status: 'pending',
        frequency: 'monthly',
        dueDate: new Date('2025-12-15'),
      });

      renderBillRow(monthlyBill);

      expect(screen.getByText('Mon, Dec 15')).toBeInTheDocument();
    });
  });

  describe('removed elements', () => {
    it('does not render Log Payment button directly in the row', () => {
      const bill = createMockBill({ status: 'pending' });

      renderBillRow(bill);

      expect(screen.queryByRole('button', { name: /log payment/i })).not.toBeInTheDocument();
    });
  });
});
