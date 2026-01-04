'use client';

import { useEffect, useRef } from 'react';
import { TIMEZONE_COOKIE_NAME } from '@/lib/timezone';

/**
 * Client component that detects the user's browser timezone and stores it in a cookie.
 *
 * This component renders nothing visible. It runs once on mount to detect the timezone
 * offset and set a cookie that can be read by Server Components and Server Actions.
 *
 * The timezone offset is calculated as the difference between UTC and local time,
 * expressed in hours. For example:
 * - Poland (CET/UTC+1): offset = 1
 * - New York (EST/UTC-5): offset = -5
 * - Japan (JST/UTC+9): offset = 9
 *
 * @example
 * // In app/layout.tsx
 * <TimezoneProvider />
 */
export function TimezoneProvider() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per page load
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;

    // Get the current timezone offset in minutes (negative for east, positive for west)
    // JavaScript's getTimezoneOffset() returns the opposite sign of what we want
    const offsetMinutes = new Date().getTimezoneOffset();

    // Convert to hours and flip the sign to get standard offset notation
    // getTimezoneOffset() returns -60 for UTC+1, we want +1
    const offsetHours = -(offsetMinutes / 60);

    // Check if the cookie already has the correct value
    const existingCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${TIMEZONE_COOKIE_NAME}=`));

    if (existingCookie) {
      const existingValue = existingCookie.split('=')[1];
      const existingOffset = Number.parseFloat(existingValue);
      if (!Number.isNaN(existingOffset) && Math.abs(existingOffset - offsetHours) < 0.01) {
        // Cookie already has the correct value, no need to update
        return;
      }
    }

    // Set the cookie with a long expiry (1 year)
    // SameSite=Lax ensures it's sent with navigation requests
    const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
    document.cookie = `${TIMEZONE_COOKIE_NAME}=${offsetHours}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }, []);

  // This component renders nothing
  return null;
}
