import { db, bills, transactions } from '@/db';
import { RecurrenceService } from '@/lib/services/RecurrenceService';
import { SettingsService } from '@/lib/services/SettingsService';
import { DateAdjustmentService } from '@/lib/services/DateAdjustmentService';
import { eq, and, lte, ne, gt } from 'drizzle-orm';
import { endOfDay, addDays } from 'date-fns';
import { getLogger } from '@/lib/logger';

const logger = getLogger('AutoPayService');

/**
 * Result of auto-pay processing batch.
 */
interface AutoPayResult {
  /** Number of bills successfully processed */
  processed: number;
  /** Number of bills that failed to process */
  failed: number;
  /** Bill IDs that failed (for debugging) */
  failedIds: string[];
}

/**
 * AutoPayService - Processes bills marked as auto-pay.
 *
 * Users can mark bills as "auto-pay" to indicate their bank handles
 * payment automatically (direct debit, recurring card charge, etc.).
 * This service acknowledges those payments by:
 * 1. Creating a transaction record (audit trail)
 * 2. Advancing the bill to its next due date
 *
 * Only marks payments as paid locally - no actual payment is made by the system.
 */
export const AutoPayService = {
  /**
   * Process all eligible auto-pay bills.
   *
   * Eligibility Criteria:
   * - isAutoPay = true
   * - status != 'paid' (pending or overdue - handles backlog after checkDailyBills)
   * - dueDate <= end of today (due date has arrived or passed)
   * - isArchived = false
   *
   * For each eligible bill:
   * 1. Create transaction record (amount = bill.amount, paidAt = bill.dueDate)
   * 2. Calculate next due date (RecurrenceService)
   * 3. Update bill: dueDate = next, status = derived
   * 4. For one-time bills: mark status = 'paid' (no next due date)
   *
   * @returns Summary of processing results
   */
  async processAutoPay(): Promise<AutoPayResult> {
    // Use endOfDay for broad candidate query (catches weekend adjustments)
    const today = endOfDay(new Date());
    // Use current moment for eligibility check (timezone-agnostic)
    const now = new Date();

    // Check if auto-log is enabled
    const autoLogAutoPay = await SettingsService.getAutoLogAutoPay();
    if (!autoLogAutoPay) {
      logger.info('Auto-log disabled, skipping auto-pay processing');
      return { processed: 0, failed: 0, failedIds: [] };
    }

    // Fetch global weekend adjustment setting once per batch
    const globalStrategy = await SettingsService.getWeekendAdjustment();

    // Query all unpaid auto-pay bills that might be eligible
    // Use anchor date <= today + 2 days to catch "previous_business_day" cases
    // (Saturday anchor adjusted to Friday, so we need to include Saturday anchors when today is Friday)
    // Uses ne(status, 'paid') instead of eq(status, 'pending') to handle backlog:
    // checkDailyBills() runs at 00:00 and may mark old bills as 'overdue'
    // before auto-pay runs at 00:05. We still want to process those.
    const candidateBills = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.isAutoPay, true),
          ne(bills.status, 'paid'),
          lte(bills.dueDate, addDays(today, 2)),
          eq(bills.isArchived, false),
          gt(bills.amountDue, 0)
        )
      );

    let processed = 0;
    let failed = 0;
    const failedIds: string[] = [];

    for (const bill of candidateBills) {
      try {
        // Resolve effective weekend adjustment strategy
        const effectiveStrategy = DateAdjustmentService.getEffectiveStrategy(
          bill.weekendAdjustment,
          globalStrategy
        );

        // Calculate adjusted due date using anchor date from database
        const adjustedDueDate = DateAdjustmentService.adjustPaymentDate(
          bill.dueDate, // Anchor date
          effectiveStrategy
        );

        // Compare current moment against adjusted date (not anchor date) for eligibility
        // The due date timestamp encodes when the date starts in user's timezone
        // We only process after that moment has passed (timezone-agnostic)
        if (adjustedDueDate > now) {
          // Adjusted date hasn't arrived yet, skip this bill
          logger.debug(
            { billId: bill.id, adjustedDueDate: adjustedDueDate.toISOString(), now: now.toISOString() },
            'Skipping bill: due date not yet reached'
          );
          continue;
        }

        // Calculate next due date using anchor date (prevents drift)
        const nextAnchorDate = RecurrenceService.calculateNextDueDate(
          bill.dueDate, // Use anchor, not adjusted
          bill.frequency,
          bill.endDate ?? null
        );

        // Execute atomic transaction
        // better-sqlite3 requires synchronous transactions (no async/await inside)
        db.transaction((tx) => {
          // 1. Create transaction record with adjusted date for audit accuracy
          tx.insert(transactions)
            .values({
              billId: bill.id,
              amount: bill.amount,
              paidAt: adjustedDueDate, // Use adjusted date, not anchor date
              notes: 'Logged by Oar',
            })
            .run();

          // 2. Update bill for next cycle
          if (nextAnchorDate !== null) {
            // Recurring bill: advance to next occurrence (store anchor date)
            const newStatus = RecurrenceService.deriveStatus(nextAnchorDate);

            tx.update(bills)
              .set({
                dueDate: nextAnchorDate, // Store next anchor date (prevents drift)
                status: newStatus,
                updatedAt: new Date(),
              })
              .where(eq(bills.id, bill.id))
              .run();
          } else {
            // One-time bill: mark as completed
            tx.update(bills)
              .set({
                status: 'paid',
                updatedAt: new Date(),
              })
              .where(eq(bills.id, bill.id))
              .run();
          }
        });

        processed++;
      } catch (error) {
        logger.error(error, `Failed to process bill ${bill.id}`);
        failed++;
        failedIds.push(bill.id);
        // Continue processing other bills (don't abort entire batch)
      }
    }

    logger.info(
      {
        processed,
        failed,
      },
      'Processing complete'
    );

    return { processed, failed, failedIds };
  },
};

