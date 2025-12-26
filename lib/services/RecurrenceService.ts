import { RRule, Frequency } from 'rrule';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { bills, type BillFrequency } from '@/db/schema';
import { getLogger } from '@/lib/logger';
import { addMonths, getDate, endOfMonth } from 'date-fns';
import { clampToEndOfMonth } from '@/lib/utils';

const logger = getLogger('RecurrenceService');

/**
 * Maps simple frequency enum to rrule Frequency.
 *
 * Decision: Keep simple enum in DB, use rrule for calculations.
 * Future: Can migrate to full rrule string storage if complex rules needed.
 */
const FREQUENCY_MAP: Record<BillFrequency, Frequency | null> = {
  once: null,
  weekly: Frequency.WEEKLY,
  biweekly: Frequency.WEEKLY,
  twicemonthly: Frequency.MONTHLY,
  monthly: Frequency.MONTHLY,
  bimonthly: Frequency.MONTHLY,
  quarterly: Frequency.MONTHLY,
  yearly: Frequency.YEARLY,
};

export const RecurrenceService = {
  /**
   * Calculates the next due date based on frequency.
   *
   * @param currentDueDate - The bill's current due date
   * @param frequency - Bill frequency enum
   * @param endDate - Optional end date. If next due date exceeds this, returns null.
   * @returns Next due date, or null if bill is one-time or end date reached
   */
  calculateNextDueDate(
    currentDueDate: Date,
    frequency: BillFrequency,
    endDate?: Date | null
  ): Date | null {
    const rruleFrequency = FREQUENCY_MAP[frequency];

    // One-time bills have no next occurrence
    if (rruleFrequency === null) {
      return null;
    }

    // Use UTC date with same components as local date to avoid timezone issues with rrule
    const localAsUtc = new Date(Date.UTC(
      currentDueDate.getFullYear(),
      currentDueDate.getMonth(),
      currentDueDate.getDate(),
      currentDueDate.getHours(),
      currentDueDate.getMinutes(),
      currentDueDate.getSeconds()
    ));

    const options: Partial<import('rrule').Options> = {
      freq: rruleFrequency,
      dtstart: localAsUtc,
      count: 2, // Get current + next occurrence
    };

    // Handle intervals for expanded frequencies
    if (frequency === 'biweekly') options.interval = 2;
    if (frequency === 'bimonthly') options.interval = 2;
    if (frequency === 'quarterly') options.interval = 3;

    // Handle twice-monthly logic
    if (frequency === 'twicemonthly') {
      const day = currentDueDate.getDate();
      // Use current day and a day 14 days apart to simulate semi-monthly (e.g., 1st and 15th)
      const secondDay = day <= 14 ? day + 14 : day - 14;
      options.bymonthday = [day, secondDay].sort((a, b) => a - b);
    }

    const rule = new RRule(options);
    const occurrences = rule.all();

    const nextUtc = occurrences[1];

    // Handle end-of-month clamping for monthly frequencies with dates 29-31
    // RRule will skip months where the day doesn't exist, so we handle this case specially
    const originalDueDay = currentDueDate.getDate();
    const needsEndOfMonthClamping =
      (frequency === 'monthly' ||
        frequency === 'bimonthly' ||
        frequency === 'quarterly') &&
      originalDueDay >= 29;

    let nextDueDate: Date | null = null;

    if (needsEndOfMonthClamping && (!nextUtc || occurrences.length < 2)) {
      // Manually calculate the next occurrence with end-of-month clamping
      let monthsToAdd = 1;
      if (frequency === 'bimonthly') monthsToAdd = 2;
      else if (frequency === 'quarterly') monthsToAdd = 3;

      const nextMonthDate = addMonths(currentDueDate, monthsToAdd);
      nextDueDate = clampToEndOfMonth(
        nextMonthDate,
        originalDueDay,
        currentDueDate
      );
    } else if (nextUtc) {
      // Convert back from UTC components to local date
      nextDueDate = new Date(
        nextUtc.getUTCFullYear(),
        nextUtc.getUTCMonth(),
        nextUtc.getUTCDate(),
        nextUtc.getUTCHours(),
        nextUtc.getUTCMinutes(),
        nextUtc.getUTCSeconds()
      );

      // Debug assertion: RRule skips invalid dates, so if nextUtc exists,
      // the date is already valid. This assertion catches any future changes
      // that might break this assumption.
      if (needsEndOfMonthClamping) {
        const nextMonthEnd = endOfMonth(nextDueDate);
        const nextMonthLastDay = getDate(nextMonthEnd);
        const projectedDay = getDate(nextDueDate);

        if (projectedDay > nextMonthLastDay) {
          logger.error(
            {
              currentDueDate: currentDueDate.toISOString(),
              frequency,
              nextDueDate: nextDueDate.toISOString(),
              projectedDay,
              nextMonthLastDay,
            },
            'RRule returned invalid date - this should never happen'
          );
        }
      }
    } else {
      return null;
    }

    // Check if next due date exceeds end date
    if (endDate && nextDueDate > endDate) {
      return null;
    }

    return nextDueDate;
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
        try {
          // Use original invariants in WHERE clause to prevent TOCTOU race condition.
          // If bill status changed between SELECT and UPDATE, no rows will be affected.
          const result = await db
            .update(bills)
            .set({
              status: 'overdue',
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(bills.id, bill.id),
                eq(bills.status, 'pending'),
                eq(bills.isArchived, false)
              )
            )
            .returning({ id: bills.id });

          // Only count as updated if a row was actually modified
          if (result.length > 0) {
            updated++;

            logger.info(
              {
                billId: bill.id,
                billTitle: bill.title,
                dueDate: bill.dueDate.toISOString(),
              },
              'Bill marked overdue'
            );
          }
        } catch (error) {
          logger.error(
            error,
            `Failed to update bill "${bill.title}" (${bill.id})`
          );
        }
      }
    }

    // 4. Return metrics
    return {
      checked: candidates.length,
      updated,
    };
  },
};
