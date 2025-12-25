import { render, screen } from '@testing-library/react';
import { BillRow } from './BillRow';
import type { BillWithTags, BillFrequency } from '@/lib/types';
import { FREQUENCY_DISPLAY_LABELS, PAYMENT_MODE_LABELS } from '@/lib/constants';

const createMockBill = (overrides: Partial<BillWithTags> = {}): BillWithTags => ({
  id: 'bill-1',
  title: 'Test Bill',
  amount: 15000,
  amountDue: 15000,
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
  categoryIcon: 'house',
  ...overrides,
});

const renderBillRow = (bill: BillWithTags, isArchived?: boolean) => {
  return render(
    <table>
      <tbody>
        <tr>
          <BillRow
            bill={bill}
            currency="USD"
            locale="en-US"
            isArchived={isArchived}
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

    it('displays bill frequency as human-readable label with manual indicator', () => {
      const bill = createMockBill({ frequency: 'yearly', isAutoPay: false });

      renderBillRow(bill);

      expect(screen.getByText(`${FREQUENCY_DISPLAY_LABELS.yearly} • ${PAYMENT_MODE_LABELS.manual}`)).toBeInTheDocument();
    });

    it('displays bill frequency as human-readable label with auto indicator', () => {
      const bill = createMockBill({ frequency: 'yearly', isAutoPay: true });

      renderBillRow(bill);

      expect(screen.getByText(`${FREQUENCY_DISPLAY_LABELS.yearly} • ${PAYMENT_MODE_LABELS.auto}`)).toBeInTheDocument();
    });

    it('displays correct human-readable label for all frequency types', () => {
      const frequencies: Array<{ freq: BillFrequency; expected: string }> = [
        { freq: 'weekly', expected: `${FREQUENCY_DISPLAY_LABELS.weekly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'biweekly', expected: `${FREQUENCY_DISPLAY_LABELS.biweekly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'twicemonthly', expected: `${FREQUENCY_DISPLAY_LABELS.twicemonthly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'monthly', expected: `${FREQUENCY_DISPLAY_LABELS.monthly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'bimonthly', expected: `${FREQUENCY_DISPLAY_LABELS.bimonthly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'quarterly', expected: `${FREQUENCY_DISPLAY_LABELS.quarterly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'yearly', expected: `${FREQUENCY_DISPLAY_LABELS.yearly} • ${PAYMENT_MODE_LABELS.manual}` },
        { freq: 'once', expected: `${FREQUENCY_DISPLAY_LABELS.once} • ${PAYMENT_MODE_LABELS.manual}` },
      ];

      for (const { freq, expected } of frequencies) {
        const bill = createMockBill({ frequency: freq, isAutoPay: false });
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

  describe('archived bill display', () => {
    it('displays "Never" as main text when isArchived is true', () => {
      const archivedBill = createMockBill({ isArchived: true, dueDate: new Date('2025-12-15') });

      renderBillRow(archivedBill, true);

      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.queryByText(/due|overdue|paid/i)).not.toBeInTheDocument();
    });

    it('displays "Archived" as subtitle when isArchived is true', () => {
      const archivedBill = createMockBill({ isArchived: true, dueDate: new Date('2025-12-15') });

      renderBillRow(archivedBill, true);

      expect(screen.getByText('Archived')).toBeInTheDocument();
      expect(screen.queryByText(/Mon, Dec 15/i)).not.toBeInTheDocument();
    });

    it('uses muted status bar color when isArchived is true', () => {
      const archivedBill = createMockBill({ isArchived: true, status: 'overdue' });

      const { container } = renderBillRow(archivedBill, true);

      const statusBar = container.querySelector('.bg-muted');
      expect(statusBar).toBeInTheDocument();
    });

    it('displays normal due date when isArchived is false', () => {
      const activeBill = createMockBill({ isArchived: false, dueDate: new Date('2025-12-15'), status: 'pending' });

      renderBillRow(activeBill, false);

      expect(screen.queryByText('Never')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived')).not.toBeInTheDocument();
      expect(screen.getByText('Mon, Dec 15')).toBeInTheDocument();
    });

    it('displays normal due date when isArchived prop is undefined', () => {
      const activeBill = createMockBill({ isArchived: false, dueDate: new Date('2025-12-15'), status: 'pending' });

      renderBillRow(activeBill);

      expect(screen.queryByText('Never')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived')).not.toBeInTheDocument();
      expect(screen.getByText('Mon, Dec 15')).toBeInTheDocument();
    });
  });
});
