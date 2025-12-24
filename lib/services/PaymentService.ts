import { isValid, isFuture, startOfDay } from 'date-fns';
import { RecurrenceService } from './RecurrenceService';
import { isPaymentHistorical, getCycleStartDate } from '@/lib/billing-cycle';
import type { Bill, BillStatus, Transaction } from '@/db/schema';

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
  /** True if bill ended during this payment (end date reached or one-time bill fully paid) */
  billEnded?: boolean;
}

/**
 * Result of recalculating bill state from all transactions.
 *
 * Used when payments are updated or deleted to maintain cycle integrity.
 */
export interface BillState {
  /** New amount due in minor units */
  amountDue: number;
  /** New bill status */
  status: BillStatus;
  /** New due date if cycle advances, null if unchanged */
  nextDueDate: Date | null;
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
    bill: Pick<Bill, 'amount' | 'amountDue' | 'dueDate' | 'frequency' | 'status' | 'endDate'>,
    paymentAmount: number,
    paidAt: Date,
    updateDueDate: boolean
  ): PaymentResult {
    // Validate paidAt before processing
    validatePaymentDate(paidAt);

    // Check for historical payment first
    const isHistorical = isPaymentHistorical(bill, paidAt);

    if (isHistorical) {
      return {
        nextDueDate: null,
        newAmountDue: bill.amountDue,
        newStatus: bill.status,
        isHistorical: true,
        billEnded: false,
      };
    }

    if (updateDueDate) {
      // Full payment: advance to next billing cycle
      const nextDueDate = RecurrenceService.calculateNextDueDate(
        bill.dueDate,
        bill.frequency,
        bill.endDate ?? null
      );

      // One-time bill or end date reached (nextDueDate is null)
      if (nextDueDate === null) {
        return {
          nextDueDate: null,
          newAmountDue: 0,
          newStatus: 'paid',
          isHistorical: false,
          billEnded: true,
        };
      }

      // Recurring bill: advance cycle, reset amount due to base
      const newStatus = RecurrenceService.deriveStatus(nextDueDate);
      return {
        nextDueDate,
        newAmountDue: bill.amount,
        newStatus,
        isHistorical: false,
        billEnded: false,
      };
    }

    // Partial payment: reduce amount due, keep due date unchanged
    const newAmountDue = Math.max(0, bill.amountDue - paymentAmount);

    // Interval changed to 'once' + fully paid
    if (bill.frequency === 'once' && newAmountDue === 0) {
      return {
        nextDueDate: null,
        newAmountDue: 0,
        newStatus: 'paid',
        isHistorical: false,
        billEnded: true,
      };
    }

    const currentStatus = RecurrenceService.deriveStatus(bill.dueDate);

    return {
      nextDueDate: null,
      newAmountDue,
      newStatus: currentStatus,
      isHistorical: false,
      billEnded: false,
    };
  },

  /**
   * Recalculates bill state from all transactions.
   *
   * Used when payments are updated or deleted to maintain cycle integrity.
   * Handles both current cycle payments and cycle reversal when payments are deleted.
   *
   * Business Rules:
   * 1. Filter transactions to current cycle only (exclude historical)
   * 2. If no current cycle payments: check if we need to REVERT to previous cycle
   * 3. If reverting: check previous cycle for payments and recalculate accordingly
   * 4. Calculate total paid in current cycle
   * 5. If total paid >= amountDue: advance cycle (or mark one-time as paid)
   * 6. If total paid < amountDue: reduce amount due by total paid
   *
   * @param bill - Current bill state
   * @param transactions - All transactions for the bill (ordered by paidAt DESC)
   * @returns BillState with recalculated amountDue, status, and nextDueDate
   */
  recalculateBillFromPayments(
    bill: Pick<Bill, 'amount' | 'amountDue' | 'dueDate' | 'frequency' | 'status'>,
    transactions: Transaction[]
  ): BillState {
    // Filter transactions to current cycle only
    const currentCycleTransactions = transactions.filter(
      (tx) => !isPaymentHistorical(bill, tx.paidAt)
    );

    // If no payments in current cycle, check if we need to revert to previous cycle
    if (currentCycleTransactions.length === 0) {
      // For recurring bills, check if we should revert to previous cycle
      const previousDueDate = getCycleStartDate(bill.dueDate, bill.frequency);

      if (previousDueDate) {
        // Check if there are payments in the previous cycle
        const previousBill = { dueDate: previousDueDate, frequency: bill.frequency };
        const previousCycleTransactions = transactions.filter(
          (tx) => !isPaymentHistorical(previousBill, tx.paidAt)
        );

        if (previousCycleTransactions.length === 0) {
          // No payments in previous cycle either, revert to previous due date
          return {
            amountDue: bill.amount,
            status: RecurrenceService.deriveStatus(previousDueDate),
            nextDueDate: previousDueDate,
          };
        }

        // There are payments in previous cycle, calculate based on those
        const totalPaid = previousCycleTransactions.reduce(
          (sum, tx) => sum + tx.amount,
          0
        );

        if (totalPaid >= bill.amount) {
          // Previous cycle was fully paid, keep current cycle
          return {
            amountDue: bill.amount,
            status: RecurrenceService.deriveStatus(bill.dueDate),
            nextDueDate: null,
          };
        }

        // Partial payment in previous cycle, revert to previous due date
        return {
          amountDue: Math.max(0, bill.amount - totalPaid),
          status: RecurrenceService.deriveStatus(previousDueDate),
          nextDueDate: previousDueDate,
        };
      }

      // No previous cycle (one-time bill or first cycle), reset to base state
      return {
        amountDue: bill.amount,
        status: RecurrenceService.deriveStatus(bill.dueDate),
        nextDueDate: null,
      };
    }

    // Calculate total paid in current cycle
    const totalPaid = currentCycleTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    // Determine if cycle should advance
    // If total paid >= amountDue, advance cycle
    if (totalPaid >= bill.amountDue) {
      const nextDueDate = RecurrenceService.calculateNextDueDate(
        bill.dueDate,
        bill.frequency
      );

      if (nextDueDate === null) {
        // One-time bill fully paid
        return {
          amountDue: 0,
          status: 'paid',
          nextDueDate: null,
        };
      }

      // Recurring bill, advance cycle
      return {
        amountDue: bill.amount,
        status: RecurrenceService.deriveStatus(nextDueDate),
        nextDueDate,
      };
    }

    // Partial payment, reduce amount due
    const newAmountDue = Math.max(0, bill.amountDue - totalPaid);

    return {
      amountDue: newAmountDue,
      status: RecurrenceService.deriveStatus(bill.dueDate),
      nextDueDate: null,
    };
  },

  /**
   * Determines if a transaction affects the current billing cycle.
   *
   * This also checks if the payment might have CAUSED the current cycle advancement
   * by checking against the previous cycle. This is necessary because after a payment
   * advances the cycle, deleting that payment would make it appear "historical" when
   * checked against the new (advanced) due date.
   *
   * @param bill - Bill with dueDate and frequency
   * @param transaction - Transaction to check
   * @returns True if transaction affects current cycle or caused cycle advancement
   */
  doesPaymentAffectCurrentCycle(
    bill: Pick<Bill, 'dueDate' | 'frequency'>,
    transaction: Transaction
  ): boolean {
    // Check if payment is in current cycle (not historical)
    if (!isPaymentHistorical(bill, transaction.paidAt)) {
      return true;
    }

    // If payment appears historical, check if it might have caused cycle advancement
    // by checking against the PREVIOUS cycle
    const previousDueDate = getCycleStartDate(bill.dueDate, bill.frequency);
    if (!previousDueDate) {
      // One-time bills don't have previous cycles
      return false;
    }

    // Check if payment was in the previous cycle
    // (which would mean it caused the current cycle advancement)
    const previousCycleBill = { dueDate: previousDueDate, frequency: bill.frequency };
    return !isPaymentHistorical(previousCycleBill, transaction.paidAt);
  },
};

