import { ForecastGraph } from './ForecastGraph';
import { ForecastList } from './ForecastList';
import { ForecastSummary } from './ForecastSummary';
import { getForecastData } from '@/actions/forecast';
import { ForecastService } from '@/lib/services/ForecastService';
import type { ForecastBill } from '@/lib/services/ForecastService';
import { ScrollableContainer } from '@/components/common/ScrollableContainer';
import { ReportSidebar } from '@/components/layout/ReportSidebar';

interface ForecastContentProps {
  month: string;
  tag?: string | null;
  currency: string;
  locale: string;
}

/**
 * ForecastContent
 *
 * Server Component that fetches and displays forecast data.
 * Wrapped in Suspense for loading states.
 *
 * Render Mode: Server Component (fetches data, renders UI)
 */
export async function ForecastContent({
  month,
  tag,
  currency,
  locale,
}: ForecastContentProps) {
  const forecastResult = await getForecastData({
    month,
    tag: tag ?? undefined,
  });

  if (!forecastResult.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {forecastResult.error ?? 'Failed to load forecast data'}
        </p>
      </div>
    );
  }

  const bills: ForecastBill[] = forecastResult.data ?? [];
  const summary = ForecastService.calculateSummary(bills);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <ForecastGraph
          month={month}
          tag={tag}
          currency={currency}
          locale={locale}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-border flex-1 min-h-0">
        <ScrollableContainer>
          <ForecastList
            bills={bills}
            currency={currency}
            locale={locale}
            month={month}
            tag={tag}
          />
        </ScrollableContainer>
        <ReportSidebar>
          <ForecastSummary
            billsDueCount={bills.length}
            summary={summary}
            currency={currency}
            locale={locale}
            month={month}
          />
        </ReportSidebar>
      </div>
    </div>
  );
}

