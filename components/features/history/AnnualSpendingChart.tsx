'use client';

import * as React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatMoney } from '@/lib/money';
import type { AggregatedBillSpending } from '@/lib/types';

interface AnnualSpendingChartProps {
  data: AggregatedBillSpending[];
  currency: string;
  locale: string;
  highlightedBillId?: string;
  onBillClick?: (billId: string) => void;
}

/**
 * AnnualSpendingChart
 *
 * Client Component that renders a pie chart visualizing annual spending by bill.
 * Displays bill spending as pie segments with no labels or identifying marks.
 *
 * Render Mode: Client Component (requires Recharts PieChart and interactive highlighting)
 */
export function AnnualSpendingChart({
  data,
  currency,
  locale,
  highlightedBillId,
  onBillClick,
}: AnnualSpendingChartProps) {
  const chartData = data.map((bill) => {
    const escapedBillId = bill.billId.replace(/[^a-zA-Z0-9-_]/g, '');
    return {
      name: bill.billTitle,
      value: bill.totalAmount,
      billId: bill.billId,
      escapedBillId,
    };
  });

  const escapedIds = chartData.map((item) => item.escapedBillId);
  const duplicateIds = escapedIds.filter(
    (id, index) => escapedIds.indexOf(id) !== index
  );
  if (duplicateIds.length > 0) {
    throw new Error(
      `Chart config collision: Multiple billIds escape to the same value: ${duplicateIds.join(', ')}`
    );
  }

  const chartConfig: ChartConfig = {};

  const chartColors = [
    'hsl(220, 70%, 50%)',
    'hsl(160, 60%, 45%)',
    'hsl(30, 80%, 55%)',
    'hsl(280, 65%, 60%)',
    'hsl(340, 75%, 55%)',
    'hsl(200, 70%, 50%)',
    'hsl(140, 65%, 45%)',
    'hsl(50, 85%, 55%)',
    'hsl(260, 70%, 60%)',
    'hsl(10, 75%, 55%)',
    'hsl(180, 70%, 50%)',
    'hsl(120, 60%, 45%)',
  ];

  chartData.forEach((item, index) => {
    chartConfig[item.escapedBillId] = {
      label: item.name,
      color: chartColors[index % chartColors.length],
    };
  });

  if (chartData.length === 0 || chartData.every((item) => item.value === 0)) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-card border border-border">
        <div className="w-64 h-64 rounded-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full">
      <ChartContainer
        config={chartConfig}
        className="h-full w-full"
        initialDimension={{ width: 800, height: 400 }}
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={160}
            label={false}
            labelLine={false}
          >
            {chartData.map((entry) => {
              const isHighlighted = entry.billId === highlightedBillId;
              const fillColor = isHighlighted
                ? 'hsl(var(--primary))'
                : `var(--color-${entry.escapedBillId})`;

              return (
                <Cell
                  key={`cell-${entry.billId}`}
                  fill={fillColor}
                  stroke={isHighlighted ? 'hsl(var(--primary))' : undefined}
                  strokeWidth={isHighlighted ? 3 : 0}
                  style={{
                    cursor: onBillClick ? 'pointer' : 'default',
                    opacity: isHighlighted ? 1 : 0.9,
                  }}
                  onClick={() => onBillClick?.(entry.billId)}
                />
              );
            })}
          </Pie>
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              const value = data.value as number;
              const formatted = formatMoney(value, currency, locale);
              const name = data.name as string;

              return (
                <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium font-mono tabular-nums">
                      {formatted}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

