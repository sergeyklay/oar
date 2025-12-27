'use client';

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
import { formatMoney } from '@/lib/money';
import { ClientDate } from '@/components/ui/client-date';
import type { Transaction } from '@/lib/types';

interface DeleteConfirmationDialogProps {
  transaction: Transaction;
  currency: string;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({
  transaction,
  currency,
  locale,
  open,
  onOpenChange,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to delete this payment record?
            </span>
            <span className="block font-medium text-foreground">
              {formatMoney(transaction.amount, currency, locale)} on{' '}
              <ClientDate date={transaction.paidAt} format="PPP" />
            </span>
            <span className="block text-amber-600 dark:text-amber-500">
              ⚠️ This will recalculate the billing cycle if this payment affected the current
              cycle.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

