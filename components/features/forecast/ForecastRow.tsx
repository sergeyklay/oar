import { format } from 'date-fns';
import { formatMoney } from '@/lib/money';
import { FREQUENCY_DISPLAY_LABELS, PAYMENT_MODE_LABELS } from '@/lib/constants';
import { CategoryIcon } from '@/components/features/bills/CategoryIcon';
import { cn } from '@/lib/utils';
import type { ForecastBill } from '@/lib/services/ForecastService';

interface ForecastRowProps {
  bill: ForecastBill;
  currency: string;
  locale: string;
  showAmortization: boolean;
  showEstimates: boolean;
}

/**
 * ForecastRow
 *
 * Individual bill row for forecast view.
 * Displays due date, bill name, frequency label, amount due, and optionally "Amount to Save".
 *
 * Render Mode: Server Component (no hooks, pure presentation)
 */
export function ForecastRow({
  bill,
  currency,
  locale,
  showAmortization,
  showEstimates,
}: ForecastRowProps) {
  return (
    <tr>
      <td className="w-10 text-center">
        <CategoryIcon icon={bill.categoryIcon} size={16} className="text-muted-foreground" />
      </td>
      <td>
        <div className="flex flex-col">
          <span className="font-medium">{bill.title}</span>
          <span className="text-xs text-muted-foreground">
            {FREQUENCY_DISPLAY_LABELS[bill.frequency]} • {bill.isAutoPay ? PAYMENT_MODE_LABELS.auto : PAYMENT_MODE_LABELS.manual}
          </span>
        </div>
      </td>
      <td>
        <div className="flex flex-col">
          <span
            className={cn(
              'font-mono',
              bill.isEstimated && showEstimates && 'text-muted-foreground italic'
            )}
          >
            {formatMoney(bill.displayAmount, currency, locale)}
          </span>
          {bill.isEstimated && showEstimates && (
            <span className="text-xs text-muted-foreground">(estimate)</span>
          )}
        </div>
      </td>
      <td className={showAmortization ? '' : 'hidden'}>
        {bill.amortizationAmount !== null ? (
          <span className="font-mono text-muted-foreground">
            {formatMoney(bill.amortizationAmount, currency, locale)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td>
        <div className="flex flex-col">
          <span>{format(bill.dueDate, 'EEE, MMM d')}</span>
          <span className="text-xs text-muted-foreground">
            {format(bill.dueDate, 'MMM d, yyyy')}
          </span>
        </div>
      </td>
    </tr>
  );
}

