'use client';

import { useEffect, useState } from 'react';
import { format, isValid } from 'date-fns';

interface ClientDateProps {
  date: string | number | Date | null | undefined;
  format?: string;
  className?: string;
}

/**
 * ClientDate
 *
 * Safely formats dates in client components to prevent hydration mismatches.
 * Returns a non-breaking space during SSR to preserve layout.
 *
 * @param props - Component props.
 * @param props.date - Date value to format (string, number, Date, null, or undefined).
 * @param props.format - Date format string (default: 'dd MMM yyyy').
 * @param props.className - Optional CSS class name.
 * @returns Formatted date string or placeholder during SSR.
 */
export function ClientDate({
  date,
  format: formatStr = 'dd MMM yyyy',
  className,
}: ClientDateProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted || !date) {
    return <span className={className}>&nbsp;</span>;
  }

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  if (!isValid(dateObj)) {
    return null;
  }

  return <span className={className}>{format(dateObj, formatStr)}</span>;
}

