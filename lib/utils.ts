import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, endOfMonth, getDate, setDate } from 'date-fns';

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
 * Generates a URL-safe slug from a string.
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
 * Returns current month in YYYY-MM format.
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
 * Clamps a date to the end of month if the original due day doesn't exist.
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
