import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, endOfMonth, getDate, setDate, parseISO } from 'date-fns';

export interface MonthBoundaries {
  prevMonth: number;
  prevMonthYear: number;
  nextMonth: number;
  nextMonthYear: number;
  lastDayOfPrevMonth: number;
}

export interface QueryBoundaries {
  queryStart: Date;
  queryEnd: Date;
}

export interface FilterBoundaries {
  filterStartUTC: number;
  filterEndUTC: number;
}

/**
 * Calculate month boundary metadata for a given year and month.
 *
 * Handle year boundaries (January wraps to previous year, December to next).
 *
 * @param year - Year number (e.g., 2025)
 * @param month - Month number (1-12, 1 = January)
 * @returns Previous/next month info and last day of previous month
 */
export function calculateMonthBoundaries(year: number, month: number): MonthBoundaries {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const lastDayOfPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate();

  return {
    prevMonth,
    prevMonthYear,
    nextMonth,
    nextMonthYear,
    lastDayOfPrevMonth,
  };
}

/**
 * Calculate extended query boundaries to catch all timezone offsets (UTC-12 to UTC+14).
 *
 * @param boundaries - Month boundary metadata from calculateMonthBoundaries()
 * @returns Query start/end as UTC Date objects
 */
export function calculateExtendedQueryBoundaries(boundaries: MonthBoundaries): QueryBoundaries {
  const { prevMonthYear, prevMonth, lastDayOfPrevMonth, nextMonthYear, nextMonth } = boundaries;

  const queryStart = parseISO(
    `${prevMonthYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}T10:00:00.000Z`
  );
  const queryEnd = parseISO(
    `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01T11:59:59.999Z`
  );

  return { queryStart, queryEnd };
}

/**
 * Calculate precise filter boundaries for post-query filtering (UTC+2 aligned).
 *
 * Filter start: Previous month last day at 22:00 UTC.
 * Filter end: Target month last day at 21:59:59.999 UTC.
 *
 * @param year - Year number
 * @param month - Month number (1-12)
 * @param boundaries - Month boundary metadata from calculateMonthBoundaries()
 * @returns Filter boundaries as UTC timestamps (milliseconds)
 */
export function calculateFilterBoundaries(
  year: number,
  month: number,
  boundaries: MonthBoundaries
): FilterBoundaries {
  const { prevMonthYear, prevMonth, lastDayOfPrevMonth } = boundaries;

  // 22:00 UTC = 00:00 next day in UTC+2 (earliest target month start)
  const filterStartUTC = Date.UTC(prevMonthYear, prevMonth - 1, lastDayOfPrevMonth, 22, 0, 0, 0);

  // Get last day of target month
  const lastDayOfTargetMonth = new Date(year, month, 0).getDate();
  // 21:59:59.999 UTC = 23:59:59.999 previous day in UTC+2 (latest target month end)
  const filterEndUTC = Date.UTC(year, month - 1, lastDayOfTargetMonth, 21, 59, 59, 999);

  return { filterStartUTC, filterEndUTC };
}

/**
 * Check if a timestamp falls within the target month's filter boundaries.
 *
 * @param timestamp - Date or milliseconds since epoch
 * @param filterBoundaries - Boundaries from calculateFilterBoundaries()
 * @returns True if within boundaries, false otherwise
 */
export function isTimestampInMonth(timestamp: Date | number, filterBoundaries: FilterBoundaries): boolean {
  const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return ts >= filterBoundaries.filterStartUTC && ts <= filterBoundaries.filterEndUTC;
}

/**
 * Merge Tailwind CSS classes with clsx
 * Standard utility used by shadcn/ui components
 *
 * @example
 * cn('px-2 py-1', 'py-2') // 'px-2 py-2' (py-2 wins)
 * cn('text-red-500', isActive && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-safe slug from a string.
 *
 * Converts "Business Expenses!" to "business-expenses"
 *
 * @example
 * generateSlug("Business Expenses") // "business-expenses"
 * generateSlug("My Credit Card!") // "my-credit-card"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Return current month in YYYY-MM format.
 *
 * Thin wrapper around format(new Date(), 'yyyy-MM') for consistency across
 * the codebase. Used in multiple places for URL state defaults and month handling.
 *
 * @example
 * getCurrentMonth() // "2026-01"
 */
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Return current year in YYYY format.
 *
 * Thin wrapper around format(new Date(), 'yyyy') for consistency across
 * the codebase. Used for URL state defaults and year handling.
 *
 * @example
 * getCurrentYear() // "2026"
 */
export function getCurrentYear(): string {
  return format(new Date(), 'yyyy');
}

/**
 * Clamp a date to the end of month if the original due day doesn't exist.
 *
 * For bills due on the 29th, 30th, or 31st, this ensures they map to the last
 * valid day of shorter months (e.g., Jan 31 -> Feb 28/29, Apr 30).
 *
 * @param targetMonthStart - Start of the target month to clamp to
 * @param originalDueDay - The original due day (1-31)
 * @param originalTime - Date to preserve time components from (hours, minutes, seconds)
 * @returns Date clamped to the target month with preserved time components
 *
 * @example
 * // Bill due on Jan 31, projecting to February
 * clampToEndOfMonth(new Date(2025, 1, 1), 31, new Date(2025, 0, 31))
 * // Returns: Feb 28, 2025 (or Feb 29 in leap years)
 */
export function clampToEndOfMonth(
  targetMonthStart: Date,
  originalDueDay: number,
  originalTime: Date
): Date {
  const targetMonthEnd = endOfMonth(targetMonthStart);
  const targetMonthLastDay = getDate(targetMonthEnd);

  // Clamp to the last day of the target month if the original due day doesn't exist
  const clampedDay = Math.min(originalDueDay, targetMonthLastDay);
  const clampedDate = setDate(targetMonthStart, clampedDay);

  // Preserve the original time components
  clampedDate.setHours(
    originalTime.getHours(),
    originalTime.getMinutes(),
    originalTime.getSeconds(),
    originalTime.getMilliseconds()
  );

  return clampedDate;
}
