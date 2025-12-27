'use client';

import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { FREQUENCY_DISPLAY_LABELS, PAYMENT_MODE_LABELS } from '@/lib/constants';
import { DueDateService } from '@/lib/services/DueDateService';
import { ClientDate } from '@/components/ui/client-date';
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
  const statusClass = isArchived
    ? 'bg-muted'
    : DueDateService.getStatusBarColor(bill.dueDate, bill.status);

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
          <span
            className={cn(
              'font-mono',
              bill.isVariable && 'text-muted-foreground'
            )}
          >
            {formatMoney(bill.amount, currency, locale)}
          </span>
          {bill.isVariable && (
            <span className="text-xs text-muted-foreground">(estimate)</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-stretch gap-3">
          <div
            className={cn('w-[3px] self-stretch rounded-sm', statusClass)}
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span>{isArchived ? 'Never' : DueDateService.formatRelativeDueDate(bill.dueDate, bill.status)}</span>
            {isArchived ? (
              <span className="text-xs text-muted-foreground">
                Archived
              </span>
            ) : (
              !(bill.status === 'paid' && bill.frequency === 'once') && (
                <span className="text-xs text-muted-foreground">
                  <ClientDate date={bill.dueDate} format="EEE, MMM d" />
                </span>
              )
            )}
          </div>
        </div>
      </td>
    </>
  );
}
