'use client';

import { useState } from 'react';
import { AnnualSpendingGraph } from './AnnualSpendingGraph';
import { AnnualSpendingList } from './AnnualSpendingList';
import { AnnualSpendingSummary } from './AnnualSpendingSummary';
import type { AggregatedBillSpending, AnnualSpendingSummary as AnnualSpendingSummaryType } from '@/lib/types';

interface AnnualSpendingInteractiveProps {
  data: AggregatedBillSpending[];
  summary: AnnualSpendingSummaryType;
  currency: string;
  locale: string;
  year: string;
}

/**
 * AnnualSpendingInteractive
 *
 * Client Component that manages interactive state for chart-table synchronization.
 * Handles highlighting between pie chart segments and table rows.
 *
 * Render Mode: Client Component (requires useState for highlight state management)
 */
export function AnnualSpendingInteractive({
  data,
  summary,
  currency,
  locale,
  year,
}: AnnualSpendingInteractiveProps) {
  const [highlightedBillId, setHighlightedBillId] = useState<string | undefined>();

  const handleBillClick = (billId: string) => {
    setHighlightedBillId((prev) => (prev === billId ? undefined : billId));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <AnnualSpendingGraph
          data={data}
          currency={currency}
          locale={locale}
          highlightedBillId={highlightedBillId}
          onBillClick={handleBillClick}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-border flex-1 min-h-0">
        <div className="bill-list-container">
          <AnnualSpendingList
            bills={data}
            currency={currency}
            locale={locale}
            year={year}
            highlightedBillId={highlightedBillId}
            onBillClick={handleBillClick}
          />
        </div>
        <div className="bg-card border-l border-border bill-list-container p-6">
          <AnnualSpendingSummary
            summary={summary}
            currency={currency}
            locale={locale}
            year={year}
          />
        </div>
      </div>
    </div>
  );
}

