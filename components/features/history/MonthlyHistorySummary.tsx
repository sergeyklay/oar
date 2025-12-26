'use client';

import { format, parse, isValid } from 'date-fns';
import { formatMoney } from '@/lib/money';
import { getCurrentMonth } from '@/lib/utils';
import { MonthNavigation } from '@/components/features/forecast/MonthNavigation';
import type { HistorySummary } from '@/lib/types';

interface MonthlyHistorySummaryProps {
  paymentsCount: number;
  summary: HistorySummary;
  currency: string;
  locale: string;
  month: string;
}

/**
 * MonthlyHistorySummary
 *
 * Summary panel with totals for monthly history view.
 * Displays in the right column of the bottom section.
 *
 * Render Mode: Client Component (contains MonthNavigation which requires client-side URL state)
 */
export function MonthlyHistorySummary({
  paymentsCount,
  summary,
  currency,
  locale,
  month,
}: MonthlyHistorySummaryProps) {
  const monthDate = parse(month, 'yyyy-MM', new Date());
  const validMonth = isValid(monthDate) ? month : getCurrentMonth();
  const validMonthDate = isValid(monthDate) ? monthDate : parse(validMonth, 'yyyy-MM', new Date());
  const monthLabel = format(validMonthDate, 'MMMM yyyy');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <MonthNavigation currentMonth={validMonth} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Payments</span>
          <span className="font-mono font-medium">{paymentsCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Paid</span>
          <span className="font-mono font-medium">
            {formatMoney(summary.totalPaid, currency, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

