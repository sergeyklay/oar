import { cookies } from 'next/headers';

/**
 * Cookie name for storing the user's timezone offset.
 *
 * The value stored is the offset in hours from UTC (e.g., 1 for UTC+1, -5 for UTC-5).
 * This is set by the TimezoneProvider client component on mount.
 */
export const TIMEZONE_COOKIE_NAME = 'oar-tz-offset';

/**
 * Default timezone offset (UTC) used when no cookie is available.
 *
 * UTC is a safe fallback that works correctly for users in any timezone,
 * though month boundaries will align to UTC midnight instead of local midnight.
 */
export const DEFAULT_TIMEZONE_OFFSET_HOURS = 0;

/**
 * Get the user's timezone offset from the cookie.
 *
 * This function reads the timezone offset that was set by the TimezoneProvider
 * client component. The offset is in hours from UTC (positive for east, negative for west).
 *
 * Must be called from Server Components, Server Actions, or Route Handlers
 * where the cookies() function is available.
 *
 * @returns The user's timezone offset in hours (e.g., 1 for UTC+1, -5 for UTC-5)
 *
 * @example
 * const offset = await getUserTimezoneOffset();
 * // Returns 1 for a user in Poland (CET/UTC+1)
 * // Returns -5 for a user in New York (EST/UTC-5)
 * // Returns 0 if no cookie is set
 */
export async function getUserTimezoneOffset(): Promise<number> {
  const cookieStore = await cookies();
  const tzCookie = cookieStore.get(TIMEZONE_COOKIE_NAME);

  if (!tzCookie?.value) {
    return DEFAULT_TIMEZONE_OFFSET_HOURS;
  }

  const parsed = parseFloat(tzCookie.value);

  // Validate the offset is within reasonable bounds (UTC-12 to UTC+14)
  if (isNaN(parsed) || parsed < -12 || parsed > 14) {
    return DEFAULT_TIMEZONE_OFFSET_HOURS;
  }

  return parsed;
}
