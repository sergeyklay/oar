import { MonthlyHistoryGraph } from './MonthlyHistoryGraph';
import { MonthlyHistoryList } from './MonthlyHistoryList';
import { MonthlyHistorySummary } from './MonthlyHistorySummary';
import { getMonthlyHistoryData } from '@/actions/history';
import { HistoryService } from '@/lib/services/HistoryService';
import type { PaymentWithBill } from '@/lib/types';

interface MonthlyHistoryContentProps {
  month: string;
  tag?: string | null;
  currency: string;
  locale: string;
}

/**
 * MonthlyHistoryContent
 *
 * Server Component that fetches and displays monthly history data.
 * Wrapped in Suspense for loading states.
 *
 * Render Mode: Server Component (fetches data, renders UI)
 */
export async function MonthlyHistoryContent({
  month,
  tag,
  currency,
  locale,
}: MonthlyHistoryContentProps) {
  const historyResult = await getMonthlyHistoryData({
    month,
    tag: tag ?? undefined,
  });

  if (!historyResult.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {historyResult.error ?? 'Failed to load history data'}
        </p>
      </div>
    );
  }

  const payments: PaymentWithBill[] = historyResult.data ?? [];
  const summary = HistoryService.calculateSummary(payments);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <MonthlyHistoryGraph
          month={month}
          tag={tag}
          currency={currency}
          locale={locale}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-border flex-1 min-h-0">
        <div className="overflow-y-auto">
          <MonthlyHistoryList
            payments={payments}
            currency={currency}
            locale={locale}
            month={month}
            tag={tag}
          />
        </div>
        <div className="bg-card border-l border-border overflow-y-auto p-6">
          <MonthlyHistorySummary
            summary={summary}
            currency={currency}
            locale={locale}
            month={month}
          />
        </div>
      </div>
    </div>
  );
}

