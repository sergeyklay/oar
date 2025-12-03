'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { getBillDatesForMonth, type DateStatusMap } from '@/actions/calendar';
import { useCalendarState } from './useCalendarState';
import { DayWithDots } from './DayWithDots';
import { parse, format } from 'date-fns';

export function CalendarWidget() {
  const { month, date, setMonth, setDate, clearDate } = useCalendarState();
  const [dateStatuses, setDateStatuses] = useState<DateStatusMap>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch bill dates when month changes
  useEffect(() => {
    let cancelled = false;

    async function fetchDates() {
      setIsLoading(true);
      try {
        const data = await getBillDatesForMonth(month);
        if (!cancelled) {
          setDateStatuses(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDates();
    return () => {
      cancelled = true;
    };
  }, [month]);

  // Parse month string to Date for calendar
  const monthDate = parse(month, 'yyyy-MM', new Date());

  // Parse selected date if present
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined;

  // Handle date selection (toggle behavior)
  const handleSelect = useCallback(
    (newDate: Date | undefined) => {
      if (!newDate) {
        clearDate();
        return;
      }

      // Toggle: if clicking same date, deselect
      const newDateStr = format(newDate, 'yyyy-MM-dd');
      if (date === newDateStr) {
        clearDate();
      } else {
        setDate(newDate);
      }
    },
    [date, setDate, clearDate]
  );

  // Handle month navigation
  const handleMonthChange = useCallback(
    (newMonth: Date) => {
      setMonth(newMonth);
    },
    [setMonth]
  );

  return (
    <div className="calendar-widget">
      <Calendar
        mode="single"
        month={monthDate}
        onMonthChange={handleMonthChange}
        selected={selectedDate}
        onSelect={handleSelect}
        className="rounded-md border-0"
        classNames={{
          day: 'relative',
        }}
        components={{
          DayButton: (props) => (
            <DayWithDots
              {...props}
              dateStatuses={dateStatuses}
              isLoading={isLoading}
            />
          ),
        }}
      />

      {date && selectedDate && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Showing bills for</p>
          <p className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
          <button
            onClick={clearDate}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
