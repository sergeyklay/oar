'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, bills, billsToTags } from '@/db';
import type { Tag, BillWithTags } from '@/db/schema';
import { toMinorUnits, parseMoneyInput, isValidMoneyInput } from '@/lib/money';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { BillService, type GetBillsOptions } from '@/lib/services/BillService';
import { RecurrenceService } from '@/lib/services/RecurrenceService';

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
  isVariable: z.boolean().default(false),
  tagIds: z.array(z.string()).optional().default([]),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional().default(''),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

/** Validation schema for bill update (extends create with required id). */
const updateBillSchema = createBillSchema.extend({
  id: z.string().min(1, 'Bill ID is required'),
});

export type UpdateBillInput = z.infer<typeof updateBillSchema>;

/** Standardized action result type. */
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Creates a new bill with optional tag associations.
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

  const { title, amount, dueDate, frequency, isAutoPay, isVariable, tagIds, notes } = parsed.data;

  try {
    const cleanedAmount = parseMoneyInput(amount);
    const amountInMinorUnits = toMinorUnits(cleanedAmount);
    const status = RecurrenceService.deriveStatus(dueDate);

    // Insert bill (amountDue initialized to match amount for new bills)
    const [newBill] = await db
      .insert(bills)
      .values({
        title,
        amount: amountInMinorUnits,
        amountDue: amountInMinorUnits,
        dueDate,
        frequency,
        isAutoPay,
        isVariable,
        status,
        notes: notes || null,
      })
      .returning({ id: bills.id });

    // Insert tag associations if any tags selected
    if (tagIds.length > 0) {
      await db.insert(billsToTags).values(
        tagIds.map((tagId) => ({
          billId: newBill.id,
          tagId,
        }))
      );
    }

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
 *
 * @param includeArchived - Whether to include archived bills (default: false)
 */
export async function getBills(includeArchived = false) {
  if (!includeArchived) {
    return db
      .select()
      .from(bills)
      .where(eq(bills.isArchived, false))
      .orderBy(bills.dueDate);
  }

  return db.select().from(bills).orderBy(bills.dueDate);
}

/**
 * Fetches bills with their associated tags.
 *
 * Filtering behavior:
 * - When `date` is provided, filters by that specific day
 * - When `month` is provided (and no `date`), filters by calendar month
 * - When neither is provided, returns all bills sorted by closest payment date
 */
export async function getBillsFiltered(
  options: GetBillsOptions = {}
): Promise<BillWithTags[]> {
  return BillService.getFiltered(options);
}

/**
 * Fetches summary statistics for bills due in the current month.
 *
 * Used by Sidebar to display menu item subtitle.
 *
 * @returns Summary stats: count, total amount (in minor units), and variable bill indicator
 */
export async function getBillsForCurrentMonthStats(): Promise<{
  count: number;
  total: number;
  hasVariable: boolean;
}> {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const bills = await BillService.getFiltered({ month: currentMonth });

  const count = bills.length;
  const total = bills.reduce((sum, bill) => sum + bill.amountDue, 0);
  const hasVariable = bills.some((bill) => bill.isVariable);

  return { count, total, hasVariable };
}

/**
 * Fetches summary statistics for all non-archived bills.
 *
 * Used by Sidebar to display Overview menu item subtitle.
 *
 * @returns Summary stats: count of all bills
 */
export async function getAllBillsStats(): Promise<{
  count: number;
}> {
  const bills = await BillService.getFiltered({});
  return { count: bills.length };
}

/**
 * Updates an existing bill with tag associations.
 *
 * @param input - Bill data with ID for update
 * @returns Action result with updated bill ID or validation errors
 */
export async function updateBill(
  input: UpdateBillInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateBillSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, title, amount, dueDate, frequency, isAutoPay, isVariable, tagIds, notes } = parsed.data;

  try {
    const cleanedAmount = parseMoneyInput(amount);
    const amountInMinorUnits = toMinorUnits(cleanedAmount);
    const status = RecurrenceService.deriveStatus(dueDate);
    const now = new Date();

    // Update bill (amountDue is not updated here - it only changes via payment logging)
    await db
      .update(bills)
      .set({
        title,
        amount: amountInMinorUnits,
        dueDate,
        frequency,
        isAutoPay,
        isVariable,
        status,
        notes: notes || null,
        updatedAt: now,
      })
      .where(eq(bills.id, id));

    // Replace tag associations
    // Step 1: Delete existing associations
    await db.delete(billsToTags).where(eq(billsToTags.billId, id));

    // Step 2: Insert new associations
    if (tagIds && tagIds.length > 0) {
      await db.insert(billsToTags).values(
        tagIds.map((tagId) => ({
          billId: id,
          tagId,
        }))
      );
    }

    revalidatePath('/');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Failed to update bill:', error);
    return {
      success: false,
      error: 'Failed to update bill. Please try again.',
    };
  }
}

/**
 * Archives or unarchives a bill.
 *
 * @param id - Bill ID
 * @param isArchived - Archive state (default: true)
 */
export async function archiveBill(
  id: string,
  isArchived: boolean = true
): Promise<ActionResult> {
  try {
    await db
      .update(bills)
      .set({ isArchived, updatedAt: new Date() })
      .where(eq(bills.id, id));

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to archive bill:', error);
    return {
      success: false,
      error: 'Failed to archive bill.',
    };
  }
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

/** Validation schema for bill ID parameter */
const billIdSchema = z.string().min(1, 'Bill ID is required');

/**
 * Fetch tags for a specific bill.
 *
 * Server Action for client components that need to fetch bill tags.
 *
 * @param billId - Bill ID to fetch tags for
 * @returns ActionResult with tags array (data always present)
 */
export async function getBillTags(
  billId: string
): Promise<ActionResult<Tag[]>> {
  const parsed = billIdSchema.safeParse(billId);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid bill ID',
      fieldErrors: {
        billId: parsed.error.issues.map((issue) => issue.message),
      },
      data: [],
    };
  }

  try {
    const { BillService } = await import('@/lib/services/BillService');
    const billTags = await BillService.getTags(parsed.data);

    return {
      success: true,
      data: billTags,
    };
  } catch (error) {
    console.error('Failed to fetch bill tags:', error);
    return {
      success: false,
      error: 'Failed to fetch bill tags.',
      data: [],
    };
  }
}
