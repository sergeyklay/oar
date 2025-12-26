import { ForecastChart } from './ForecastChart';
import { getForecastDataForRange } from '@/actions/forecast';

interface ForecastGraphProps {
  /** Current selected month in YYYY-MM format */
  month: string;
  /** Optional tag slug for filtering */
  tag?: string | null;
  /** Currency code */
  currency: string;
  /** Locale identifier */
  locale: string;
}

/**
 * ForecastGraph
 *
 * Server Component that fetches and displays the forecast bar chart.
 * Fetches 12 months of forecast data and renders the chart component.
 *
 * Render Mode: Server Component (fetches data, renders chart)
 */
export async function ForecastGraph({
  month,
  tag,
  currency,
  locale,
}: ForecastGraphProps) {
  const result = await getForecastDataForRange({
    startMonth: month,
    months: 12,
    tag: tag ?? undefined,
  });

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border">
        <p className="text-muted-foreground">
          {result.error ?? 'Failed to load chart data'}
        </p>
      </div>
    );
  }

  if (!result.data || result.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border">
        <p className="text-muted-foreground">
          No bills projected for this period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border">
      <ForecastChart
        data={result.data}
        currency={currency}
        locale={locale}
      />
    </div>
  );
}

