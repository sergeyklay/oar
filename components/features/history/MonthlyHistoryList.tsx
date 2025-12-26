import { format, parse } from 'date-fns';
import { MonthlyHistoryRow } from './MonthlyHistoryRow';
import type { PaymentWithBill } from '@/lib/types';

interface MonthlyHistoryListProps {
  payments: PaymentWithBill[];
  currency: string;
  locale: string;
  month: string;
  tag?: string | null;
}

/**
 * MonthlyHistoryList
 *
 * Table/list of payments for monthly history view.
 *
 * Render Mode: Server Component (no hooks, receives data via props)
 */
export function MonthlyHistoryList({
  payments,
  currency,
  locale,
  month,
  tag,
}: MonthlyHistoryListProps) {
  if (payments.length === 0) {
    const monthDate = parse(month, 'yyyy-MM', new Date());
    const monthFormatted = format(monthDate, 'MMMM yyyy');
    const emptyMessage = tag
      ? `No payments with this tag in ${monthFormatted}`
      : `No payments in ${monthFormatted}`;
    const emptySubtitle = tag
      ? 'Try selecting a different tag or month.'
      : 'Try selecting a different month.';

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <table className="bill-table">
      <thead>
        <tr>
          <th className="w-10" aria-hidden="true" />
          <th>Bill</th>
          <th className="text-right">Amount</th>
          <th className="text-right">Date</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((payment) => (
          <MonthlyHistoryRow
            key={payment.id}
            payment={payment}
            currency={currency}
            locale={locale}
          />
        ))}
      </tbody>
    </table>
  );
}

