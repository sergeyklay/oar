import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { format } from 'date-fns';
import { DEFAULT_SETTINGS_CATEGORY } from '@/lib/constants';

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

/**
 * Settings page URL search params schema.
 *
 * - category: Selected settings category slug (default: "general")
 */
export const settingsSearchParams = {
  category: parseAsString.withDefault(DEFAULT_SETTINGS_CATEGORY),
};

/**
 * Server-side cache for reading settings page search params in RSC.
 */
export const settingsSearchParamsCache = createSearchParamsCache(settingsSearchParams);

/**
 * Forecast view URL search params schema.
 *
 * - month: Selected month (YYYY-MM, defaults to current month)
 * - tag: Filter by tag slug (optional)
 */
export const forecastSearchParams = {
  month: parseAsString.withDefault(getCurrentMonth()),
  tag: parseAsString,
};

/**
 * Server-side cache for reading forecast page search params in RSC.
 */
export const forecastSearchParamsCache = createSearchParamsCache(forecastSearchParams);
