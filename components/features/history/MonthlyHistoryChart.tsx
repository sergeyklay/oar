'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  type BarRectangleItem,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatMoney } from '@/lib/money';

interface MonthlyHistoryChartProps {
  /** Array of monthly payment data with current year and last year values */
  data: Array<{
    month: string;
    monthLabel: string;
    currentYear: number;
    lastYear: number;
  }>;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Locale identifier (BCP 47) */
  locale: string;
}

/**
 * Custom bar shape that hides bars with zero values.
 * Returns empty group for zero values, rectangle for non-zero values.
 */
const ConditionalBarShape = (
  props: unknown,
): React.ReactElement<React.SVGProps<SVGPathElement>> => {
  const barProps = props as BarRectangleItem;
  const { x, y, width, height, fill, value } = barProps;
  // Handle both number and tuple values (for stacked bars)
  const numericValue = Array.isArray(value) ? value[1] : value;

  // Don't render bar if value is 0 (no payments in this month)
  if (numericValue === 0) {
    return <g />;
  }

  // Render rectangle for non-zero values
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={4}
      ry={4}
    />
  );
};

/**
 * MonthlyHistoryChart
 *
 * Client Component that renders a bar chart visualizing monthly payment history.
 * Displays 12 months of data with "Current Year" and "Last Year" comparison.
 *
 * Render Mode: Client Component (requires Recharts and chart primitives)
 */
export function MonthlyHistoryChart({
  data,
  currency,
  locale,
}: MonthlyHistoryChartProps) {
  const chartConfig: ChartConfig = {
    currentYear: {
      label: 'Current Year',
      color: 'hsl(var(--primary))',
    },
    lastYear: {
      label: 'Last Year',
      color: 'hsl(var(--muted-foreground))',
    },
  };

  return (
    <div className="relative h-[200px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="text-muted-foreground"
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-md">
                  {payload.map((item, index) => {
                    const value = item.value as number;
                    const formatted = formatMoney(value, currency, locale);
                    const dataKey = item.dataKey as keyof typeof chartConfig;
                    const label =
                      (dataKey && chartConfig[dataKey]?.label) ||
                      (item.name as string);
                    const color = item.color;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2">
                          {color && (
                            <div
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          )}
                          <span className="text-muted-foreground">{label}</span>
                        </div>
                        <span className="font-medium font-mono tabular-nums">
                          {formatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <ChartLegend
            content={(props) => {
              const { payload } = props as {
                payload?: Array<{
                  value?: string;
                  type?: string;
                  id?: string;
                  color?: string;
                }>;
              };
              return (
                <ChartLegendContent
                  payload={payload}
                  config={chartConfig}
                  className="justify-start px-6"
                />
              );
            }}
            wrapperStyle={{ paddingTop: '12px', paddingBottom: '0' }}
            align="left"
            verticalAlign="top"
          />
          <Bar
            dataKey="currentYear"
            fill="var(--color-currentYear)"
            radius={4}
            shape={ConditionalBarShape}
          />
          <Bar
            dataKey="lastYear"
            fill="var(--color-lastYear)"
            radius={4}
            shape={ConditionalBarShape}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

