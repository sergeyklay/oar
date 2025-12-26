import { parse, subYears, format } from 'date-fns';
import { MonthlyHistoryChart } from './MonthlyHistoryChart';
import { getMonthlyHistoryChartData } from '@/actions/history';

interface MonthlyHistoryGraphProps {
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
 * MonthlyHistoryGraph
 *
 * Server Component that fetches and displays the monthly history bar chart.
 * Fetches 12 months of payment data for current year and previous year, then merges them.
 *
 * Render Mode: Server Component (fetches data, renders chart)
 */
export async function MonthlyHistoryGraph({
  month,
  tag,
  currency,
  locale,
}: MonthlyHistoryGraphProps) {
  const currentYearResult = await getMonthlyHistoryChartData({
    startMonth: month,
    months: 12,
    tag: tag ?? undefined,
  });

  if (!currentYearResult.success) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border">
        <p className="text-muted-foreground">
          {currentYearResult.error ?? 'Failed to load chart data'}
        </p>
      </div>
    );
  }

  const monthDate = parse(month, 'yyyy-MM', new Date());
  const previousYearDate = subYears(monthDate, 1);
  const previousYearMonth = format(previousYearDate, 'yyyy-MM');

  const lastYearResult = await getMonthlyHistoryChartData({
    startMonth: previousYearMonth,
    months: 12,
    tag: tag ?? undefined,
  });

  const currentYearData = currentYearResult.data ?? [];
  const lastYearData = lastYearResult.success ? (lastYearResult.data ?? []) : [];

  // Align data by index position (both arrays should have 12 months in same order)
  // Current year: Dec 2025, Jan 2026, Feb 2026, ..., Nov 2026
  // Last year: Dec 2024, Jan 2025, Feb 2025, ..., Nov 2025
  // The service returns all 12 months, so we can safely align by index
  const mergedData = currentYearData.map((currentItem, index) => {
    const lastYearItem = lastYearData[index];
    return {
      month: currentItem.month,
      monthLabel: currentItem.monthLabel,
      currentYear: currentItem.totalPaid,
      lastYear: lastYearItem?.totalPaid ?? 0,
    };
  });

  if (mergedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border">
        <p className="text-muted-foreground">
          No payment data for this period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border">
      <MonthlyHistoryChart
        data={mergedData}
        currency={currency}
        locale={locale}
      />
    </div>
  );
}

