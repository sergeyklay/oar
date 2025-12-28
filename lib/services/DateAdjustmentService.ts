import { getDay, addDays } from 'date-fns';
import type { WeekendAdjustmentStrategy } from '@/lib/types';

/**
 * Service for adjusting payment dates that fall on weekends.
 *
 * This service provides pure utility functions for weekend date adjustments.
 * It does not interact with the database or other services beyond date calculations.
 *
 * The adjustment logic separates "anchor dates" (used for recurrence calculations)
 * from "payment dates" (displayed to users). Anchor dates are stored in the database
 * and used for recurrence calculations to prevent date drift. Payment dates are
 * calculated on-the-fly by applying weekend adjustments to anchor dates.
 */
export const DateAdjustmentService = {
  /**
   * Checks if a date falls on a weekend (Saturday or Sunday).
   *
   * @param date - Date to check
   * @returns `true` if date is Saturday (6) or Sunday (0), `false` otherwise
   */
  isWeekend(date: Date): boolean {
    const dayOfWeek = getDay(date);
    return dayOfWeek === 0 || dayOfWeek === 6;
  },

  /**
   * Applies weekend adjustment strategy to a payment date.
   *
   * If the date is not a weekend or strategy is 'unchanged', returns the date unchanged.
   * Otherwise, adjusts the date according to the strategy:
   * - 'next_business_day': Saturday → Monday, Sunday → Monday
   * - 'previous_business_day': Saturday → Friday, Sunday → Friday
   *
   * @param date - Anchor date (may be a weekend)
   * @param strategy - Weekend adjustment strategy to apply
   * @returns Adjusted date or original date if no adjustment needed
   */
  adjustPaymentDate(
    date: Date,
    strategy: WeekendAdjustmentStrategy
  ): Date {
    if (strategy === 'unchanged') {
      return date;
    }

    const dayOfWeek = getDay(date);

    // Sunday (0)
    if (dayOfWeek === 0) {
      if (strategy === 'next_business_day') {
        return addDays(date, 1); // Monday
      }
      if (strategy === 'previous_business_day') {
        return addDays(date, -2); // Friday
      }
    }

    // Saturday (6)
    if (dayOfWeek === 6) {
      if (strategy === 'next_business_day') {
        return addDays(date, 2); // Monday
      }
      if (strategy === 'previous_business_day') {
        return addDays(date, -1); // Friday
      }
    }

    // Weekday - no adjustment needed
    return date;
  },

  /**
   * Resolves the effective weekend adjustment strategy.
   *
   * Returns the bill-specific override if set, otherwise returns the global default.
   *
   * @param billStrategy - Bill-specific override (null = use global)
   * @param globalStrategy - Global default strategy
   * @returns Effective strategy to use for adjustment
   */
  getEffectiveStrategy(
    billStrategy: WeekendAdjustmentStrategy | null,
    globalStrategy: WeekendAdjustmentStrategy
  ): WeekendAdjustmentStrategy {
    return billStrategy ?? globalStrategy;
  },
};

