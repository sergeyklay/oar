import { isValid, isFuture, startOfDay } from 'date-fns';
import { RecurrenceService } from './RecurrenceService';
import {
  getCycleStartDate as getCycleStartDateUtil,
  isPaymentHistorical as isPaymentHistoricalUtil,
} from '@/lib/billing-cycle';
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
  /** True if payment is for a past billing cycle (record only, no bill changes) */
  isHistorical: boolean;
}

/**
 * Validates that a payment date is acceptable.
 *
 * @param paidAt - The payment date to validate
 * @throws Error if date is invalid or in the future
 */
function validatePaymentDate(paidAt: Date): void {
  if (!isValid(paidAt)) {
    throw new Error('Invalid payment date: paidAt must be a valid Date object');
  }

  // Compare at day level to allow payments made "today" regardless of time
  const paidAtDay = startOfDay(paidAt);
  const todayDay = startOfDay(new Date());

  if (isFuture(paidAtDay) && paidAtDay.getTime() !== todayDay.getTime()) {
    throw new Error('Invalid payment date: cannot log payments for future dates');
  }
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
  /** @see getCycleStartDate in lib/billing-cycle.ts */
  getCycleStartDate: getCycleStartDateUtil,

  /** @see isPaymentHistorical in lib/billing-cycle.ts */
  isPaymentHistorical: isPaymentHistoricalUtil,

  /**
   * Calculates bill state changes after logging a payment.
   *
   * Business Rules:
   *
   * 1. When paidAt is before the current billing cycle (Historical Payment):
   *    - Return unchanged bill state
   *    - Only transaction record is created
   *
   * 2. When updateDueDate=true (Full Payment):
   *    - Advance dueDate to next cycle via RecurrenceService
   *    - Reset amountDue to base amount
   *    - For one-time bills: mark as 'paid', amountDue=0
   *
   * 3. When updateDueDate=false (Partial Payment):
   *    - Keep dueDate unchanged (return null)
   *    - Reduce amountDue by payment amount
   *    - Clamp amountDue to minimum 0 (overpayment protection)
   *
   * @param bill - Current bill state
   * @param paymentAmount - Amount paid in minor units
   * @param paidAt - Date of payment
   * @param updateDueDate - Whether to advance the billing cycle (ignored if historical)
   * @returns PaymentResult with new bill state values
   */
  processPayment(
    bill: Pick<Bill, 'amount' | 'amountDue' | 'dueDate' | 'frequency' | 'status'>,
    paymentAmount: number,
    paidAt: Date,
    updateDueDate: boolean
  ): PaymentResult {
    // Validate paidAt before processing
    validatePaymentDate(paidAt);

    // Check for historical payment first
    const isHistorical = isPaymentHistoricalUtil(bill, paidAt);

    if (isHistorical) {
      return {
        nextDueDate: null,
        newAmountDue: bill.amountDue,
        newStatus: bill.status,
        isHistorical: true,
      };
    }

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
          isHistorical: false,
        };
      }

      // Recurring bill: advance cycle, reset amount due to base
      const newStatus = RecurrenceService.deriveStatus(nextDueDate);
      return {
        nextDueDate,
        newAmountDue: bill.amount,
        newStatus,
        isHistorical: false,
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
        isHistorical: false,
      };
    }

    const currentStatus = RecurrenceService.deriveStatus(bill.dueDate);

    return {
      nextDueDate: null,
      newAmountDue,
      newStatus: currentStatus,
      isHistorical: false,
    };
  },
};

