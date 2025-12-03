'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatMoney } from '@/lib/money';
import { getTransactionsByBillId } from '@/actions/transactions';
import type { Transaction } from '@/db/schema';

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

  return (
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
                  className="flex items-start justify-between rounded-lg border p-3"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
