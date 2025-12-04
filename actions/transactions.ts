'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, bills, transactions } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { RecurrenceService } from '@/lib/services/RecurrenceService';
import { toMinorUnits, parseMoneyInput, isValidMoneyInput } from '@/lib/money';

/** Validation schema for logging a payment. */
const logPaymentSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => isValidMoneyInput(parseMoneyInput(val)), {
      message: 'Please enter a valid amount',
    })
    .refine((val) => parseFloat(parseMoneyInput(val)) > 0, {
      message: 'Amount must be greater than zero',
    }),
  paidAt: z.coerce.date({
    message: 'Please select a valid date',
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type LogPaymentInput = z.infer<typeof logPaymentSchema>;

/** Standardized action result type. */
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Logs a payment for a bill.
 *
 * Side effects:
 * 1. Creates a transaction record
 * 2. Advances bill.dueDate to next occurrence (if recurring)
 * 3. Updates bill.status based on new dueDate
 * 4. For one-time bills: marks as 'paid' and leaves dueDate unchanged
 *
 * Uses Drizzle transaction for atomicity.
 */
export async function logPayment(
  input: LogPaymentInput
): Promise<ActionResult<{ transactionId: string }>> {
  // 1. Validate input
  const parsed = logPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { billId, amount, paidAt, notes } = parsed.data;

  try {
    // 2. Fetch the bill to get current dueDate and frequency
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));

    if (!bill) {
      return {
        success: false,
        error: 'Bill not found',
      };
    }

    const amountInMinorUnits = toMinorUnits(parseMoneyInput(amount));

    // 3. Calculate next due date before transaction
    const nextDueDate = RecurrenceService.calculateNextDueDate(
      bill.dueDate,
      bill.frequency
    );

    // 4. Use Drizzle transaction for atomicity
    // NOTE: better-sqlite3 requires SYNCHRONOUS transactions (no async/await)
    // NOTE: .returning() returns a query builder; must call .get() or .all() to execute
    const result = db.transaction((tx) => {
      // Create transaction record - use .get() for single row
      const newTransaction = tx
        .insert(transactions)
        .values({
          billId,
          amount: amountInMinorUnits,
          paidAt,
          notes: notes || null,
        })
        .returning()
        .get();

      // Update bill based on recurrence type
      if (nextDueDate) {
        // Recurring bill: advance to next occurrence
        const newStatus = RecurrenceService.deriveStatus(nextDueDate);

        tx.update(bills)
          .set({
            dueDate: nextDueDate,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(bills.id, billId))
          .run();
      } else {
        // One-time bill: mark as paid, keep original dueDate for reference
        tx.update(bills)
          .set({
            status: 'paid',
            updatedAt: new Date(),
          })
          .where(eq(bills.id, billId))
          .run();
      }

      return newTransaction;
    });

    // 5. Revalidate UI
    revalidatePath('/');

    return {
      success: true,
      data: { transactionId: result.id },
    };
  } catch (error) {
    console.error('Failed to log payment:', error);
    return {
      success: false,
      error: 'Failed to log payment. Please try again.',
    };
  }
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

/** Validation schema for deleting a transaction. */
const deleteTransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
});

export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;

/**
 * Deletes a payment transaction record.
 *
 * IMPORTANT: This is a "detached" deletion - it does NOT modify
 * the associated bill's dueDate or status. The bill's state must
 * be corrected manually by the user if needed.
 *
 * Side effects:
 * 1. Removes transaction from database
 * 2. Revalidates dashboard to update any aggregations
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
    // 2. Verify transaction exists
    const [existing] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.id, id));

    if (!existing) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // 3. Delete the transaction
    db.delete(transactions).where(eq(transactions.id, id)).run();

    // 4. Revalidate UI
    revalidatePath('/');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return {
      success: false,
      error: 'Failed to delete payment record. Please try again.',
    };
  }
}
