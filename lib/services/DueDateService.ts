import { differenceInDays, differenceInMonths, startOfDay } from 'date-fns';
import type { BillStatus } from '@/lib/types';

/** Tailwind CSS class for status bar background color. */
export type StatusBarColor = 'bg-emerald-500' | 'bg-red-500' | 'bg-blue-500' | 'bg-amber-500';

/**
 * Service for due date formatting and status display.
 *
 * Provides human-readable relative date strings and visual status indicators.
 */
export const DueDateService = {
  /**
   * Returns the Tailwind CSS class for the status bar color.
   *
   * @param dueDate - The bill's due date.
   * @param status - The bill's current status.
   * @returns Tailwind background color class.
   */
  getStatusBarColor(dueDate: Date, status: BillStatus): StatusBarColor {
    if (status === 'paid') {
      return 'bg-emerald-500';
    }

    if (status === 'overdue') {
      return 'bg-red-500';
    }

    const daysUntilDue = this.getDaysUntilDue(dueDate);

    if (daysUntilDue > 30) {
      return 'bg-blue-500';
    }

    return 'bg-amber-500';
  },

  /**
   * Calculates days until the due date from today.
   *
   * @param dueDate - The bill's due date.
   * @returns Number of days (negative if overdue).
   */
  getDaysUntilDue(dueDate: Date): number {
    const today = startOfDay(new Date());
    const target = startOfDay(dueDate);
    return differenceInDays(target, today);
  },

  /**
   * Format a due date as a human-readable relative string.
   *
   * For paid bills (one-time only), returns "Paid" instead of relative date.
   * Recurring bills never have 'paid' status after payment - they advance
   * to the next billing cycle.
   *
   * @param dueDate - The bill's due date.
   * @param status - The bill's current status.
   * @returns Human-readable string (e.g., "Due in 3 days", "Overdue by 1 day", "Paid").
   */
  formatRelativeDueDate(dueDate: Date, status: BillStatus): string {
    if (status === 'paid') {
      return 'Paid';
    }

    const diffDays = this.getDaysUntilDue(dueDate);

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return absDays === 1 ? 'Overdue by 1 day' : `Overdue by ${absDays} days`;
    }

    if (diffDays === 0) {
      return 'Due today';
    }

    if (diffDays === 1) {
      return 'Due tomorrow';
    }

    if (diffDays <= 6) {
      return `Due in ${diffDays} days`;
    }

    if (diffDays === 7) {
      return 'Due in 1 week';
    }

    if (diffDays <= 13) {
      return `Due in ${diffDays} days`;
    }

    if (diffDays <= 27) {
      const weeks = Math.floor(diffDays / 7);
      return `Due in ${weeks} weeks`;
    }

    const today = startOfDay(new Date());
    const target = startOfDay(dueDate);
    const months = differenceInMonths(target, today);

    if (months === 1 || diffDays <= 45) {
      return 'Due in about 1 month';
    }

    if (months <= 5) {
      return `Due in ${months} months`;
    }

    if (months === 6) {
      return 'Due in over 6 months';
    }

    if (months === 7) {
      return 'Due in over 7 months';
    }

    if (months === 8) {
      return 'Due in over 8 months';
    }

    if (months === 9) {
      return 'Due in over 9 months';
    }

    if (months === 10) {
      return 'Due in over 10 months';
    }

    if (months === 11) {
      return 'Due in over 11 months';
    }

    if (months === 12) {
      return 'Due in about a year';
    }

    return 'Due in over a year';
  },
};
