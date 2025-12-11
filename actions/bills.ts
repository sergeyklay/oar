'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, bills, tags, billsToTags } from '@/db';
import type { Tag, BillWithTags } from '@/db/schema';
import { toMinorUnits, parseMoneyInput, isValidMoneyInput } from '@/lib/money';
import { and, eq, gte, lte, inArray } from 'drizzle-orm';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

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

  const { title, amount, dueDate, frequency, isAutoPay, isVariable, tagIds } = parsed.data;

  try {
    const cleanedAmount = parseMoneyInput(amount);
    const amountInMinorUnits = toMinorUnits(cleanedAmount);
    const now = new Date();
    const status = dueDate < now ? 'overdue' : 'pending';

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

interface GetBillsOptions {
  /** Filter by specific date (YYYY-MM-DD) */
  date?: string;
  /** Filter by month (YYYY-MM) - used when date is not provided */
  month?: string;
  /** Filter by tag slug */
  tag?: string;
  /** Include archived bills */
  includeArchived?: boolean;
}

/**
 * Fetches bills with their associated tags.
 *
 * Performance note: Uses a two-query approach for clarity.
 * For very large datasets (500+ bills), consider raw SQL with GROUP_CONCAT.
 *
 * Priority: date > month > all bills
 */
export async function getBillsFiltered(
  options: GetBillsOptions = {}
): Promise<BillWithTags[]> {
  const { date, month, tag, includeArchived = false } = options;

  const conditions = [];

  // Always exclude archived unless requested
  if (!includeArchived) {
    conditions.push(eq(bills.isArchived, false));
  }

  // Date filter (specific day)
  if (date) {
    const dayDate = new Date(date);
    const dayStart = startOfDay(dayDate);
    const dayEnd = endOfDay(dayDate);
    conditions.push(gte(bills.dueDate, dayStart));
    conditions.push(lte(bills.dueDate, dayEnd));
  }
  // Month filter (entire month)
  else if (month) {
    const [year, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(year, monthNum - 1, 1);
    conditions.push(gte(bills.dueDate, startOfMonth(monthDate)));
    conditions.push(lte(bills.dueDate, endOfMonth(monthDate)));
  }

  // Tag filter - requires subquery
  if (tag) {
    // Get tag ID from slug
    const [tagRecord] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, tag));

    if (!tagRecord) {
      // Tag doesn't exist, return empty
      return [];
    }

    // Get bill IDs that have this tag
    const billsWithTag = await db
      .select({ billId: billsToTags.billId })
      .from(billsToTags)
      .where(eq(billsToTags.tagId, tagRecord.id));

    const billIds = billsWithTag.map((b) => b.billId);

    if (billIds.length === 0) {
      return [];
    }

    conditions.push(inArray(bills.id, billIds));
  }

  // Fetch bills
  const billsResult =
    conditions.length === 0
      ? await db.select().from(bills).orderBy(bills.dueDate)
      : await db
          .select()
          .from(bills)
          .where(and(...conditions))
          .orderBy(bills.dueDate);

  if (billsResult.length === 0) {
    return [];
  }

  // Fetch all tags for these bills in a single query
  const billIds = billsResult.map((b) => b.id);
  const tagAssociations = await db
    .select({
      billId: billsToTags.billId,
      tagId: billsToTags.tagId,
      tagName: tags.name,
      tagSlug: tags.slug,
      tagCreatedAt: tags.createdAt,
    })
    .from(billsToTags)
    .innerJoin(tags, eq(billsToTags.tagId, tags.id))
    .where(inArray(billsToTags.billId, billIds));

  // Group tags by bill ID
  const tagsByBillId = new Map<string, Tag[]>();
  for (const assoc of tagAssociations) {
    const billTags = tagsByBillId.get(assoc.billId) ?? [];
    billTags.push({
      id: assoc.tagId,
      name: assoc.tagName,
      slug: assoc.tagSlug,
      createdAt: assoc.tagCreatedAt,
    });
    tagsByBillId.set(assoc.billId, billTags);
  }

  // Merge bills with their tags
  return billsResult.map((bill) => ({
    ...bill,
    tags: tagsByBillId.get(bill.id) ?? [],
  }));
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

  const { id, title, amount, dueDate, frequency, isAutoPay, isVariable, tagIds } = parsed.data;

  try {
    const cleanedAmount = parseMoneyInput(amount);
    const amountInMinorUnits = toMinorUnits(cleanedAmount);
    const now = new Date();
    const status = dueDate < now ? 'overdue' : 'pending';

    // Update bill (also sync amountDue when base amount changes)
    await db
      .update(bills)
      .set({
        title,
        amount: amountInMinorUnits,
        amountDue: amountInMinorUnits,
        dueDate,
        frequency,
        isAutoPay,
        isVariable,
        status,
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

/**
 * Fetch tags for a specific bill (used in edit form)
 *
 * @param billId - Bill ID to fetch tags for
 */
export async function getBillTags(billId: string): Promise<Tag[]> {
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
    })
    .from(billsToTags)
    .innerJoin(tags, eq(billsToTags.tagId, tags.id))
    .where(eq(billsToTags.billId, billId));

  return result;
}
