'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney, getCurrencySymbol } from '@/lib/money';
import { BillStatusBadge } from './BillStatusBadge';
import { BillActionsMenu } from './BillActionsMenu';
import { BillFormDialog } from './BillFormDialog';
import { LogPaymentDialog } from './LogPaymentDialog';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import type { BillWithTags, Tag } from '@/db/schema';

interface BillRowProps {
  bill: BillWithTags;
  currency: string;
  locale: string;
  /** All available tags for the edit dialog */
  availableTags?: Tag[];
}

export function BillRow({ bill, currency, locale, availableTags = [] }: BillRowProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isPaid = bill.status === 'paid';
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <tr>
      <td className="font-medium">
        <div className="flex flex-col gap-1">
          <span>{bill.title}</span>
          {bill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bill.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="font-mono">
        {formatMoney(bill.amount, currency, locale)}
        {bill.isVariable && (
          <span className="text-muted-foreground ml-1">(estimate)</span>
        )}
      </td>
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
            onEdit={() => setEditDialogOpen(true)}
          />
        </div>

        <BillFormDialog
          bill={bill}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          currencySymbol={currencySymbol}
          availableTags={availableTags}
        />

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
