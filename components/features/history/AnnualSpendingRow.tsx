import { formatMoney } from '@/lib/money';
import { CategoryIcon } from '@/components/features/bills/CategoryIcon';
import { cn } from '@/lib/utils';
import type { AggregatedBillSpending } from '@/lib/types';

interface AnnualSpendingRowProps {
  bill: AggregatedBillSpending;
  currency: string;
  locale: string;
  isHighlighted: boolean;
  onClick?: () => void;
}

/**
 * AnnualSpendingRow
 *
 * Individual bill row for annual spending view.
 * Displays category icon, bill name, payment count, average payment, and total amount.
 *
 * Render Mode: Server Component (no hooks, pure presentation)
 */
export function AnnualSpendingRow({
  bill,
  currency,
  locale,
  isHighlighted,
  onClick,
}: AnnualSpendingRowProps) {
  return (
    <tr
      className={cn(isHighlighted && 'bg-accent')}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <td className="w-10 text-center">
        <CategoryIcon icon={bill.categoryIcon} size={16} className="text-muted-foreground" />
      </td>
      <td>
        <span className="font-medium">{bill.billTitle}</span>
      </td>
      <td className="text-right">
        <span className="font-mono font-medium">{bill.paymentCount}</span>
      </td>
      <td className="text-right">
        <span className="font-mono font-medium">
          {formatMoney(bill.averageAmount, currency, locale)}
        </span>
      </td>
      <td className="text-right">
        <span className="font-mono font-medium">
          {formatMoney(bill.totalAmount, currency, locale)}
        </span>
      </td>
    </tr>
  );
}

