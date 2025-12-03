import { RRule, Frequency } from 'rrule';
import type { BillFrequency } from '@/db/schema';

/**
 * Maps simple frequency enum to rrule Frequency.
 *
 * Decision: Keep simple enum in DB, use rrule for calculations.
 * Future: Can migrate to full rrule string storage if complex rules needed.
 */
const FREQUENCY_MAP: Record<BillFrequency, Frequency | null> = {
  once: null,
  monthly: Frequency.MONTHLY,
  yearly: Frequency.YEARLY,
};

export const RecurrenceService = {
  /**
   * Calculates the next due date based on frequency.
   *
   * @param currentDueDate - The bill's current due date
   * @param frequency - Bill frequency enum
   * @returns Next due date, or null if bill is one-time
   */
  calculateNextDueDate(
    currentDueDate: Date,
    frequency: BillFrequency
  ): Date | null {
    const rruleFrequency = FREQUENCY_MAP[frequency];

    // One-time bills have no next occurrence
    if (rruleFrequency === null) {
      return null;
    }

    const rule = new RRule({
      freq: rruleFrequency,
      dtstart: currentDueDate,
      count: 2, // Get current + next occurrence
    });

    const occurrences = rule.all();

    // Return the second occurrence (next after current)
    return occurrences[1] ?? null;
  },

  /**
   * Determines bill status based on due date.
   * Compares at day-level to avoid timezone issues.
   *
   * @param dueDate - The bill's due date
   * @returns 'overdue' if past due, 'pending' otherwise
   */
  deriveStatus(dueDate: Date): 'pending' | 'overdue' {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateNormalized = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );

    return dueDateNormalized < today ? 'overdue' : 'pending';
  },
};
