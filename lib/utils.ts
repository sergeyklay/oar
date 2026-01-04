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
 * Calculate precise filter boundaries for post-query filtering.
 *
 * Filter boundaries determine which timestamps belong to a given calendar month
 * in the user's local timezone. The boundaries are calculated by offsetting
 * UTC midnight to match midnight in the user's timezone.
 *
 * @param year - Year number
 * @param month - Month number (1-12)
 * @param boundaries - Month boundary metadata from calculateMonthBoundaries()
 * @param userOffsetHours - User's timezone offset in hours from UTC (default: 0)
 *                          Positive for east (e.g., 1 for UTC+1 Poland)
 *                          Negative for west (e.g., -5 for UTC-5 New York)
 * @returns Filter boundaries as UTC timestamps (milliseconds)
 *
 * @example
 * // For a user in Poland (UTC+1) viewing January 2026:
 * const boundaries = calculateMonthBoundaries(2026, 1);
 * const filter = calculateFilterBoundaries(2026, 1, boundaries, 1);
 * // filter.filterStartUTC = Dec 31, 2025 23:00:00 UTC (= Jan 1 00:00 Poland)
 * // filter.filterEndUTC = Jan 31, 2026 22:59:59.999 UTC (= Jan 31 23:59:59.999 Poland)
 */
