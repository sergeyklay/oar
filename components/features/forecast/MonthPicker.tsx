'use client';

import { useQueryState } from 'nuqs';
import { parseAsString } from 'nuqs';
import { format, parse, startOfMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

interface MonthPickerProps {
  /** Default month in YYYY-MM format */
  defaultMonth?: string;
}

/**
 * MonthPicker
 *
 * Calendar popover for selecting a month in forecast view.
 * Updates URL search param via nuqs.
 */
export function MonthPicker({ defaultMonth }: MonthPickerProps) {
  const [month, setMonth] = useQueryState(
    'month',
    parseAsString.withDefault(defaultMonth ?? getCurrentMonth()).withOptions({
      shallow: false,
    })
  );

  const monthDate = month ? parse(month, 'yyyy-MM', new Date()) : new Date();

  const handleMonthChange = (newMonth: Date) => {
    const monthStr = format(startOfMonth(newMonth), 'yyyy-MM');
    setMonth(monthStr);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(monthDate, 'MMMM yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          month={monthDate}
          onMonthChange={handleMonthChange}
          className="rounded-md border-0"
        />
      </PopoverContent>
    </Popover>
  );
}

