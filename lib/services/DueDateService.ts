import { differenceInDays, differenceInMonths, startOfDay } from 'date-fns';
import type { BillStatus } from '@/lib/types';

/**
 * Service for due date formatting.
 *
 * Provides human-readable relative date strings for bill due dates.
 */
export const DueDateService = {
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

    const today = startOfDay(new Date());
    const target = startOfDay(dueDate);
    const diffDays = differenceInDays(target, today);

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

    const months = differenceInMonths(target, today);

    if (months === 1 || diffDays <= 45) {
      return 'Due in about 1 month';
    }

    if (months <= 5) {
      return `Due in ${months} months`;
    }

    return 'Due in over 6 months';
  },
};