export function calculateFilterBoundaries(
  year: number,
  month: number,
  boundaries: MonthBoundaries,
  userOffsetHours: number = 0
): FilterBoundaries {
  const { prevMonthYear, prevMonth, lastDayOfPrevMonth } = boundaries;

  // Calculate the hour in UTC that corresponds to midnight in user's timezone
  // For UTC+1: midnight local = 23:00 UTC previous day
  // For UTC-5: midnight local = 05:00 UTC same day
  // Formula: UTC hour = 24 - offset (mod 24)
  const midnightUTCHour = (24 - userOffsetHours) % 24;

  // Determine if we need to adjust the date for the start boundary
  // For positive offsets (east of UTC), midnight local is on previous UTC day
  // For negative offsets (west of UTC), midnight local is on same or next UTC day
  let startDay: number;
  let startMonth: number;
  let startYear: number;

  if (userOffsetHours > 0) {
    // East of UTC: target month's midnight is on previous UTC day
    // e.g., Jan 1 00:00 in UTC+1 = Dec 31 23:00 UTC
    startDay = lastDayOfPrevMonth;
    startMonth = prevMonth;
    startYear = prevMonthYear;
  } else {
    // UTC or west of UTC: target month's midnight is on same or later UTC day
    // e.g., Jan 1 00:00 in UTC-5 = Jan 1 05:00 UTC
    startDay = 1;
    startMonth = month;
    startYear = year;
  }

  // filterStartUTC: midnight of target month's first day in user's timezone
  const filterStartUTC = Date.UTC(startYear, startMonth - 1, startDay, midnightUTCHour, 0, 0, 0);

  // Get last day of target month
  const lastDayOfTargetMonth = new Date(year, month, 0).getDate();

  // filterEndUTC: 23:59:59.999 of target month's last day in user's timezone
  // This is midnightUTCHour - 1 hour (or 23 if midnightUTCHour is 0), minus 1ms
  let endHour: number;
  let endDay: number;
  let endMonth: number;
  let endYear: number;

  if (userOffsetHours > 0) {
    // East of UTC: last moment of month is on same UTC day but earlier hour
    // e.g., Jan 31 23:59:59.999 in UTC+1 = Jan 31 22:59:59.999 UTC
    endHour = midnightUTCHour - 1;
    if (endHour < 0) {
      endHour = 23;
    }
    endDay = lastDayOfTargetMonth;
    endMonth = month;
    endYear = year;
  } else if (userOffsetHours < 0) {
    // West of UTC: last moment of month spills into next UTC day
    // e.g., Jan 31 23:59:59.999 in UTC-5 = Feb 1 04:59:59.999 UTC
    endHour = midnightUTCHour - 1;
    if (endHour < 0) {
      endHour = 23;
      // Still on same day
      endDay = lastDayOfTargetMonth;
      endMonth = month;
      endYear = year;
    } else {
      // Spills into next day
      endDay = 1;
      endMonth = boundaries.nextMonth;
      endYear = boundaries.nextMonthYear;
    }
  } else {
    // UTC: straightforward
    endHour = 23;
    endDay = lastDayOfTargetMonth;
    endMonth = month;
    endYear = year;
  }

  const filterEndUTC = Date.UTC(endYear, endMonth - 1, endDay, endHour, 59, 59, 999);

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
 * Calculate day filter boundaries for a specific date in the user's timezone.
 *
 * This function calculates the UTC timestamps that represent the start and end
 * of a given day in the user's local timezone. Used for filtering payments
 * or bills that fall on a specific date.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param userOffsetHours - User's timezone offset in hours from UTC (default: 0)
 * @returns Object with startUTC and endUTC timestamps in milliseconds
 *
 * @example
 * // For a user in Poland (UTC+1) viewing January 15, 2026:
 * const boundaries = calculateDayFilterBoundaries('2026-01-15', 1);
 * // boundaries.startUTC = Jan 14, 2026 23:00:00 UTC (= Jan 15 00:00 Poland)
 * // boundaries.endUTC = Jan 15, 2026 22:59:59.999 UTC (= Jan 15 23:59:59.999 Poland)
 */
export function calculateDayFilterBoundaries(
  dateStr: string,
  userOffsetHours: number = 0
): FilterBoundaries {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Calculate the hour in UTC that corresponds to midnight in user's timezone
  const midnightUTCHour = (24 - userOffsetHours) % 24;

  let startDay = day;
  let startMonth = month;
  let startYear = year;

  if (userOffsetHours > 0) {
    // East of UTC: target day's midnight is on previous UTC day
    // e.g., Jan 15 00:00 in UTC+1 = Jan 14 23:00 UTC
    if (day === 1) {
      // Roll back to previous month
      const prevMonthDate = new Date(year, month - 2, 1); // month-2 because Date uses 0-indexed months
      startYear = prevMonthDate.getFullYear();
      startMonth = prevMonthDate.getMonth() + 1;
      startDay = new Date(year, month - 1, 0).getDate(); // Last day of previous month
    } else {
      startDay = day - 1;
    }
  }

  const filterStartUTC = Date.UTC(startYear, startMonth - 1, startDay, midnightUTCHour, 0, 0, 0);

  // End is 23:59:59.999 of the target day in user's timezone
  let endHour: number;
  let endDay = day;
  let endMonth = month;
  let endYear = year;

  if (userOffsetHours > 0) {
    // East of UTC: last moment of day is on same UTC day but earlier hour
    endHour = midnightUTCHour - 1;
    if (endHour < 0) {
      endHour = 23;
    }
  } else if (userOffsetHours < 0) {
    // West of UTC: last moment of day spills into next UTC day
    endHour = midnightUTCHour - 1;
    if (endHour < 0) {
      endHour = 23;
    } else {
      // Spills into next day
      const nextDayDate = new Date(year, month - 1, day + 1);
      endDay = nextDayDate.getDate();
      endMonth = nextDayDate.getMonth() + 1;
      endYear = nextDayDate.getFullYear();
    }
  } else {
    // UTC: straightforward
    endHour = 23;
  }

  const filterEndUTC = Date.UTC(endYear, endMonth - 1, endDay, endHour, 59, 59, 999);

  return { filterStartUTC, filterEndUTC };
}

/**
 * Calculate year filter boundaries for the user's timezone.
 *
 * @param year - Year number (e.g., 2025)
 * @param userOffsetHours - User's timezone offset in hours from UTC (default: 0)
 * @returns Object with startUTC and endUTC timestamps in milliseconds
 */
export function calculateYearFilterBoundaries(
  year: number,
  userOffsetHours: number = 0
): FilterBoundaries {
  // Calculate midnight UTC hour for user's timezone
  const midnightUTCHour = (24 - userOffsetHours) % 24;

  let startYear = year;
  let startMonth = 1;
  let startDay = 1;

  if (userOffsetHours > 0) {
    // East of UTC: Jan 1 00:00 local = Dec 31 previous year in UTC
    startYear = year - 1;
    startMonth = 12;
    startDay = 31;
  }

  const filterStartUTC = Date.UTC(startYear, startMonth - 1, startDay, midnightUTCHour, 0, 0, 0);

  // End is Dec 31 23:59:59.999 of target year
  let endYear = year;
  let endMonth = 12;
  let endDay = 31;
  let endHour: number;

  if (userOffsetHours > 0) {
    endHour = midnightUTCHour - 1;
    if (endHour < 0) {
      endHour = 23;
    }
  } else if (userOffsetHours < 0) {
    endHour = midnightUTCHour - 1;
    if (endHour < 0) {
      endHour = 23;
    } else {
      // Spills into next year
      endYear = year + 1;
      endMonth = 1;
      endDay = 1;
    }
  } else {
    endHour = 23;
  }

  const filterEndUTC = Date.UTC(endYear, endMonth - 1, endDay, endHour, 59, 59, 999);

  return { filterStartUTC, filterEndUTC };
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
