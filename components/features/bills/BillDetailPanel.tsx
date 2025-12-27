'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryState, parseAsString } from 'nuqs';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatMoney, getCurrencySymbol } from '@/lib/money';
import { DueDateService } from '@/lib/services/DueDateService';
import { ClientDate } from '@/components/ui/client-date';
import { skipPayment, archiveBill, deleteBill } from '@/actions/bills';
import { LogPaymentDialog } from './LogPaymentDialog';
import { BillFormDialog } from './BillFormDialog';
import { CloseDetailButton } from './CloseDetailButton';
import { PaymentHistorySection } from './PaymentHistorySection';
import type {
  BillWithTags,
  Tag,
  BillCategoryGroupWithCategories,
} from '@/lib/types';

interface BillDetailPanelProps {
  bill: BillWithTags;
  currency: string;
  locale: string;
  availableTags?: Tag[];
  categoriesGrouped?: BillCategoryGroupWithCategories[];
  defaultCategoryId?: string;
}

/**
 * Display bill details in the right panel.
 *
 * @param props - Panel props.
 * @param props.bill - Bill to display (with tags).
 * @param props.currency - ISO 4217 currency code.
 * @param props.locale - BCP 47 locale tag.
 * @param props.availableTags - All available tags for editing.
 * @param props.categoriesGrouped - Grouped categories for editing.
 * @param props.defaultCategoryId - Default category ID.
 * @returns Bill details panel UI.
 */
export function BillDetailPanel({
  bill,
  currency,
  locale,
  availableTags = [],
  categoriesGrouped = [],
  defaultCategoryId,
}: BillDetailPanelProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [, setSelectedBill] = useQueryState(
    'selectedBill',
    parseAsString.withOptions({ shallow: false })
  );

  const isPaid = bill.status === 'paid';
  const isOverdue = bill.status === 'overdue';

  const handlePaymentLogged = () => {
    setHistoryRefreshKey((prev) => prev + 1);
  };

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

  const handleArchive = async () => {
    setIsArchiving(true);
    const result = await archiveBill(bill.id, !bill.isArchived);
    setIsArchiving(false);

    if (result.success) {
      toast.success(bill.isArchived ? 'Bill unarchived' : 'Bill archived', {
        description: `"${bill.title}" has been ${bill.isArchived ? 'unarchived' : 'archived'}.`,
      });
      setSelectedBill(null);
    } else {
      toast.error(`Failed to ${bill.isArchived ? 'unarchive' : 'archive'} bill`, {
        description: result.error ?? 'Please try again.',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBill(bill.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success('Bill deleted', {
        description: `"${bill.title}" has been removed.`,
      });
      setSelectedBill(null);
    } else {
      toast.error('Failed to delete bill', {
        description: result.error ?? 'Please try again.',
      });
    }
  };

  const headerBgColor = bill.isArchived
    ? 'bg-muted'
    : DueDateService.getStatusBarColor(bill.dueDate, bill.status);
  const headerTextColor = bill.isArchived ? 'text-foreground' : 'text-white';
  const amountTextColor = bill.isArchived
    ? 'text-foreground'
    : isOverdue
      ? 'text-red-500'
      : 'text-white';
  const dateTextColor = bill.isArchived ? 'text-muted-foreground' : 'text-zinc-300';

  return (
    <aside className="calendar-panel bg-card p-4 flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex items-start justify-between mb-6 -mt-4 -mx-4 p-4 ${headerBgColor}`}
      >
        <div className="flex-1 min-w-0">
          <h2 className={`text-lg font-semibold truncate ${headerTextColor}`}>
            {bill.title}
          </h2>
        </div>
        <div className="ml-2">
          <CloseDetailButton />
        </div>
      </div>

      {/* Details */}
      <div className={`flex-1 space-y-6 ${isHistoryExpanded ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overflow-x-hidden'}`}>
        {/* Status / Date / Amount Block - Hidden when history expanded */}
        {!isHistoryExpanded && (
          <div className="space-y-1">
            <p className={`text-xl font-medium ${headerTextColor}`}>
              {bill.isArchived ? 'Never' : DueDateService.formatRelativeDueDate(bill.dueDate, bill.status)}
            </p>
            <p className={`text-sm ${dateTextColor}`}>
              {bill.isArchived ? 'Archived' : <ClientDate date={bill.dueDate} format="EEEE, d MMMM yyyy" className={dateTextColor} />}
            </p>
            <p
              className={`text-sm font-bold font-mono ${amountTextColor}`}
            >
              {bill.amountDue < bill.amount && bill.status !== 'paid' ? (
                <>
                  {formatMoney(bill.amountDue, currency, locale)}
                  <span className="ml-1 opacity-70 font-normal text-xs">
                    ({formatMoney(bill.amount, currency, locale)})
                  </span>
                </>
              ) : (
                formatMoney(bill.amount, currency, locale)
              )}
            </p>
            {bill.isVariable && (
              <p className="text-xs text-muted-foreground mt-1">
                (Variable amount - estimate)
              </p>
            )}
          </div>
        )}

        {/* Action Buttons - Hidden when history expanded */}
        {!isHistoryExpanded && !bill.isArchived && (
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
        )}

        {/* Payment History Section */}
        <PaymentHistorySection
          billId={bill.id}
          currency={currency}
          locale={locale}
          isExpanded={isHistoryExpanded}
          onExpandChange={setIsHistoryExpanded}
          refreshKey={historyRefreshKey}
        />

        {/* Notes Section - Hidden when history expanded */}
        {!isHistoryExpanded && bill.notes && (
          <div className="flex items-start gap-3 pt-4 border-t border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap break-words">
                {bill.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-auto pt-4">
        {/* Tags Section - Hidden when history expanded */}
        {!isHistoryExpanded && bill.tags.length > 0 && (
          <div className="mt-6 pb-4">
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

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleArchive}
            disabled={isArchiving || isDeleting}
          >
            {isArchiving ? (bill.isArchived ? 'Unarchiving...' : 'Archiving...') : (bill.isArchived ? 'Unarchive' : 'Archive')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            disabled={isArchiving || isDeleting}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isArchiving || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <LogPaymentDialog
        bill={bill}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        currency={currency}
        onPaymentLogged={handlePaymentLogged}
      />

      <BillFormDialog
        bill={bill}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currencySymbol={getCurrencySymbol(currency, locale)}
        availableTags={availableTags}
        categoriesGrouped={categoriesGrouped}
        defaultCategoryId={defaultCategoryId ?? null}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{bill.title}&quot;? This
              action cannot be undone and will also delete all payment history
              for this bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
