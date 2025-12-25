import { ForecastGraph } from './ForecastGraph';
import { ForecastList } from './ForecastList';
import { ForecastSummary } from './ForecastSummary';
import { getForecastData } from '@/actions/forecast';
import type { ForecastBill } from '@/lib/services/ForecastService';

interface ForecastContentProps {
  month: string;
  tag?: string | null;
  showAmortization: boolean;
  showEstimates: boolean;
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
  showAmortization,
  showEstimates,
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <ForecastGraph
          month={month}
          tag={tag}
          currency={currency}
          locale={locale}
          showAmortization={showAmortization}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-border flex-1 min-h-0">
        <div className="overflow-y-auto">
          <ForecastList
            bills={bills}
            currency={currency}
            locale={locale}
            showAmortization={showAmortization}
            showEstimates={showEstimates}
            month={month}
            tag={tag}
          />
        </div>
        <div className="bg-card border-l border-border overflow-y-auto p-6">
          <ForecastSummary
            bills={bills}
            currency={currency}
            locale={locale}
            showAmortization={showAmortization}
          />
        </div>
      </div>
    </div>
  );
}

