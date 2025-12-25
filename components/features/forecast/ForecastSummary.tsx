import { formatMoney } from '@/lib/money';
import { ForecastService } from '@/lib/services/ForecastService';
import type { ForecastBill } from '@/lib/services/ForecastService';

interface ForecastSummaryProps {
  bills: ForecastBill[];
  currency: string;
  locale: string;
  showAmortization: boolean;
}

/**
 * ForecastSummary
 *
 * Summary panel with totals for forecast view.
 * Displays in the right sidebar as a persistent panel.
 *
 * Render Mode: Server Component (no hooks, calculates from props)
 */
export function ForecastSummary({
  bills,
  currency,
  locale,
  showAmortization,
}: ForecastSummaryProps) {
  const summary = ForecastService.calculateSummary(bills);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Summary</h2>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Due</span>
          <span className="font-mono font-medium">
            {formatMoney(summary.totalDue, currency, locale)}
          </span>
        </div>
        {showAmortization && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total to Save</span>
            <span className="font-mono text-muted-foreground">
              {formatMoney(summary.totalToSave, currency, locale)}
            </span>
          </div>
        )}
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

