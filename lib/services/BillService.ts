import { db, bills, tags, billsToTags, billCategories } from '@/db';
import type { BillWithTags, Tag, Bill } from '@/db/schema';
import { and, eq, gte, lte, inArray, ne, or, sql } from 'drizzle-orm';
import { startOfDay, endOfDay, addDays, parse } from 'date-fns';
import { SettingsService } from './SettingsService';
import { DateAdjustmentService } from './DateAdjustmentService';
import {
  calculateMonthBoundaries,
  calculateExtendedQueryBoundaries,
  calculateFilterBoundaries,
  isTimestampInMonth,
  type FilterBoundaries,
} from '@/lib/utils';

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
  /** Include archived bills (returns both archived and non-archived) */
  includeArchived?: boolean;
  /** Return only archived bills (takes precedence over includeArchived) */
  archivedOnly?: boolean;
  /** Whether to include automatic bills in Due Soon and Due This Month views (default: true) */
  includeAutoPayInDueSoon?: boolean;
  /**
   * User's timezone offset in hours from UTC.
   * Positive for east (e.g., 1 for UTC+1), negative for west (e.g., -5 for UTC-5).
   * Used for accurate month boundary filtering.
   */
  userTimezoneOffset?: number;
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
   * @param includeArchived - Whether to include archived bills (default: false)
   * @returns Bill with tags and category icon or null if not found
   */
  async getWithTags(
    billId: string,
    includeArchived: boolean = false,
  ): Promise<BillWithTags | null> {
    const conditions = [eq(bills.id, billId)];
    if (!includeArchived) {
      conditions.push(eq(bills.isArchived, false));
    }

    const [result] = await db
      .select({
        bill: bills,
        categoryIcon: billCategories.icon,
      })
      .from(bills)
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(...conditions));

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
      endDate: result.bill.endDate ?? null,
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
    const {
      date,
      month,
      dateRange,
      tag,
      includeArchived = false,
      archivedOnly = false,
      includeAutoPayInDueSoon = true,
      userTimezoneOffset = 0,
    } = options;

    const conditions = [];

    // Context for post-query filtering when using month filter
    let monthFilterContext: { filterBoundaries: FilterBoundaries; isCurrentMonth: boolean } | null =
      null;

    if (archivedOnly) {
      conditions.push(eq(bills.isArchived, true));
    } else if (!includeArchived) {
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

      if (includeAutoPayInDueSoon === false) {
        conditions.push(eq(bills.isAutoPay, false));
      }
    } else if (month) {
      // Timezone-aware month filtering using extended boundaries + post-query filter
      const [year, monthNum] = month.split('-').map(Number);

      // Calculate timezone-aware boundaries
      const boundaries = calculateMonthBoundaries(year, monthNum);
      const { queryStart, queryEnd } = calculateExtendedQueryBoundaries(boundaries);
      const filterBoundaries = calculateFilterBoundaries(
        year,
        monthNum,
        boundaries,
        userTimezoneOffset,
      );

      // Check if viewing current month (for overdue inclusion)
      const today = startOfDay(new Date());
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // 1-indexed
      const isCurrentMonth = year === currentYear && monthNum === currentMonth;

      if (isCurrentMonth) {
        // Current month: include bills in range OR overdue bills
        conditions.push(
          or(
            and(gte(bills.dueDate, queryStart), lte(bills.dueDate, queryEnd)),
            eq(bills.status, 'overdue'),
          ),
        );
      } else {
        // Past/future month: only bills in extended range
        conditions.push(gte(bills.dueDate, queryStart));
        conditions.push(lte(bills.dueDate, queryEnd));
      }
      conditions.push(ne(bills.status, 'paid'));

      if (includeAutoPayInDueSoon === false) {
        conditions.push(eq(bills.isAutoPay, false));
      }

      // Store filter context for post-query filtering
      monthFilterContext = { filterBoundaries, isCurrentMonth };
    }

    if (tag) {
      const [tagRecord] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, tag));

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

    const baseQuery = db
      .select({
        bill: bills,
        categoryIcon: billCategories.icon,
      })
      .from(bills)
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id));

    const finalConditions = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch in two parts to group paid bills at the bottom without raw SQL CASE expressions.
    // This maintains the "Active Payer" focus by prioritizing pending/overdue obligations.
    const activeResults = await baseQuery
      .where(and(finalConditions, ne(bills.status, 'paid')))
      .orderBy(bills.dueDate);

    const paidResults = await baseQuery
      .where(and(finalConditions, eq(bills.status, 'paid')))
      .orderBy(bills.dueDate);

    let billsWithCategories = [...activeResults, ...paidResults];

    // Post-query filtering for timezone-aware month filtering
    // This excludes bills that fall outside the target month when accounting for timezone offsets
    if (monthFilterContext) {
      const { filterBoundaries, isCurrentMonth } = monthFilterContext;
      billsWithCategories = billsWithCategories.filter((item) => {
        // Overdue bills are always included when viewing current month
        if (isCurrentMonth && item.bill.status === 'overdue') {
          return true;
        }
        // For all other bills, check if dueDate falls within the timezone-aware boundaries
        return isTimestampInMonth(item.bill.dueDate, filterBoundaries);
      });
    }

    if (billsWithCategories.length === 0) {
      return [];
    }

    const billIds = billsWithCategories.map((b) => b.bill.id);
    const tagsByBillId = await this.getTagsForBills(billIds);

    return billsWithCategories.map(({ bill, categoryIcon }) => ({
      ...bill,
      endDate: bill.endDate ?? null,
      tags: tagsByBillId.get(bill.id) ?? [],
      categoryIcon,
    }));
  },

  /**
   * Searches bills by title using word-start matching.
   * Searches both archived and non-archived bills.
   *
   * @param query - Search query (minimum 3 characters, case-insensitive)
   * @returns Array of bills with tags and category icons matching the query, limited to 20 results
   */
  async searchByTitle(query: string): Promise<BillWithTags[]> {
    // Normalize query: trim whitespace and convert to lowercase
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length < 3) {
      return [];
    }

    // Split query into words by whitespace
    const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 0);

    if (words.length === 0) {
      return [];
    }

    const wordConditions = words.map((word) => {
      const startPattern = `${word}%`;
      const containsPattern = `% ${word}%`;
      return sql`(LOWER(${bills.title}) LIKE ${startPattern} OR LOWER(${bills.title}) LIKE ${containsPattern})`;
    });

    const titleCondition = and(...wordConditions);

    const billsWithCategories = await db
      .select({
        bill: bills,
        categoryIcon: billCategories.icon,
      })
      .from(bills)
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(titleCondition)
      .orderBy(bills.title)
      .limit(20);

    if (billsWithCategories.length === 0) {
      return [];
    }

    // Fetch tags for matching bills
    const billIds = billsWithCategories.map((b) => b.bill.id);
    const tagsByBillId = await this.getTagsForBills(billIds);

    // Map results to BillWithTags format
    return billsWithCategories.map(({ bill, categoryIcon }) => ({
      ...bill,
      endDate: bill.endDate ?? null,
      tags: tagsByBillId.get(bill.id) ?? [],
      categoryIcon,
    }));
  },

  /**
   * Returns the adjusted payment date for a bill.
   *
   * Fetches the global weekend adjustment setting, resolves the effective strategy
   * (bill override if set, otherwise global default), and applies the adjustment to
   * the bill's anchor date (stored in dueDate).
   *
   * @param bill - Bill with weekendAdjustment field (may be null)
   * @returns Adjusted payment date for display
   */
  async getAdjustedDueDate(bill: Pick<Bill, 'dueDate' | 'weekendAdjustment'>): Promise<Date> {
    const globalStrategy = await SettingsService.getWeekendAdjustment();
    const effectiveStrategy = DateAdjustmentService.getEffectiveStrategy(
      bill.weekendAdjustment,
      globalStrategy,
    );
    return DateAdjustmentService.adjustPaymentDate(bill.dueDate, effectiveStrategy);
  },
};
