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
import { SettingsService } from '@/lib/services/SettingsService';

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
  frequency: z.enum([
    'once',
    'weekly',
    'biweekly',
    'twicemonthly',
    'monthly',
    'bimonthly',
    'quarterly',
    'yearly'
  ], {
    message: 'Please select a repeat interval',
  }),
  isAutoPay: z.boolean().default(false),
  isVariable: z.boolean().default(false),
  categoryId: z.string().min(1, 'Category is required'),
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
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { title, amount, dueDate, frequency, isAutoPay, isVariable, categoryId, tagIds, notes } = parsed.data;

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
        categoryId,
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
 * Fetches summary statistics for bills due within the configured "due soon" range.
 *
 * Used by Sidebar to display Due Soon menu item subtitle.
 *
 * @returns Summary stats: count, total amount (in minor units), and variable bill indicator
 */
export async function getBillsForDueSoonStats(): Promise<{
  count: number;
  total: number;
  hasVariable: boolean;
}> {
  const range = await SettingsService.getDueSoonRange();
  const bills = await BillService.getFiltered({ dateRange: range });

  const count = bills.length;
  const total = bills.reduce((sum, bill) => sum + bill.amountDue, 0);
  const hasVariable = bills.some((bill) => bill.isVariable);

  return { count, total, hasVariable };
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
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const {
    id, title, amount, dueDate, frequency, isAutoPay, isVariable, categoryId, tagIds, notes,
  } = parsed.data;

  try {
    const cleanedAmount = parseMoneyInput(amount);
    const amountInMinorUnits = toMinorUnits(cleanedAmount);
    const now = new Date();

    // Fetch current bill state to preserve paid status for completed one-time bills
    const [currentBill] = await db
      .select({ amountDue: bills.amountDue, status: bills.status })
      .from(bills)
      .where(eq(bills.id, id))
      .limit(1);

    // Determine status: preserve 'paid' for fully-paid one-time bills, otherwise derive from due date
    const status: 'pending' | 'paid' | 'overdue' =
      frequency === 'once' && currentBill?.amountDue === 0
        ? 'paid'
        : RecurrenceService.deriveStatus(dueDate);

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
        categoryId,
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
 * Fetch the category ID for a specific bill.
 *
 * @param billId - Bill ID to fetch category for
 * @returns ActionResult with categoryId or null
 */
export async function getBillCategory(
  billId: string
): Promise<ActionResult<string | null>> {
  const parsed = billIdSchema.safeParse(billId);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid bill ID',
      data: null,
    };
  }

  try {
    const [bill] = await db
      .select({ categoryId: bills.categoryId })
      .from(bills)
      .where(eq(bills.id, parsed.data))
      .limit(1);

    return {
      success: true,
      data: bill?.categoryId ?? null,
    };
  } catch (error) {
    console.error('Failed to fetch bill category:', error);
    return {
      success: false,
      error: 'Failed to fetch bill category.',
      data: null,
    };
  }
}

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

const skipPaymentSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
});

type SkipPaymentInput = z.infer<typeof skipPaymentSchema>;

/**
 * Skips the current payment for a bill by advancing it to the next due date.
 *
 * @param input - Object containing billId
 * @returns Action result
 */
export async function skipPayment(
  input: SkipPaymentInput
): Promise<ActionResult<void>> {
  const parsed = skipPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { billId } = parsed.data;

  try {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));

    if (!bill) {
      return { success: false, error: 'Bill not found' };
    }

    if (bill.frequency === 'once') {
      return { success: false, error: 'Cannot skip one-time bills' };
    }

    const nextDueDate = RecurrenceService.calculateNextDueDate(bill.dueDate, bill.frequency);

    if (!nextDueDate) {
      return { success: false, error: 'Unable to calculate next due date' };
    }

    const newStatus = RecurrenceService.deriveStatus(nextDueDate);

    await db.update(bills)
      .set({
        dueDate: nextDueDate,
        amountDue: bill.amount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(bills.id, billId));

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to skip payment:', error);
    return {
      success: false,
      error: 'Failed to skip payment. Please try again.',
    };
  }
}
