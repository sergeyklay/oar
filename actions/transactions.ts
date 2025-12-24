'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, bills, transactions } from '@/db';
import { eq, desc } from 'drizzle-orm';
import type { Transaction } from '@/db/schema';
import { PaymentService } from '@/lib/services/PaymentService';
import { TransactionService } from '@/lib/services/TransactionService';
import { SettingsService } from '@/lib/services/SettingsService';
import { getLogger } from '@/lib/logger';

const logger = getLogger('Actions:Transactions');

/** Validation schema for logging a payment. */
const logPaymentSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  /** Amount in minor units (integer). Coerced from string for form/JSON compatibility. */
  amount: z.coerce
    .number()
    .int('Amount must be an integer (minor units)')
    .positive('Amount must be greater than zero')
    .max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
  paidAt: z.coerce.date({
    message: 'Please select a valid date',
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  /**
   * Whether to advance the due date to the next billing cycle.
   *
   * true (default): Advance dueDate, reset amountDue to base amount
   * false: Keep dueDate unchanged, reduce amountDue by payment amount
   */
  updateDueDate: z.boolean().default(true),
});

export type LogPaymentInput = z.infer<typeof logPaymentSchema>;

/** Standardized action result type. */
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

/**
 * Logs a payment for a bill.
 *
 * Side effects:
 * 1. Creates a transaction record
 * 2. If historical payment: bill state unchanged (record only)
 * 3. If updateDueDate=true: advances bill.dueDate, resets amountDue
 * 4. If updateDueDate=false: reduces amountDue by payment amount
 * 5. Updates bill.status based on due date
 *
 * Uses Drizzle transaction for atomicity.
 */
export async function logPayment(
  input: LogPaymentInput
): Promise<ActionResult<{ transactionId: string; isHistorical: boolean; billArchived?: boolean }>> {
  // 1. Validate input
  const parsed = logPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { billId, amount, paidAt, notes, updateDueDate } = parsed.data;

  try {
    // 2. Fetch the bill to get current state
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));

    if (!bill) {
      return {
        success: false,
        error: 'Bill not found',
      };
    }

    // 3. Delegate to PaymentService for business logic
    // Amount is already in minor units (converted by UI layer)
    const paymentResult = PaymentService.processPayment(
      bill,
      amount,
      paidAt,
      updateDueDate
    );

    // 4. Check if bill ended and determine archiving action
    let shouldArchive = false;
    let toastMessage = 'Payment logged successfully.';
    if (paymentResult.billEnded) {
      const billEndAction = await SettingsService.getBillEndAction();
      shouldArchive = billEndAction === 'archive';
      if (shouldArchive) {
        toastMessage = 'Payment logged and bill archived.';
      }
    }

    // 5. Use Drizzle transaction for atomicity
    const result = db.transaction((tx) => {
      // Create transaction record (always, for historical payments too)
      const newTransaction = tx
        .insert(transactions)
        .values({
          billId,
          amount,
          paidAt,
          notes: notes || null,
        })
        .returning()
        .get();

      // Update bill with computed state from PaymentService
      // Skip bill update for historical payments (record only)
      if (!paymentResult.isHistorical) {
        if (shouldArchive) {
          // Bill ended and user wants to archive
          tx.update(bills)
            .set({
              isArchived: true,
              updatedAt: new Date(),
            })
            .where(eq(bills.id, billId))
            .run();
        } else {
          // Update bill state (normal payment or bill ended but not archived)
          tx.update(bills)
            .set({
              dueDate: paymentResult.nextDueDate ?? bill.dueDate,
              amountDue: paymentResult.newAmountDue,
              status: paymentResult.newStatus,
              updatedAt: new Date(),
            })
            .where(eq(bills.id, billId))
            .run();
        }
      }

      return newTransaction;
    });

    // 6. Revalidate UI
    revalidatePath('/');
    revalidatePath(`/bills/${billId}`);

    return {
      success: true,
      data: {
        transactionId: result.id,
        isHistorical: paymentResult.isHistorical,
        billArchived: shouldArchive,
      },
      message: toastMessage,
    };
  } catch (error) {
    logger.error(error, 'Failed to log payment');
    return {
      success: false,
      error: 'Failed to log payment. Please try again.',
    };
  }
}

/**
 * Fetches stats for recent payments within the configured range.
 * Used by Sidebar to display "Paid Recently" menu item subtitle.
 */
export async function getRecentPaymentsStats(): Promise<{
  count: number;
  total: number;
}> {
  const range = await SettingsService.getPaidRecentlyRange();
  const payments = await TransactionService.getRecentPayments(range);

  const count = payments.length;
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return { count, total };
}

/**
 * Fetches payment history for a specific bill.
 * Ordered by most recent first.
 */
export async function getTransactionsByBillId(billId: string) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.billId, billId))
    .orderBy(desc(transactions.paidAt));
}

/**
 * Fetches a single bill by ID.
 */
export async function getBillById(billId: string) {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));

  return bill ?? null;
}

/** Validation schema for updating a transaction. */
const updateTransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  /** Amount in minor units (integer). */
  amount: z.coerce
    .number()
    .int('Amount must be an integer (minor units)')
    .positive('Amount must be greater than zero')
    .max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
  paidAt: z.coerce.date({
    message: 'Please select a valid date',
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/** Validation schema for deleting a transaction. */
const deleteTransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
});

