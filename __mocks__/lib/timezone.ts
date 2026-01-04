/**
 * Mock for lib/timezone.ts
 *
 * This mock replaces the real timezone module in tests.
 * By default, returns 0 (UTC) for the timezone offset.
 */

/**
 * Mock implementation that returns UTC (0) by default.
 * Tests can override this using jest.mocked().
 */
export const getUserTimezoneOffset = jest.fn().mockResolvedValue(0);
