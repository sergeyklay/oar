'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { FREQUENCY_DISPLAY_LABELS } from '@/lib/constants';
import { DueDateService } from '@/lib/services/DueDateService';
import { BillActionsMenu } from './BillActionsMenu';
import { CategoryIcon } from './CategoryIcon';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import type { BillWithTags } from '@/lib/types';

interface BillRowProps {
  bill: BillWithTags;
  currency: string;
  locale: string;
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
}: BillRowProps) {
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

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
            className={cn('w-[3px] self-stretch rounded-sm', DueDateService.getStatusBarColor(bill.dueDate, bill.status))}
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span>{DueDateService.formatRelativeDueDate(bill.dueDate, bill.status)}</span>
            {!(bill.status === 'paid' && bill.frequency === 'once') && (
              <span className="text-xs text-muted-foreground">
                {format(bill.dueDate, 'EEE, MMM d')}
              </span>
            )}
          </div>
        </div>
      </td>
      <td>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <BillActionsMenu
            onViewHistory={() => setHistoryDialogOpen(true)}
          />
        </div>

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
