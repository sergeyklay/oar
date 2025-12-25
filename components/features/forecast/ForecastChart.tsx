'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatMoney } from '@/lib/money';
import type { MonthlyForecastTotal } from '@/lib/services/ForecastService';

interface ForecastChartProps {
  /** Array of monthly forecast totals */
  data: MonthlyForecastTotal[];
  /** Currency code (ISO 4217) */
  currency: string;
  /** Locale identifier (BCP 47) */
  locale: string;
  /** Whether to show amortization amounts */
  showAmortization: boolean;
  /** Optional handler for bar click (receives month string in YYYY-MM format) */
  onBarClick?: (month: string) => void;
}

/**
 * ForecastChart
 *
 * Client Component that renders a bar chart visualizing monthly liability totals.
 * Displays 12 months of forecast data with formatted currency tooltips.
 *
 * Render Mode: Client Component (requires Recharts and optional onClick handlers)
 */
export function ForecastChart({
  data,
  currency,
  locale,
  showAmortization,
  onBarClick,
}: ForecastChartProps) {
  const chartConfig: ChartConfig = {
    totalDue: {
      label: 'Amount Due',
      color: 'hsl(var(--primary))',
    },
    ...(showAmortization && {
      totalToSave: {
        label: 'Amount to Save',
        color: 'hsl(var(--muted-foreground))',
      },
    }),
  };

  const chartData = data.map((item) => ({
    month: item.month,
    monthLabel: item.monthLabel,
    totalDue: item.totalDue,
    ...(showAmortization && { totalToSave: item.totalToSave }),
  }));

  return (
    <div className="relative h-[200px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart accessibilityLayer data={chartData}>
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
            content={
              <ChartLegendContent
                config={chartConfig}
                className="justify-start"
              />
            }
            wrapperStyle={{ paddingTop: '12px', paddingBottom: '0' }}
            align="left"
            verticalAlign="top"
          />
          <Bar
            dataKey="totalDue"
            fill="var(--color-totalDue)"
            radius={4}
            {...(onBarClick && {
              onClick: (data: unknown) => {
                const payload = (data as { payload?: { month?: string } })
                  ?.payload;
                if (payload?.month) {
                  onBarClick(payload.month);
                }
              },
            })}
          />
          {showAmortization && (
            <Bar
              dataKey="totalToSave"
              fill="var(--color-totalToSave)"
              radius={4}
              {...(onBarClick && {
                onClick: (data: unknown) => {
                  const payload = (data as { payload?: { month?: string } })
                    ?.payload;
                  if (payload?.month) {
                    onBarClick(payload.month);
                  }
                },
              })}
            />
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

