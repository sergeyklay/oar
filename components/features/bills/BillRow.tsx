'use client';

import { useState } from 'react';
import { differenceInDays, format, startOfDay } from 'date-fns';
import { Banknote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatMoney, getCurrencySymbol } from '@/lib/money';
import { FREQUENCY_DISPLAY_LABELS } from '@/lib/constants';
import { DueDateService } from '@/lib/services/DueDateService';
import { BillActionsMenu } from './BillActionsMenu';
import { BillFormDialog } from './BillFormDialog';
import { CategoryIcon } from './CategoryIcon';
import { LogPaymentDialog } from './LogPaymentDialog';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import type { BillWithTags, Tag, BillCategoryGroupWithCategories, BillStatus } from '@/lib/types';

/**
 * Determines the status bar color based on bill status and due date.
 * Bills due more than 30 days away show blue instead of amber.
 */
function getStatusBarColor(status: BillStatus, dueDate: Date): string {
  if (status === 'paid') {
    return 'bg-emerald-500';
  }

  if (status === 'overdue') {
    return 'bg-red-500';
  }

  const today = startOfDay(new Date());
  const target = startOfDay(dueDate);
  const daysUntilDue = differenceInDays(target, today);

  if (daysUntilDue > 30) {
    return 'bg-blue-500';
  }

  return 'bg-amber-500';
}

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
      <td>
        <div className="flex flex-col">
          <span className="font-medium">{bill.title}</span>
          <span className="text-xs text-muted-foreground">
            {FREQUENCY_DISPLAY_LABELS[bill.frequency]}
          </span>
        </div>
      </td>
      <td>
        <div className="flex flex-col">
          <span className="font-mono">{formatMoney(bill.amount, currency, locale)}</span>
          {bill.isVariable && (
            <span className="text-xs text-muted-foreground">(estimate)</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-stretch gap-3">
          <div
            className={cn('w-[3px] self-stretch rounded-sm', getStatusBarColor(bill.status, bill.dueDate))}
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span>{DueDateService.formatRelativeDueDate(bill.dueDate, bill.status)}</span>
            <span className="text-xs text-muted-foreground">
              {format(bill.dueDate, 'EEE, MMM d')}
            </span>
          </div>
        </div>
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
