import { parse, subYears, format, subMonths } from 'date-fns';
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
  const monthDate = parse(month, 'yyyy-MM', new Date());
  const startMonthDate = subMonths(monthDate, 11);
  const calculatedStartMonth = format(startMonthDate, 'yyyy-MM');

  // Fetch 12 months of data ending at selected month
  const allMonthsResult = await getMonthlyHistoryChartData({
    startMonth: calculatedStartMonth,
    months: 12,
    tag: tag ?? undefined,
  });

  if (!allMonthsResult.success) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border">
        <p className="text-muted-foreground">
          {allMonthsResult.error ?? 'Failed to load chart data'}
        </p>
      </div>
    );
  }

  // Fetch corresponding 12 months from previous year
  const previousYearDate = subYears(monthDate, 1);
  const previousYearStartMonthDate = subMonths(previousYearDate, 11);
  const previousYearStartMonth = format(previousYearStartMonthDate, 'yyyy-MM');

  const lastYearResult = await getMonthlyHistoryChartData({
    startMonth: previousYearStartMonth,
    months: 12,
    tag: tag ?? undefined,
  });

  const allMonthsData = allMonthsResult.data ?? [];
  const lastYearData = lastYearResult.success ? (lastYearResult.data ?? []) : [];

  // Create maps for quick lookup by month string (YYYY-MM)
  // Only include months with actual payments (totalPaid > 0)
  const allMonthsMap = new Map(
    allMonthsData.filter((item) => item.totalPaid > 0).map((item) => [item.month, item.totalPaid])
  );
  const lastYearMap = new Map(
    lastYearData.filter((item) => item.totalPaid > 0).map((item) => [item.month, item.totalPaid])
  );

  // Build merged data: always show 12 months ending at selected month
  // For each month, compare it to the same month one year earlier (year-over-year)
  // Recharts will not render bars for zero values, so months with no payments won't show bars
  const mergedData: Array<{
    month: string;
    monthLabel: string;
    currentYear: number;
    lastYear: number;
  }> = [];

  for (let i = 0; i < 12; i++) {
    const monthToCheck = subMonths(monthDate, 11 - i);
    const monthStr = format(monthToCheck, 'yyyy-MM');
    const monthLabel = format(monthToCheck, 'MMM');

    // Get data for this month (the "current period" - the 12 months ending at selected month)
    // Only get from map if month has payments (map only contains months with totalPaid > 0)
    // If month has no payments, currentYearAmount will be 0 (no blue bar rendered)
    const currentYearAmount = allMonthsMap.get(monthStr) ?? 0;

    // Get corresponding month from previous year for year-over-year comparison
    // If previous year month has no payments, lastYearAmount will be 0 (no gray bar rendered)
    const previousYearMonth = subYears(monthToCheck, 1);
    const previousYearMonthStr = format(previousYearMonth, 'yyyy-MM');
    const lastYearAmount = lastYearMap.get(previousYearMonthStr) ?? 0;

    // Always include all 12 months - Recharts won't render bars for zero values
    mergedData.push({
      month: monthStr,
      monthLabel,
      currentYear: currentYearAmount,
      lastYear: lastYearAmount,
    });
  }

  // Array is already in correct order: oldest month (left) to selected month (right)

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

