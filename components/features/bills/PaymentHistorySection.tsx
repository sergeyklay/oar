'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { formatMoney } from '@/lib/money';
import { ClientDate } from '@/components/ui/client-date';
import { getTransactionsByBillId, deleteTransaction } from '@/actions/transactions';
import type { Transaction } from '@/lib/types';
import { PaymentDetailForm } from './PaymentDetailForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentHistorySectionProps {
  /** Bill ID to fetch transactions for */
  billId: string;
  /** ISO 4217 currency code for formatting amounts */
  currency: string;
  /** BCP 47 locale for date/money formatting */
  locale: string;
  /** Whether the section is currently expanded */
  isExpanded: boolean;
  /** Callback when expand state changes */
  onExpandChange: (expanded: boolean) => void;
  /** Key to trigger refetch; increment to force refresh */
  refreshKey?: number;
}

/**
 * Collapsible payment history section for the Bill Detail Panel.
 * Shows last payment info when collapsed, full transaction list when expanded.
 */
export function PaymentHistorySection({
  billId,
  currency,
  locale,
  isExpanded,
  onExpandChange,
  refreshKey,
}: PaymentHistorySectionProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
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

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [billId, refreshKey]);

  // Clear selection when region collapses
  useEffect(() => {
    if (!isExpanded) {
      setSelectedTransactionId(null);
    }
  }, [isExpanded]);

  function handleTransactionClick(txId: string) {
    setSelectedTransactionId(txId);
  }

  async function handleUpdate() {
    const data = await getTransactionsByBillId(billId);
    setTransactions(data);
    setSelectedTransactionId(null);
    // Refresh server components to update bill data
    router.refresh();
  }

  async function handleDelete() {
    if (!selectedTransactionId) return;

    const result = await deleteTransaction({ id: selectedTransactionId });

    if (result.success) {
      toast.success('Payment deleted', {
        description: 'Payment record has been removed.',
      });
      const data = await getTransactionsByBillId(billId);
      setTransactions(data);
      setSelectedTransactionId(null);
      // Refresh server components to update bill data (due date, status, etc.)
      router.refresh();
    } else {
      toast.error('Failed to delete payment', {
        description: result.error ?? 'Please try again.',
      });
    }
  }

  const lastPayment = transactions[0];

  const getSubtitle = (): React.ReactNode => {
    if (isLoading) {
      return 'Loading...';
    }
    if (transactions.length === 0) {
      return 'No Payments';
    }
    const amount = formatMoney(lastPayment.amount, currency, locale);
    return (
      <>
        Last Paid {amount} on <ClientDate date={lastPayment.paidAt} format="EEE, MMM d" />
      </>
    );
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => onExpandChange(true)}
        className="w-full text-left pt-4 border-t border-border cursor-pointer hover:bg-muted/50 -mx-4 px-4 py-3 transition-colors flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-medium">View Payment History</p>
          <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    );
  }

  const selectedTransaction = transactions.find((tx) => tx.id === selectedTransactionId);

  return (
    <div className="pt-4 border-t border-border -mx-4 px-4 overflow-x-hidden flex-1 flex flex-col min-h-0">
      <button
        type="button"
        onClick={() => onExpandChange(false)}
        className="flex items-center gap-1 mb-4 text-sm font-medium hover:text-muted-foreground transition-colors cursor-pointer shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
        Payment History
      </button>

      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No payments recorded yet.
          </p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => handleTransactionClick(tx.id)}
              className={cn(
                'flex items-center gap-2 text-sm min-w-0 cursor-pointer rounded-md px-2 py-2 hover:bg-muted/50 transition-colors',
                selectedTransactionId === tx.id && 'bg-muted'
              )}
              title={tx.notes ?? undefined}
            >
              <span className="text-muted-foreground shrink-0">
                <ClientDate date={tx.paidAt} format="dd/MM/yyyy" />
              </span>
              <span className="font-mono shrink-0">
                {formatMoney(tx.amount, currency, locale)}
              </span>
              <span className="text-muted-foreground truncate min-w-0 flex-1">
                {tx.notes ?? ''}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Sticky footer container */}
      {transactions.length > 0 && (
        <div className="mt-auto pt-4 border-t border-border shrink-0">
          {selectedTransaction ? (
            <PaymentDetailForm
              transaction={selectedTransaction}
              currency={currency}
              locale={locale}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Select a payment to view and edit
            </p>
          )}
        </div>
      )}
    </div>
  );
}

