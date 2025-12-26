import { format } from 'date-fns';
import { formatMoney } from '@/lib/money';
import { CategoryIcon } from '@/components/features/bills/CategoryIcon';
import type { PaymentWithBill } from '@/lib/types';

interface MonthlyHistoryRowProps {
  payment: PaymentWithBill;
  currency: string;
  locale: string;
}

/**
 * MonthlyHistoryRow
 *
 * Individual payment row for monthly history view.
 * Displays category icon, bill name, amount, and payment date.
 *
 * Render Mode: Server Component (no hooks, pure presentation)
 */
export function MonthlyHistoryRow({
  payment,
  currency,
  locale,
}: MonthlyHistoryRowProps) {
  return (
    <tr>
      <td className="w-10 text-center">
        <CategoryIcon icon={payment.categoryIcon} size={16} className="text-muted-foreground" />
      </td>
      <td>
        <span className="font-medium">{payment.billTitle}</span>
      </td>
      <td className="text-right">
        <span className="font-mono font-medium">
          {formatMoney(payment.amount, currency, locale)}
        </span>
      </td>
      <td className="text-right">
        <span>{format(payment.paidAt, 'd MMMM yyyy')}</span>
      </td>
    </tr>
  );
}

