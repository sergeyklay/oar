import { db, bills, transactions } from '@/db';
import { RecurrenceService } from '@/lib/services/RecurrenceService';
import { eq, and, lte, ne } from 'drizzle-orm';
import { endOfDay } from 'date-fns';

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
 * This service only marks payments as paid locally - no actual payment is made by the system.
 * This preserves the "Active Payer" philosophy because the user
 * consciously enabled auto-pay—it's a deliberate delegation and reducing manual bookkeeping for
 * externally-automated bills.
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
    const today = endOfDay(new Date());

    // Query all unpaid auto-pay bills that are due today or earlier
    // Uses ne(status, 'paid') instead of eq(status, 'pending') to handle backlog:
    // checkDailyBills() runs at 00:00 and may mark old bills as 'overdue'
    // before auto-pay runs at 00:05. We still want to process those.
    const eligibleBills = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.isAutoPay, true),
          ne(bills.status, 'paid'),
          lte(bills.dueDate, today),
          eq(bills.isArchived, false)
        )
      );

    let processed = 0;
    let failed = 0;
    const failedIds: string[] = [];

    for (const bill of eligibleBills) {
      try {
        // Calculate next due date for recurring bills
        const nextDueDate = RecurrenceService.calculateNextDueDate(
          bill.dueDate,
          bill.frequency
        );

        // Execute atomic transaction
        // better-sqlite3 requires synchronous transactions (no async/await inside)
        db.transaction((tx) => {
          // 1. Create transaction record
          tx.insert(transactions)
            .values({
              billId: bill.id,
              amount: bill.amount,
              paidAt: bill.dueDate, // Use original due date, not processing date
              notes: 'Logged by Oar',
            })
            .run();

          // 2. Update bill for next cycle
          if (nextDueDate !== null) {
            // Recurring bill: advance to next occurrence
            const newStatus = RecurrenceService.deriveStatus(nextDueDate);

            tx.update(bills)
              .set({
                dueDate: nextDueDate,
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
        console.error(`[AutoPayService] Failed to process bill ${bill.id}:`, error);
        failed++;
        failedIds.push(bill.id);
        // Continue processing other bills (don't abort entire batch)
      }
    }

    console.log(
      `[AutoPayService] Processing complete: ${processed} processed, ${failed} failed`
    );

    return { processed, failed, failedIds };
  },
};

