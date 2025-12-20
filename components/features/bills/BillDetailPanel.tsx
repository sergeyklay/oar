import { format } from 'date-fns';
import { CalendarDays, CreditCard, FileText, RefreshCw, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/money';
import { BillStatusBadge } from './BillStatusBadge';
import { CloseDetailButton } from './CloseDetailButton';
import type { BillWithTags } from '@/lib/types';
import { FREQUENCY_DISPLAY_LABELS } from '@/lib/constants';

interface BillDetailPanelProps {
  bill: BillWithTags;
  currency: string;
  locale: string;
}

/**
 * Display bill details in the right panel.
 *
 * @param props - Panel props.
 * @param props.bill - Bill to display (with tags).
 * @param props.currency - ISO 4217 currency code.
 * @param props.locale - BCP 47 locale tag.
 * @returns Bill details panel UI.
 */
export function BillDetailPanel({ bill, currency, locale }: BillDetailPanelProps) {
  return (
    <aside className="calendar-panel bg-card p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{bill.title}</h2>
          <div className="mt-1">
            <BillStatusBadge status={bill.status} />
          </div>
        </div>
        <CloseDetailButton />
      </div>

      {/* Details */}
      <div className="flex-1 space-y-4">
        {/* Amount */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
          <p className="text-2xl font-bold font-mono">
            {formatMoney(bill.amount, currency, locale)}
          </p>
          {bill.isVariable && (
            <p className="text-xs text-muted-foreground mt-1">
              (Variable amount - estimate)
            </p>
          )}
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{format(bill.dueDate, 'MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Repeat Interval */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Repeat Interval</p>
            <p className="font-medium">{FREQUENCY_DISPLAY_LABELS[bill.frequency]}</p>
          </div>
        </div>

        {/* Auto-Pay */}
        {bill.isAutoPay && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment</p>
              <p className="font-medium">Auto-Pay Enabled</p>
            </div>
          </div>
        )}

        {/* Payment Source indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining This Cycle</p>
            <p className="font-medium font-mono">
              {formatMoney(bill.amountDue, currency, locale)}
            </p>
          </div>
        </div>

        {/* Notes Section */}
        {bill.notes && (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap break-words">{bill.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tags Section - At Bottom */}
      {bill.tags.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {bill.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

