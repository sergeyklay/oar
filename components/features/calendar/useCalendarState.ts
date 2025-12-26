'use client';

import { useQueryStates, parseAsString } from 'nuqs';
import { useCallback } from 'react';
import { format, startOfMonth } from 'date-fns';
import { getCurrentMonth } from '@/lib/utils';

/**
 * URL state hook for calendar navigation and date selection.
 *
 * Returns:
 * - month: Current visible month (YYYY-MM)
 * - date: Selected date (YYYY-MM-DD) or null
 * - setMonth: Navigate to a different month (clears date)
 * - setDate: Select a specific date
 * - clearDate: Deselect current date
 */
export function useCalendarState() {
  const [params, setParams] = useQueryStates(
    {
      month: parseAsString.withDefault(getCurrentMonth()),
      date: parseAsString,
      selectedBill: parseAsString,
    },
    {
      shallow: false, // Trigger server re-render
    }
  );

  const setMonth = useCallback(
    (newMonth: Date) => {
      setParams({
        month: format(newMonth, 'yyyy-MM'),
        date: null, // Clear date when changing months
        selectedBill: null, // Clear selection when navigating
      });
    },
    [setParams]
  );

  const setDate = useCallback(
    (newDate: Date | null) => {
      if (!newDate) {
        setParams({ date: null, selectedBill: null });
        return;
      }
      setParams({
        date: format(newDate, 'yyyy-MM-dd'),
        month: format(startOfMonth(newDate), 'yyyy-MM'),
        selectedBill: null, // Clear selection when selecting a day
      });
    },
    [setParams]
  );

  const clearDate = useCallback(() => {
    setParams({ date: null, selectedBill: null });
  }, [setParams]);

  return {
    month: params.month,
    date: params.date,
    selectedBill: params.selectedBill,
    setMonth,
    setDate,
    clearDate,
  };
}
