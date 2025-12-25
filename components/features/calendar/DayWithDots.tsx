'use client';

import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { DateStatusMap, PaymentDateMap } from '@/actions/calendar';
import type { DayButtonProps } from 'react-day-picker';

interface DayWithDotsProps extends DayButtonProps {
  dateStatuses: DateStatusMap;
  isLoading: boolean;
  /** Dot rendering mode */
  dotMode?: 'status' | 'payment' | 'none';
  /** Payment dates map (when dotMode is 'payment') */
  paymentDates?: PaymentDateMap;
}

const STATUS_COLORS = {
  overdue: 'bg-destructive',
  pending: 'bg-yellow-500',
  paid: 'bg-green-500',
} as const;

/**
 * Custom day cell that renders status dots below the date number.
 */
export function DayWithDots({
  day,
  dateStatuses,
  isLoading,
  dotMode = 'status',
  paymentDates,
  modifiers,
  className,
  ...props
}: DayWithDotsProps) {
  const dateKey = format(day.date, 'yyyy-MM-dd');

  // Determine what dots to render based on dotMode
  let shouldRenderDots = false;
  let dotsToRender: React.ReactNode[] = [];

  if (dotMode === 'none') {
    shouldRenderDots = false;
  } else if (dotMode === 'payment' && paymentDates) {
    if (paymentDates[dateKey] === true && !isLoading) {
      shouldRenderDots = true;
      dotsToRender = [
        <span
          key="payment-dot"
          className="h-1 w-1 rounded-full bg-white border border-border"
          aria-label="payment made"
        />,
      ];
    }
  } else if (dotMode === 'status') {
    const statuses = dateStatuses[dateKey] || [];
    // Dedupe and sort: overdue > pending > paid
    const uniqueStatuses = [...new Set(statuses)].sort((a, b) => {
      const order = { overdue: 0, pending: 1, paid: 2 };
      return order[a] - order[b];
    });
    // Limit to 3 dots max for visual clarity
    const displayStatuses = uniqueStatuses.slice(0, 3);
    if (displayStatuses.length > 0 && !isLoading) {
      shouldRenderDots = true;
      dotsToRender = displayStatuses.map((status, idx) => (
        <span
          key={`${status}-${idx}`}
          className={cn('h-1 w-1 rounded-full', STATUS_COLORS[status])}
          aria-label={`${status} bill`}
        />
      ));
    }
  }

  return (
    <button
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'relative h-8 w-8 p-0 font-normal flex flex-col items-center justify-center',
        modifiers?.selected &&
          'bg-primary text-primary-foreground hover:bg-primary',
        modifiers?.today &&
          !modifiers?.selected &&
          'bg-accent text-accent-foreground',
        modifiers?.outside && 'text-muted-foreground opacity-50',
        className
      )}
      {...props}
    >
      <span className="text-sm">{day.date.getDate()}</span>

      {shouldRenderDots && (
        <div className="absolute bottom-0.5 flex gap-0.5">
          {dotsToRender}
        </div>
      )}
    </button>
  );
}
