import { formatMoney } from '@/lib/money';
import { FREQUENCY_DISPLAY_LABELS, PAYMENT_MODE_LABELS } from '@/lib/constants';
import { CategoryIcon } from '@/components/features/bills/CategoryIcon';
import { ClientDate } from '@/components/ui/client-date';
import { cn } from '@/lib/utils';
import type { ForecastBill } from '@/lib/services/ForecastService';

interface ForecastRowProps {
  bill: ForecastBill;
  currency: string;
  locale: string;
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
      <td className="text-right">
        <div className="flex flex-col items-end">
          <span
            className={cn(
              'font-mono',
              bill.isEstimated && 'text-muted-foreground'
            )}
          >
            {formatMoney(bill.displayAmount, currency, locale)}
          </span>
          {bill.isEstimated && (
            <span className="text-xs text-muted-foreground">(estimate)</span>
          )}
        </div>
      </td>
      <td className="text-right">
        {bill.amortizationAmount !== null ? (
          <span className="font-mono text-muted-foreground">
            {formatMoney(bill.amortizationAmount, currency, locale)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="text-right">
        <div className="flex flex-col items-end">
          <ClientDate date={bill.dueDate} format="EEE, MMM d" />
          <span className="text-xs text-muted-foreground">
            <ClientDate date={bill.dueDate} format="MMM d, yyyy" />
          </span>
        </div>
      </td>
    </tr>
  );
}

