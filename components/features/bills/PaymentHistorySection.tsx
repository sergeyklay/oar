'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { formatMoney } from '@/lib/money';
import { getTransactionsByBillId } from '@/actions/transactions';
import type { Transaction } from '@/lib/types';

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
}: PaymentHistorySectionProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [billId]);

  const lastPayment = transactions[0];

  const getSubtitle = (): string => {
    if (isLoading) {
      return 'Loading...';
    }
    if (transactions.length === 0) {
      return 'No Payments';
    }
    const amount = formatMoney(lastPayment.amount, currency, locale);
    const date = format(lastPayment.paidAt, 'EEE, MMM d');
    return `Last Paid ${amount} on ${date}`;
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

  return (
    <div className="pt-4 border-t border-border -mx-4 px-4 overflow-x-hidden">
      <button
        type="button"
        onClick={() => onExpandChange(false)}
        className="flex items-center gap-1 mb-4 text-sm font-medium hover:text-muted-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Payment History
      </button>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
              className="flex items-center gap-2 text-sm py-1 min-w-0"
              title={tx.notes ?? undefined}
            >
              <span className="text-muted-foreground shrink-0">
                {format(tx.paidAt, 'dd/MM/yyyy')}
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
    </div>
  );
}

