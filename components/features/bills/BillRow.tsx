'use client';

import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { FREQUENCY_DISPLAY_LABELS, PAYMENT_MODE_LABELS } from '@/lib/constants';
import { DueDateService } from '@/lib/services/DueDateService';
import { CategoryIcon } from './CategoryIcon';
import type { BillWithTags } from '@/lib/types';

interface BillRowProps {
  bill: BillWithTags;
  currency: string;
  locale: string;
  /** Archive mode - indicates bill should be displayed with archive formatting */
  isArchived?: boolean;
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
  isArchived,
}: BillRowProps) {
  return (
    <>
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
          <span className="font-mono">{formatMoney(bill.amount, currency, locale)}</span>
          {bill.isVariable && (
            <span className="text-xs text-muted-foreground">(estimate)</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-stretch gap-3">
          {!isArchived && (
            <div
              className={cn('w-[3px] self-stretch rounded-sm', DueDateService.getStatusBarColor(bill.dueDate, bill.status))}
              aria-hidden="true"
            />
          )}
          {isArchived && (
            <div
              className="w-[3px] self-stretch rounded-sm bg-muted"
              aria-hidden="true"
            />
          )}
          <div className="flex flex-col">
            <span>{isArchived ? 'Never' : DueDateService.formatRelativeDueDate(bill.dueDate, bill.status)}</span>
            {isArchived ? (
              <span className="text-xs text-muted-foreground">
                Archived
              </span>
            ) : (
              !(bill.status === 'paid' && bill.frequency === 'once') && (
                <span className="text-xs text-muted-foreground">
                  {format(bill.dueDate, 'EEE, MMM d')}
                </span>
              )
            )}
          </div>
        </div>
      </td>
    </>
  );
}
