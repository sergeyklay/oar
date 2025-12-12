import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { format } from 'date-fns';

/**
 * Returns current month in YYYY-MM format.
 */
function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Calendar and filter URL search params schema.
 *
 * - month: Current visible month (YYYY-MM)
 * - date: Selected specific date (YYYY-MM-DD)
 * - tag: Filter by tag slug (e.g., "business")
 * - selectedBill: Currently selected bill ID for detail view
 */
export const calendarSearchParams = {
  month: parseAsString.withDefault(getCurrentMonth()),
  date: parseAsString,
  tag: parseAsString,
  selectedBill: parseAsString,
};

/**
 * Server-side cache for reading search params in RSC.
 */
export const searchParamsCache = createSearchParamsCache(calendarSearchParams);
