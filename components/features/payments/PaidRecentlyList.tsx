import { format } from 'date-fns';
import { formatMoney } from '@/lib/money';
import type { PaymentWithBill } from '@/lib/types';

interface PaidRecentlyListProps {
  payments: PaymentWithBill[];
  currency: string;
  locale: string;
}

export function PaidRecentlyList({
  payments,
  currency,
  locale,
}: PaidRecentlyListProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          No payments in this time range.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Payments will appear here when you log them on your bills.
        </p>
      </div>
    );
  }

  return (
    <table className="bill-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Amount Paid</th>
          <th>Payment Date</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td className="font-medium">{payment.billTitle}</td>
            <td>{formatMoney(payment.amount, currency, locale)}</td>
            <td>
              <div className="flex flex-col">
                <span>{format(payment.paidAt, 'EEE, MMM d')}</span>
                {payment.notes && (
                  <span className="text-xs text-muted-foreground">
                    {payment.notes}
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

