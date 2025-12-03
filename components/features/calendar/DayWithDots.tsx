'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { DateStatusMap } from '@/actions/calendar';
import type { DayButtonProps } from 'react-day-picker';

interface DayWithDotsProps extends DayButtonProps {
  dateStatuses: DateStatusMap;
  isLoading: boolean;
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
  modifiers,
  className,
  ...props
}: DayWithDotsProps) {
  const dateKey = format(day.date, 'yyyy-MM-dd');
  const statuses = dateStatuses[dateKey] || [];

  // Dedupe and sort: overdue > pending > paid
  const uniqueStatuses = [...new Set(statuses)].sort((a, b) => {
    const order = { overdue: 0, pending: 1, paid: 2 };
    return order[a] - order[b];
  });

  // Limit to 3 dots max for visual clarity
  const displayStatuses = uniqueStatuses.slice(0, 3);

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

      {displayStatuses.length > 0 && !isLoading && (
        <div className="absolute bottom-0.5 flex gap-0.5">
          {displayStatuses.map((status, idx) => (
            <span
              key={`${status}-${idx}`}
              className={cn('h-1 w-1 rounded-full', STATUS_COLORS[status])}
              aria-label={`${status} bill`}
            />
          ))}
        </div>
      )}
    </button>
  );
}
