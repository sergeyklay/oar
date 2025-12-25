import { format, parse } from 'date-fns';
import { ForecastRow } from './ForecastRow';
import { cn } from '@/lib/utils';
import type { ForecastBill } from '@/lib/services/ForecastService';

interface ForecastListProps {
  bills: ForecastBill[];
  currency: string;
  locale: string;
  showAmortization: boolean;
  showEstimates: boolean;
  month: string;
  tag?: string | null;
}

/**
 * ForecastList
 *
 * Table/list of bills for forecast view.
 *
 * Render Mode: Server Component (no hooks, receives data via props)
 */
export function ForecastList({
  bills,
  currency,
  locale,
  showAmortization,
  showEstimates,
  month,
  tag,
}: ForecastListProps) {
  if (bills.length === 0) {
    const monthDate = parse(month, 'yyyy-MM', new Date());
    const monthFormatted = format(monthDate, 'MMMM yyyy');
    const emptyMessage = tag
      ? `No bills with this tag in ${monthFormatted}`
      : `No bills due in ${monthFormatted}`;
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
    <table className="bill-table forecast-table">
      <thead>
        <tr>
          <th className="w-10" aria-hidden="true" />
          <th>Name</th>
          <th className="text-right">Amount Due</th>
          <th className={cn(showAmortization ? 'text-right' : 'hidden')}>Amount to Save</th>
          <th className="text-right">Due Date</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <ForecastRow
            key={bill.id}
            bill={bill}
            currency={currency}
            locale={locale}
            showAmortization={showAmortization}
            showEstimates={showEstimates}
          />
        ))}
      </tbody>
    </table>
  );
}

