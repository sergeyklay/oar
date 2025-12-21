'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { DueDateService } from '@/lib/services/DueDateService';
import { skipPayment } from '@/actions/bills';
import { LogPaymentDialog } from './LogPaymentDialog';
import { CloseDetailButton } from './CloseDetailButton';
import type { BillWithTags } from '@/lib/types';

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
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const isPaid = bill.status === 'paid';
  const isOverdue = bill.status === 'overdue';

  const handleSkip = async () => {
    setIsSkipping(true);
    const result = await skipPayment({ billId: bill.id });
    setIsSkipping(false);

    if (result.success) {
      toast.success(`Payment skipped for "${bill.title}"`);
    } else {
      toast.error('Failed to skip payment', {
        description: result.error ?? 'Please try again.',
      });
    }
  };

  return (
    <aside className="calendar-panel bg-card p-4 flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex items-start justify-between mb-6 -mt-4 -mx-4 p-4 ${DueDateService.getStatusBarColor(bill.dueDate, bill.status)}`}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate text-white">{bill.title}</h2>
        </div>
        <div className="ml-2">
           <CloseDetailButton />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-6">
        {/* Status / Date / Amount Block */}
        <div className="space-y-1">
          {/* Line 1: Status Header */}
          <p className="text-xl font-medium text-white">
            {DueDateService.formatRelativeDueDate(bill.dueDate, bill.status)}
          </p>

          {/* Line 2: Date */}
          <p className="text-sm text-zinc-300">
            {format(bill.dueDate, 'EEEE, d MMMM yyyy')}
          </p>

          {/* Line 3: Amount */}
          <p className={`text-sm font-bold font-mono ${isOverdue ? 'text-red-500' : 'text-white'}`}>
            {formatMoney(bill.amount, currency, locale)}
          </p>
          {bill.isVariable && (
            <p className="text-xs text-muted-foreground mt-1">
              (Variable amount - estimate)
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setPayDialogOpen(true)}
            disabled={isPaid}
          >
            Log Payment
          </Button>

          <Button
            className="w-full"
            variant="secondary"
            size="lg"
            onClick={handleSkip}
            disabled={isPaid || bill.frequency === 'once' || isSkipping}
          >
            {isSkipping ? 'Skipping...' : 'Skip'}
          </Button>
        </div>

        {/* Notes Section */}
        {bill.notes && (
          <div className="flex items-start gap-3 pt-4 border-t border-border">
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

      <LogPaymentDialog
        bill={bill}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        currency={currency}
      />
    </aside>
  );
}
