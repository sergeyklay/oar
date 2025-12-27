import { AnnualSpendingChart } from './AnnualSpendingChart';
import type { AggregatedBillSpending } from '@/lib/types';

interface AnnualSpendingGraphProps {
  data: AggregatedBillSpending[];
  currency: string;
  locale: string;
  highlightedBillId?: string;
  onBillClick?: (billId: string) => void;
}

/**
 * AnnualSpendingGraph
 *
 * Server Component that renders the annual spending pie chart.
 * Receives aggregated data and passes it to the client chart component.
 *
 * Render Mode: Server Component (renders chart, receives data as props)
 */
export function AnnualSpendingGraph({
  data,
  currency,
  locale,
  highlightedBillId,
  onBillClick,
}: AnnualSpendingGraphProps) {
  return (
    <div className="bg-card border border-border">
      <AnnualSpendingChart
        data={data}
        currency={currency}
        locale={locale}
        highlightedBillId={highlightedBillId}
        onBillClick={onBillClick}
      />
    </div>
  );
}

