import { RRule, Frequency } from 'rrule';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { bills, type BillFrequency } from '@/db/schema';

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
   * @returns Promise with counts of bills checked and updated
   */
  async checkDailyBills(): Promise<{ checked: number; updated: number }> {
    // 1. Query candidates: pending, non-archived bills
    const candidates = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.status, 'pending'),
          eq(bills.isArchived, false)
        )
      );

    // 2. Track update count
    let updated = 0;

    // 3. Check each bill and update if overdue
    for (const bill of candidates) {
      const newStatus = this.deriveStatus(bill.dueDate);

      if (newStatus === 'overdue') {
        await db
          .update(bills)
          .set({
            status: 'overdue',
            updatedAt: new Date(),
          })
          .where(eq(bills.id, bill.id));

        updated++;

        console.log(
          `[RecurrenceService] Bill "${bill.title}" marked overdue (was due ${bill.dueDate.toISOString()})`
        );
      }
    }

    // 4. Return metrics
    return {
      checked: candidates.length,
      updated,
    };
  },
};
