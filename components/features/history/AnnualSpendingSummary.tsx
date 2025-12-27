'use client';

import { formatMoney } from '@/lib/money';
import { YearNavigation } from './YearNavigation';
import type { AnnualSpendingSummary as AnnualSpendingSummaryType } from '@/lib/types';

interface AnnualSpendingSummaryProps {
  summary: AnnualSpendingSummaryType;
  currency: string;
  locale: string;
  year: string;
}

/**
 * AnnualSpendingSummary
 *
 * Summary panel with totals for annual spending view.
 * Displays in the right column of the bottom section.
 *
 * Render Mode: Client Component (contains YearNavigation which requires client-side URL state)
 */
export function AnnualSpendingSummary({
  summary,
  currency,
  locale,
  year,
}: AnnualSpendingSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{year}</h2>
        <YearNavigation currentYear={year} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Bills</span>
          <span className="font-mono font-medium">{summary.totalBills}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Payments</span>
          <span className="font-mono font-medium">{summary.totalPayments}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-medium">Amount Paid</span>
          <span className="font-mono font-medium">
            {formatMoney(summary.amountPaid, currency, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