export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;

/**
 * Updates an existing payment transaction record.
 *
 * Side effects:
 * 1. Updates transaction record in database
 * 2. If payment affects current billing cycle, recalculates bill state
 * 3. Revalidates UI paths
 *
 * Business Logic:
 * - If updated payment date/amount affects current cycle, recalculates bill state
 * - Uses PaymentService to determine if payment is historical
 * - If not historical, recalculates amountDue and status
 */
export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<ActionResult<{ transactionId: string }>> {
  // 1. Validate input
  const parsed = updateTransactionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, amount, paidAt, notes } = parsed.data;

  try {
    // 2. Fetch existing transaction
    const [existingTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));

    if (!existingTransaction) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // 3. Fetch associated bill
    const [bill] = await db.select().from(bills).where(eq(bills.id, existingTransaction.billId));

    if (!bill) {
      return {
        success: false,
        error: 'Bill not found',
      };
    }

    // 4. Check if old transaction affected current cycle
    const oldAffectedCycle = PaymentService.doesPaymentAffectCurrentCycle(
      bill,
      existingTransaction
    );

    // 5. Prepare updated transaction object
    const updatedTransaction: Transaction = {
      ...existingTransaction,
      amount,
      paidAt,
      notes: notes || null,
    };

    // 6. Check if new transaction affects current cycle
    const newAffectsCycle = PaymentService.doesPaymentAffectCurrentCycle(bill, updatedTransaction);

    // 7. Pre-fetch all transactions and calculate new bill state if needed
    let newBillState: ReturnType<typeof PaymentService.recalculateBillFromPayments> | null = null;
    if (oldAffectedCycle || newAffectsCycle) {
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.billId, bill.id))
        .orderBy(desc(transactions.paidAt));

      // Replace the old transaction with the updated one in the array
      const updatedTransactions = allTransactions.map((tx) =>
        tx.id === id ? updatedTransaction : tx
      );

      newBillState = PaymentService.recalculateBillFromPayments(bill, updatedTransactions);
    }

    // 8. Atomic transaction: update transaction and bill together
    db.transaction((tx) => {
      // Update transaction record
      tx.update(transactions)
        .set({
          amount,
          paidAt,
          notes: notes || null,
        })
        .where(eq(transactions.id, id))
        .run();

      // Update bill if recalculation was needed
      if (newBillState) {
        tx.update(bills)
          .set({
            amountDue: newBillState.amountDue,
            status: newBillState.status,
            dueDate: newBillState.nextDueDate ?? bill.dueDate,
            updatedAt: new Date(),
          })
          .where(eq(bills.id, bill.id))
          .run();
      }
    });

    // 8. Revalidate UI
    revalidatePath('/');

    return {
      success: true,
      data: {
        transactionId: id,
      },
    };
  } catch (error) {
    logger.error(error, 'Failed to update transaction');
    return {
      success: false,
      error: 'Failed to update payment record. Please try again.',
    };
  }
}

/**
 * Deletes a payment transaction record.
 *
 * Recalculates billing cycle if deleted payment affected current cycle.
 *
 * Side effects:
 * 1. Removes transaction from database
 * 2. If deleted payment affected current cycle, recalculates bill state
 * 3. Revalidates UI paths
 *
 * Business Logic:
 * - Check if deleted payment was part of current billing cycle
 * - If yes, recalculate bill state based on remaining payments
 * - If no, bill state remains unchanged
 */
export async function deleteTransaction(
  input: DeleteTransactionInput
): Promise<ActionResult> {
  // 1. Validate input
  const parsed = deleteTransactionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid transaction ID',
    };
  }

  const { id } = parsed.data;

  try {
    // 2. Verify transaction exists and fetch it
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // 3. Fetch associated bill
    const [bill] = await db.select().from(bills).where(eq(bills.id, transaction.billId));

    if (!bill) {
      return {
        success: false,
        error: 'Bill not found',
      };
    }

    // 4. Check if deleted transaction affected current cycle
    const affectedCycle = PaymentService.doesPaymentAffectCurrentCycle(bill, transaction);

    // 5. Pre-fetch all transactions and calculate new bill state if needed
    let newBillState: ReturnType<typeof PaymentService.recalculateBillFromPayments> | null = null;
    if (affectedCycle) {
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.billId, bill.id))
        .orderBy(desc(transactions.paidAt));

      // Filter out the transaction being deleted
      const remainingTransactions = allTransactions.filter((tx) => tx.id !== id);

      newBillState = PaymentService.recalculateBillFromPayments(bill, remainingTransactions);
    }

    // 6. Atomic transaction: delete transaction and update bill together
    db.transaction((tx) => {
      // Delete the transaction
      tx.delete(transactions).where(eq(transactions.id, id)).run();

      // Update bill if recalculation was needed
      if (newBillState) {
        tx.update(bills)
          .set({
            amountDue: newBillState.amountDue,
            status: newBillState.status,
            dueDate: newBillState.nextDueDate ?? bill.dueDate,
            updatedAt: new Date(),
          })
          .where(eq(bills.id, bill.id))
          .run();
      }
    });

    // 7. Revalidate UI
    revalidatePath('/');

    return {
      success: true,
    };
  } catch (error) {
    logger.error(error, 'Failed to delete transaction');
    return {
      success: false,
      error: 'Failed to delete payment record. Please try again.',
    };
  }
}
