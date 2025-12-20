import { db, bills, tags, billsToTags, billCategories } from '@/db';
import type { BillWithTags, Tag } from '@/db/schema';
import { and, eq, gte, lte, inArray, ne, or } from 'drizzle-orm';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, parse, addDays } from 'date-fns';

/**
 * Filter options for bill queries.
 */
export interface GetBillsOptions {
  /** Filter by specific date (YYYY-MM-DD) - takes precedence */
  date?: string;
  /**
   * Filter by month (YYYY-MM format) - filters bills by calendar month
   * Uses inclusive date range from start of month to end of month
   * When both `date` and `month` are provided, `date` takes precedence
   */
  month?: string;
  /** Filter by date range - number of days from today (0 = today only) */
  dateRange?: number;
  /** Filter by tag slug */
  tag?: string;
  /** Include archived bills */
  includeArchived?: boolean;
}

/**
 * BillService
 *
 * Domain logic for bill-related operations.
 * Pure data access; no validation (handled by actions layer).
 */
export const BillService = {
  /**
   * Fetch a single bill with its associated tags and category icon.
   *
   * @param billId - Bill ID to fetch (assumed valid)
   * @returns Bill with tags and category icon or null if not found/archived
   */
  async getWithTags(billId: string): Promise<BillWithTags | null> {
    const [result] = await db
      .select({
        bill: bills,
        categoryIcon: billCategories.icon,
      })
      .from(bills)
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(eq(bills.id, billId), eq(bills.isArchived, false)));

    if (!result) {
      return null;
    }

    const billTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(billsToTags)
      .innerJoin(tags, eq(billsToTags.tagId, tags.id))
      .where(eq(billsToTags.billId, billId))
      .orderBy(tags.name);

    return {
      ...result.bill,
      tags: billTags,
      categoryIcon: result.categoryIcon,
    };
  },

  /**
   * Fetch tags for a specific bill.
   *
   * @param billId - Bill ID to fetch tags for
   * @returns Array of tags
   */
  async getTags(billId: string): Promise<Tag[]> {
    return db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(billsToTags)
      .innerJoin(tags, eq(billsToTags.tagId, tags.id))
      .where(eq(billsToTags.billId, billId))
      .orderBy(tags.name);
  },

  /**
   * Fetch multiple bills with their associated tags.
   *
   * @param billIds - Array of bill IDs
   * @returns Map of bill ID to tags array
   */
  async getTagsForBills(billIds: string[]): Promise<Map<string, Tag[]>> {
    if (billIds.length === 0) {
      return new Map();
    }

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
      .where(inArray(billsToTags.billId, billIds))
      .orderBy(tags.name);

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

    return tagsByBillId;
  },

  /**
   * Fetches bills with their associated tags and category icons based on filter options.
   *
   * Filtering behavior:
   * - When `date` is provided, filters by that specific day (local time) - takes precedence over `month`
   * - When `month` is provided (and no `date`), filters by calendar month range and excludes paid bills
   * - When neither is provided, returns all bills sorted by closest payment date
   *
   * @param options - Filter options
   * @returns Array of bills with tags and category icons
   */
  async getFiltered(options: GetBillsOptions = {}): Promise<BillWithTags[]> {
    const { date, month, dateRange, tag, includeArchived = false } = options;

    const conditions = [];

    if (!includeArchived) {
      conditions.push(eq(bills.isArchived, false));
    }

    if (date) {
      const dayDate = parse(date, 'yyyy-MM-dd', new Date());
      const dayStart = startOfDay(dayDate);
      const dayEnd = endOfDay(dayDate);
      conditions.push(gte(bills.dueDate, dayStart));
      conditions.push(lte(bills.dueDate, dayEnd));
    } else if (dateRange !== undefined) {
      const today = startOfDay(new Date());
      let endDate: Date;

      if (dateRange === 0) {
        endDate = endOfDay(today);
      } else if (dateRange === 1) {
        const tomorrow = addDays(today, 1);
        endDate = endOfDay(tomorrow);
      } else {
        const rangeEnd = addDays(today, dateRange);
        endDate = endOfDay(rangeEnd);
      }

      conditions.push(lte(bills.dueDate, endDate));
      conditions.push(ne(bills.status, 'paid'));
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const monthDate = new Date(year, monthNum - 1, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const today = startOfDay(new Date());

      if (monthStart <= today && today <= monthEnd) {
        conditions.push(
          or(
            and(gte(bills.dueDate, monthStart), lte(bills.dueDate, monthEnd)),
            eq(bills.status, 'overdue')
          )
        );
      } else {
        conditions.push(gte(bills.dueDate, monthStart));
        conditions.push(lte(bills.dueDate, monthEnd));
      }
      conditions.push(ne(bills.status, 'paid'));
    }

    if (tag) {
      const [tagRecord] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tag));

      if (!tagRecord) {
        return [];
      }

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

    const billsWithCategories =
      conditions.length === 0
        ? await db
            .select({
              bill: bills,
              categoryIcon: billCategories.icon,
            })
            .from(bills)
            .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
            .orderBy(bills.dueDate)
        : await db
            .select({
              bill: bills,
              categoryIcon: billCategories.icon,
            })
            .from(bills)
            .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
            .where(and(...conditions))
            .orderBy(bills.dueDate);

    if (billsWithCategories.length === 0) {
      return [];
    }

    const billIds = billsWithCategories.map((b) => b.bill.id);
    const tagsByBillId = await this.getTagsForBills(billIds);

    return billsWithCategories.map(({ bill, categoryIcon }) => ({
      ...bill,
      tags: tagsByBillId.get(bill.id) ?? [],
      categoryIcon,
    }));
  },
};

