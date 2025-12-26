'use client';

import { useQueryState } from 'nuqs';
import { parse, format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { Triangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

const navButtonClass = cn(
  buttonVariants({ variant: 'ghost' }),
  'h-4 w-4 p-0 opacity-50 hover:opacity-100 cursor-pointer inline-flex items-center justify-center [&_svg]:size-3'
);

interface MonthNavigationProps {
  /** Current month in YYYY-MM format */
  currentMonth: string;
}

/**
 * MonthNavigation
 *
 * Navigation arrows for month selection in forecast view.
 * Updates URL search param via nuqs to trigger server refetch.
 */
export function MonthNavigation({ currentMonth }: MonthNavigationProps) {
  const [, setMonth] = useQueryState('month', {
    defaultValue: getCurrentMonth(),
    shallow: false,
  });

  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(monthDate, 1);
    const monthStr = format(startOfMonth(prevMonth), 'yyyy-MM');
    setMonth(monthStr);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(monthDate, 1);
    const monthStr = format(startOfMonth(nextMonth), 'yyyy-MM');
    setMonth(monthStr);
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className={navButtonClass}
        onClick={handlePreviousMonth}
        aria-label="Previous month"
      >
        <Triangle className="h-2.5 w-2.5 fill-current -rotate-90" />
      </button>
      <button
        type="button"
        className={navButtonClass}
        onClick={handleNextMonth}
        aria-label="Next month"
      >
        <Triangle className="h-2.5 w-2.5 fill-current rotate-90" />
      </button>
    </div>
  );
}

