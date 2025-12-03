'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { BillStatusBadge } from './BillStatusBadge';
import { BillActionsMenu } from './BillActionsMenu';
import { LogPaymentDialog } from './LogPaymentDialog';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import type { Bill } from '@/db/schema';

interface BillRowProps {
  bill: Bill;
  currency: string;
  locale: string;
}

export function BillRow({ bill, currency, locale }: BillRowProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const isPaid = bill.status === 'paid';

  return (
    <tr>
      <td className="font-medium">{bill.title}</td>
      <td className="font-mono">{formatMoney(bill.amount, currency, locale)}</td>
      <td className="text-muted-foreground">
        {bill.dueDate.toLocaleDateString(locale)}
      </td>
      <td className="capitalize text-muted-foreground">{bill.frequency}</td>
      <td>
        <BillStatusBadge status={bill.status} />
      </td>
      <td>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPayDialogOpen(true)}
            disabled={isPaid}
            title={isPaid ? 'Already paid' : 'Log payment'}
          >
            <Banknote className="h-4 w-4" />
            <span className="sr-only">Log payment</span>
          </Button>

          <BillActionsMenu
            bill={bill}
            onViewHistory={() => setHistoryDialogOpen(true)}
          />
        </div>

        <LogPaymentDialog
          bill={bill}
          open={payDialogOpen}
          onOpenChange={setPayDialogOpen}
          currency={currency}
        />

        <PaymentHistoryDialog
          billId={bill.id}
          billTitle={bill.title}
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          currency={currency}
          locale={locale}
        />
      </td>
    </tr>
  );
}
