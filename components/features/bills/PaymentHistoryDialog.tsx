'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { getTransactionsByBillId, deleteTransaction } from '@/actions/transactions';
import type { Transaction } from '@/lib/types';

interface PaymentHistoryDialogProps {
  billId: string;
  billTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  locale: string;
}

export function PaymentHistoryDialog({
  billId,
  billTitle,
  open,
  onOpenChange,
  currency,
  locale,
}: PaymentHistoryDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchHistory() {
      setIsLoading(true);
      try {
        const data = await getTransactionsByBillId(billId);
        if (!cancelled) {
          setTransactions(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [open, billId]);

  /** Opens delete confirmation dialog */
  function handleDeleteClick(tx: Transaction) {
    setTransactionToDelete(tx);
    setDeleteDialogOpen(true);
  }

  /** Performs the deletion after confirmation */
  async function handleConfirmDelete() {
    if (!transactionToDelete) return;

    setIsDeleting(true);

    const result = await deleteTransaction({ id: transactionToDelete.id });

    setIsDeleting(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      // Remove from local state for immediate UI feedback
      setTransactions((prev) =>
        prev.filter((tx) => tx.id !== transactionToDelete.id)
      );

      toast.success('Payment deleted', {
        description: `Payment of ${formatMoney(transactionToDelete.amount, currency, locale)} has been removed.`,
      });
    } else {
      toast.error('Failed to delete payment', {
        description: result.error ?? 'Please try again.',
      });
    }

    setTransactionToDelete(null);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            All recorded payments for &ldquo;{billTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-mono font-medium">
                      {formatMoney(tx.amount, currency, locale)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(tx.paidAt, 'PPP')}
                    </p>
                    {tx.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        {tx.notes}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(tx)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete payment</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation AlertDialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Are you sure you want to delete this payment record?</p>
              {transactionToDelete && (
                <p className="font-medium text-foreground">
                  {formatMoney(transactionToDelete.amount, currency, locale)} on{' '}
                  {format(transactionToDelete.paidAt, 'PPP')}
                </p>
              )}
              <p className="text-amber-600 dark:text-amber-500">
                ⚠️ This will not change the bill&apos;s due date. Edit the bill
                manually if needed.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
