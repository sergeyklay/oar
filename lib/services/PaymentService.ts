import { RecurrenceService } from './RecurrenceService';
import type { Bill, BillStatus } from '@/db/schema';

/**
 * Result of processing a payment against a bill.
 *
 * Contains all the state changes needed to update the bill record.
 */
export interface PaymentResult {
  /** New due date if cycle advances, null if unchanged */
  nextDueDate: Date | null;
  /** New amount due after payment in minor units */
  newAmountDue: number;
  /** New bill status based on payment and due date */
  newStatus: BillStatus;
}

/**
 * Domain service for payment processing logic.
 *
 * Handles the business rules for logging payments:
 * - Full payments that advance the billing cycle
 * - Partial payments that reduce amount due without advancing
 *
 * All monetary calculations use integers (minor units) to avoid
 * floating-point precision issues.
 */
export const PaymentService = {
  /**
   * Calculates bill state changes after logging a payment.
   *
   * Business Rules:
   *
   * 1. When updateDueDate=true (Full Payment):
   *    - Advance dueDate to next cycle via RecurrenceService
   *    - Reset amountDue to base amount
   *    - For one-time bills: mark as 'paid', amountDue=0
   *
   * 2. When updateDueDate=false (Partial Payment):
   *    - Keep dueDate unchanged (return null)
   *    - Reduce amountDue by payment amount
   *    - Clamp amountDue to minimum 0 (overpayment protection)
   *
   * @param bill - Current bill state (amount, amountDue, dueDate, frequency)
   * @param paymentAmount - Amount paid in minor units
   * @param updateDueDate - Whether to advance the billing cycle
   * @returns PaymentResult with new bill state values
   */
  processPayment(
    bill: Pick<Bill, 'amount' | 'amountDue' | 'dueDate' | 'frequency'>,
    paymentAmount: number,
    updateDueDate: boolean
  ): PaymentResult {
    if (updateDueDate) {
      // Full payment: advance to next billing cycle
      const nextDueDate = RecurrenceService.calculateNextDueDate(
        bill.dueDate,
        bill.frequency
      );

      if (nextDueDate === null) {
        // One-time bill: mark as paid, zero out amount due
        return {
          nextDueDate: null,
          newAmountDue: 0,
          newStatus: 'paid',
        };
      }

      // Recurring bill: advance cycle, reset amount due to base
      const newStatus = RecurrenceService.deriveStatus(nextDueDate);
      return {
        nextDueDate,
        newAmountDue: bill.amount,
        newStatus,
      };
    }

    // Partial payment: reduce amount due, keep due date unchanged
    const newAmountDue = Math.max(0, bill.amountDue - paymentAmount);

    // For one-time bills, mark as paid when fully paid off
    if (bill.frequency === 'once' && newAmountDue === 0) {
      return {
        nextDueDate: null,
        newAmountDue: 0,
        newStatus: 'paid',
      };
    }

    const currentStatus = RecurrenceService.deriveStatus(bill.dueDate);

    return {
      nextDueDate: null,
      newAmountDue,
      newStatus: currentStatus,
    };
  },
};

