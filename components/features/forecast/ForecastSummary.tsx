'use client';

import { format, parse, isValid } from 'date-fns';
import { formatMoney } from '@/lib/money';
import { MonthNavigation } from './MonthNavigation';
import type { ForecastSummary as ForecastSummaryType } from '@/lib/services/ForecastService';

interface ForecastSummaryProps {
  billsDueCount: number;
  summary: ForecastSummaryType;
  currency: string;
  locale: string;
  month: string;
}

/**
 * Returns current month in YYYY-MM format.
 */
function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * ForecastSummary
 *
 * Summary panel with totals for forecast view.
 * Displays in the right column of the bottom section.
 *
 * Render Mode: Client Component (contains MonthNavigation which requires client-side URL state)
 */
export function ForecastSummary({
  billsDueCount,
  summary,
  currency,
  locale,
  month,
}: ForecastSummaryProps) {
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
          <span className="text-muted-foreground">Bills Due</span>
          <span className="font-mono font-medium">{billsDueCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Due</span>
          <span className="font-mono font-medium">
            {formatMoney(summary.totalDue, currency, locale)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total to Save</span>
          <span className="font-mono text-muted-foreground">
            {formatMoney(summary.totalToSave, currency, locale)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-medium">Grand Total</span>
          <span className="font-mono font-bold">
            {formatMoney(summary.grandTotal, currency, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

