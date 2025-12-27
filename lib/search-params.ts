import { createSearchParamsCache, parseAsString, createParser } from 'nuqs/server';
import { parse, isValid } from 'date-fns';
import { DEFAULT_SETTINGS_CATEGORY } from '@/lib/constants';
import { getCurrentMonth, getCurrentYear } from '@/lib/utils';

/**
 * Validates and parses a month string in YYYY-MM format.
 *
 * Returns null for invalid format or invalid dates, which triggers the default value.
 * Strict validation ensures exactly YYYY-MM format (e.g., "2026-01", not "2026-1").
 */
export const parseAsMonth = createParser({
  parse(queryValue: string): string | null {
    if (typeof queryValue !== 'string') {
      return null;
    }

    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(queryValue)) {
      return null;
    }

    const parsedDate = parse(queryValue, 'yyyy-MM', new Date());
    if (!isValid(parsedDate)) {
      return null;
    }

    const [, month] = queryValue.split('-');
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) {
      return null;
    }

    return queryValue;
  },
  serialize(value: string): string {
    return value;
  },
});

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
  month: parseAsMonth.withDefault(getCurrentMonth()),
  tag: parseAsString,
};

/**
 * Server-side cache for reading forecast page search params in RSC.
 */
export const forecastSearchParamsCache = createSearchParamsCache(forecastSearchParams);

/**
 * Monthly History view URL search params schema.
 *
 * - month: Selected month (YYYY-MM, defaults to current month)
 * - tag: Filter by tag slug (optional)
 */
export const historySearchParams = {
  month: parseAsMonth.withDefault(getCurrentMonth()),
  tag: parseAsString,
};

/**
 * Server-side cache for reading monthly history page search params in RSC.
 */
export const historySearchParamsCache = createSearchParamsCache(historySearchParams);

/**
 * Validates and parses a year string in YYYY format.
 *
 * Returns null for invalid format or invalid dates, which triggers the default value.
 * Strict validation ensures exactly YYYY format (e.g., "2026", not "26").
 */
export const parseAsYear = createParser({
  parse(queryValue: string): string | null {
    if (typeof queryValue !== 'string') {
      return null;
    }

    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(queryValue)) {
      return null;
    }

    const yearNum = parseInt(queryValue, 10);
    if (isNaN(yearNum) || yearNum < 1000 || yearNum > 9999) {
      return null;
    }

    return queryValue;
  },
  serialize(value: string): string {
    return value;
  },
});

/**
 * Annual Spending view URL search params schema.
 *
 * - year: Selected year (YYYY, defaults to current year)
 */
export const annualSpendingSearchParams = {
  year: parseAsYear.withDefault(getCurrentYear()),
};

/**
 * Server-side cache for reading annual spending page search params in RSC.
 */
export const annualSpendingSearchParamsCache = createSearchParamsCache(annualSpendingSearchParams);
