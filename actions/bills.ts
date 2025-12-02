'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, bills } from '@/db';
import { toMinorUnits, parseMoneyInput, isValidMoneyInput } from '@/lib/money';
import { eq } from 'drizzle-orm';

/** Validation schema for bill creation. */
const createBillSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => isValidMoneyInput(parseMoneyInput(val)), {
      message: 'Please enter a valid amount',
    }),
  dueDate: z.coerce.date({
    message: 'Please select a valid date',
  }),
  frequency: z.enum(['once', 'monthly', 'yearly'], {
    message: 'Please select a frequency',
  }),
  isAutoPay: z.boolean().default(false),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

/** Standardized action result type. */
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Creates a new bill.
 *
 * @param input - Bill data from form submission
 * @returns Action result with created bill ID or validation errors
 */
export async function createBill(
  input: CreateBillInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createBillSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, amount, dueDate, frequency, isAutoPay } = parsed.data;

  try {
    const cleanedAmount = parseMoneyInput(amount);
    const amountInMinorUnits = toMinorUnits(cleanedAmount);
    const now = new Date();
    const status = dueDate < now ? 'overdue' : 'pending';

    const [newBill] = await db
      .insert(bills)
      .values({
        title,
        amount: amountInMinorUnits,
        dueDate,
        frequency,
        isAutoPay,
        status,
      })
      .returning({ id: bills.id });

    revalidatePath('/');

    return {
      success: true,
      data: { id: newBill.id },
    };
  } catch (error) {
    console.error('Failed to create bill:', error);
    return {
      success: false,
      error: 'Failed to create bill. Please try again.',
    };
  }
}

/**
 * Fetches all bills ordered by due date.
 */
export async function getBills() {
  return db.select().from(bills).orderBy(bills.dueDate);
}

/**
 * Updates a bill's payment status.
 *
 * @param id - Bill ID
 * @param status - New status value
 */
export async function updateBillStatus(
  id: string,
  status: 'pending' | 'paid' | 'overdue'
): Promise<ActionResult> {
  try {
    await db
      .update(bills)
      .set({ status, updatedAt: new Date() })
      .where(eq(bills.id, id));

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to update bill status:', error);
    return {
      success: false,
      error: 'Failed to update bill status.',
    };
  }
}

/**
 * Deletes a bill by ID.
 *
 * @param id - Bill ID to delete
 */
export async function deleteBill(id: string): Promise<ActionResult> {
  try {
    await db.delete(bills).where(eq(bills.id, id));

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete bill:', error);
    return {
      success: false,
      error: 'Failed to delete bill.',
    };
  }
}
