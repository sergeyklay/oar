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

  /**
   * Daily batch job: Check all pending bills and update overdue status.
   *
   * Called by SchedulerService at midnight daily.
   *
   * Business Logic (TODO - implement in Phase 2):
   * 1. Query all bills WHERE status = 'pending' AND isArchived = false
   * 2. For each bill, call deriveStatus(dueDate)
   * 3. If status changed to 'overdue', update database
   * 4. Return count of bills updated
   *
   * @returns Promise with counts of bills checked and updated
   */
  async checkDailyBills(): Promise<{ checked: number; updated: number }> {
    // TODO: Implement actual bill checking logic in Phase 2
    // This stub allows the infrastructure to be tested without database access
    console.log('[RecurrenceService] checkDailyBills called (stub)');

    // Stub return - no bills checked or updated
    return { checked: 0, updated: 0 };
  },
};
