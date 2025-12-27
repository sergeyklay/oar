import { AnnualSpendingRow } from './AnnualSpendingRow';
import type { AggregatedBillSpending } from '@/lib/types';

interface AnnualSpendingListProps {
  bills: AggregatedBillSpending[];
  currency: string;
  locale: string;
  year: string;
  highlightedBillId?: string;
  onBillClick?: (billId: string) => void;
}

/**
 * AnnualSpendingList
 *
 * Table/list of bills with aggregated spending data for annual spending view.
 *
 * Render Mode: Server Component (no hooks, receives data via props)
 */
export function AnnualSpendingList({
  bills,
  currency,
  locale,
  year,
  highlightedBillId,
  onBillClick,
}: AnnualSpendingListProps) {
  if (bills.length === 0) {
    const emptyMessage = `No payments in ${year}`;
    const emptySubtitle = 'Try selecting a different year.';

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
          <th>Name</th>
          <th className="text-right">Payments</th>
          <th className="text-right">Average</th>
          <th className="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <AnnualSpendingRow
            key={bill.billId}
            bill={bill}
            currency={currency}
            locale={locale}
            isHighlighted={bill.billId === highlightedBillId}
            onClick={onBillClick ? () => onBillClick(bill.billId) : undefined}
          />
        ))}
      </tbody>
    </table>
  );
}

