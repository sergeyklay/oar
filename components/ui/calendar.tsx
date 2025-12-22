'use client';

import * as React from 'react';
import { Triangle, Circle } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = DayPickerProps & {
  onGoToToday?: () => void;
};

/**
 * Compares two dates at month granularity.
 * @returns true if date `a` is after date `b` at the month level.
 */
function isAfterMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() > b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() && a.getMonth() > b.getMonth())
  );
}

/**
 * Compares two dates at month granularity.
 * @returns true if date `a` is before date `b` at the month level.
 */
function isBeforeMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth())
  );
}

function formatWeekdayName(date: Date): string {
  return formatDate(date, 'EEE').toUpperCase();
}

const navButtonClass = cn(
  buttonVariants({ variant: 'ghost' }),
  'h-4 w-4 p-0 opacity-50 hover:opacity-100 cursor-pointer inline-flex items-center justify-center [&_svg]:size-3'
);

interface CalendarHeaderProps {
  displayMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  canGoToPreviousMonth: boolean;
  canGoToNextMonth: boolean;
}

function CalendarHeader({
  displayMonth,
  onPreviousMonth,
  onNextMonth,
  onGoToToday,
  canGoToPreviousMonth,
  canGoToNextMonth,
}: CalendarHeaderProps) {
  const formattedCaption = formatDate(displayMonth, 'LLLL yyyy');

  return (
    <div className="flex justify-between items-center w-full mb-3">
      <span className="text-sm font-medium">{formattedCaption}</span>
      <div className="flex items-center">
        <button
          type="button"
          className={navButtonClass}
          disabled={!canGoToPreviousMonth}
          onClick={onPreviousMonth}
          aria-label="Previous month"
        >
          <Triangle className="h-2.5 w-2.5 fill-current -rotate-90" />
        </button>
        <button
          type="button"
          className={cn(navButtonClass, 'mx-0.5')}
          onClick={onGoToToday}
          aria-label="Go to today"
        >
          <Circle className="h-2 w-2 fill-current" />
        </button>
        <button
          type="button"
          className={navButtonClass}
          disabled={!canGoToNextMonth}
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <Triangle className="h-2.5 w-2.5 fill-current rotate-90" />
        </button>
      </div>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onGoToToday,
  month: controlledMonth,
  onMonthChange,
  startMonth,
  endMonth,
  ...props
}: CalendarProps) {
  // Support uncontrolled mode with internal state
  const [internalMonth, setInternalMonth] = React.useState(new Date());

  const isControlled = controlledMonth !== undefined;
  const displayMonth = isControlled ? controlledMonth : internalMonth;

  const handleMonthChange = React.useCallback(
    (newMonth: Date) => {
      if (!isControlled) {
        setInternalMonth(newMonth);
      }
      onMonthChange?.(newMonth);
    },
    [isControlled, onMonthChange]
  );

  const canGoToPreviousMonth = startMonth
    ? isAfterMonth(displayMonth, startMonth)
    : true;

  const canGoToNextMonth = endMonth
    ? isBeforeMonth(displayMonth, endMonth)
    : true;

  const handlePreviousMonth = () => {
    const prevMonth = new Date(displayMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    handleMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(displayMonth);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    handleMonthChange(nextMonthDate);
  };

  const handleGoToToday = () => {
    if (onGoToToday) {
      onGoToToday();
    } else {
      handleMonthChange(new Date());
    }
  };

  return (
    <div className={cn('p-3 w-fit', className)}>
      <CalendarHeader
        displayMonth={displayMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onGoToToday={handleGoToToday}
        canGoToPreviousMonth={canGoToPreviousMonth}
        canGoToNextMonth={canGoToNextMonth}
      />
      <DayPicker
        showOutsideDays={showOutsideDays}
        hideNavigation
        month={displayMonth}
        onMonthChange={handleMonthChange}
        startMonth={startMonth}
        endMonth={endMonth}
        classNames={{
          months: 'flex flex-col w-fit',
          month: 'flex flex-col',
          month_caption: 'hidden',
          caption_label: 'hidden',
          month_grid: 'border-collapse',
          weekdays: 'flex',
          weekday:
            'text-muted-foreground w-10 font-medium text-[0.7rem] uppercase tracking-wide',
          week: 'flex mt-1',
          day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent rounded-full',
          day_button: cn(
            buttonVariants({ variant: 'ghost' }),
            'h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full cursor-pointer'
          ),
          range_start: 'day-range-start rounded-l-full',
          range_end: 'day-range-end rounded-r-full',
          selected:
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full',
          today: 'bg-accent text-accent-foreground rounded-full',
          outside: 'outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
          disabled: 'text-muted-foreground opacity-50',
          range_middle:
            'aria-selected:bg-accent aria-selected:text-accent-foreground',
          hidden: 'invisible',
          ...classNames,
        }}
        formatters={{
          formatWeekdayName,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
