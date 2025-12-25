'use client';

import { useEffect, useState, useCallback } from 'react';
import type { DayButtonProps } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { getBillDatesForMonth, type DateStatusMap, type PaymentDateMap } from '@/actions/calendar';
import { useCalendarState } from './useCalendarState';
import { DayWithDots } from './DayWithDots';
import { parse, format } from 'date-fns';

interface CalendarWidgetProps {
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Disable date filter feedback (hide "Showing bills for..." message) */
  disableDateFilter?: boolean;
  /** Controls calendar dot rendering mode */
  dotMode?: 'status' | 'payment' | 'none';
  /** Custom function to fetch date data (for payment dates) */
  getDateData?: (month: string) => Promise<DateStatusMap | PaymentDateMap>;
}

export function CalendarWidget({ weekStartsOn = 0, disableDateFilter = false, dotMode = 'status', getDateData }: CalendarWidgetProps) {
  const { month, date, setMonth, setDate, clearDate } = useCalendarState();
  const [dateStatuses, setDateStatuses] = useState<DateStatusMap>({});
  const [paymentDates, setPaymentDates] = useState<PaymentDateMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDates() {
      setIsLoading(true);
      try {
        if (dotMode === 'payment' && getDateData) {
          const data = await getDateData(month);
          if (!cancelled) {
            setPaymentDates(data as PaymentDateMap);
            setDateStatuses({});
          }
        } else {
          const data = await getBillDatesForMonth(month);
          if (!cancelled) {
            setDateStatuses(data);
            setPaymentDates({});
          }
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
  }, [month, dotMode, getDateData]);

  const monthDate = parse(month, 'yyyy-MM', new Date());
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined;

  const handleSelect = useCallback(
    (newDate: Date | undefined) => {
      if (!newDate) {
        clearDate();
        return;
      }

      const newDateStr = format(newDate, 'yyyy-MM-dd');
      if (date === newDateStr) {
        clearDate();
      } else {
        setDate(newDate);
      }
    },
    [date, setDate, clearDate]
  );

  const handleMonthChange = useCallback(
    (newMonth: Date) => {
      setMonth(newMonth);
    },
    [setMonth]
  );

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    setMonth(today);
  }, [setMonth]);

  return (
    <div className="calendar-widget w-full border-b border-border pb-4">
      <Calendar
        mode="single"
        month={monthDate}
        onMonthChange={handleMonthChange}
        selected={selectedDate}
        onSelect={handleSelect}
        weekStartsOn={weekStartsOn}
        onGoToToday={handleGoToToday}
        className="rounded-md border-0"
        classNames={{
          day: 'relative',
        }}
        components={{
          DayButton: (props: DayButtonProps) => (
            <DayWithDots
              {...props}
              dateStatuses={dateStatuses}
              isLoading={isLoading}
              dotMode={dotMode}
              paymentDates={paymentDates}
            />
          ),
        }}
      />

      {date && selectedDate && !disableDateFilter && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Showing bills for</p>
          <p className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
          <button
            type="button"
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
