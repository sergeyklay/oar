'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatMoney, getCurrencySymbol } from '@/lib/money';
import { BillStatusBadge } from './BillStatusBadge';
import { BillActionsMenu } from './BillActionsMenu';
import { BillFormDialog } from './BillFormDialog';
import { CategoryIcon } from './CategoryIcon';
import { LogPaymentDialog } from './LogPaymentDialog';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import type { BillWithTags, Tag, BillCategoryGroupWithCategories } from '@/lib/types';

interface BillRowProps {
  bill: BillWithTags;
  currency: string;
  locale: string;
  /** All available tags for the edit dialog */
  availableTags?: Tag[];
  /** Category groups with nested categories for dropdown */
  categoriesGrouped: BillCategoryGroupWithCategories[];
  /** Default category ID for new bills (null if no categories exist) */
  defaultCategoryId: string | null;
}

/**
 * Bill row content (td elements only).
 * The <tr> wrapper is provided by BillRowClickable.
 * Tags are NOT displayed here per guide requirement.
 */
export function BillRow({
  bill,
  currency,
  locale,
  availableTags = [],
  categoriesGrouped,
  defaultCategoryId,
}: BillRowProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isPaid = bill.status === 'paid';
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <>
      <td className="w-10 text-center">
        <CategoryIcon icon={bill.categoryIcon} size={16} className="text-muted-foreground" />
      </td>
      <td className="font-medium">{bill.title}</td>
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
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
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
          categoriesGrouped={categoriesGrouped}
          defaultCategoryId={defaultCategoryId}
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
    </>
  );
}
