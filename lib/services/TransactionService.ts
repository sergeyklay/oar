import { db, transactions, bills, billCategories, tags, billsToTags } from '@/db';
import { gte, lte, desc, eq, and, inArray } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays, parse, isValid, format, addMonths, parseISO } from 'date-fns';
import type { PaymentWithBill, Transaction, MonthlyPaymentTotal, AggregatedBillSpending } from '@/lib/types';
import {
  calculateMonthBoundaries,
  calculateExtendedQueryBoundaries,
  calculateFilterBoundaries,
  isTimestampInMonth,
} from '@/lib/utils';

/**
 * Service for transaction-related operations.
 */
export const TransactionService = {
  /**
   * Fetches recent payments within the specified lookback period, optionally filtered by bill tag.
   *
   * @param days - Number of days to look back (0 = today only, 7 = last 7 days)
   * @param tag - Optional tag slug for filtering
   * @returns Payments with bill information and category icons, ordered by paidAt descending
   */
  async getRecentPayments(days: number, tag?: string): Promise<PaymentWithBill[]> {
    const now = new Date();
    const endDate = endOfDay(now);
    const startDate = days === 0 ? startOfDay(now) : startOfDay(subDays(now, days));

    let billIds: string[] | undefined;
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

      billIds = billsWithTag.map((b) => b.billId);

      if (billIds.length === 0) {
        return [];
      }
    }

    const conditions = [
      gte(transactions.paidAt, startDate),
      lte(transactions.paidAt, endDate),
    ];

    if (billIds) {
      conditions.push(inArray(transactions.billId, billIds));
    }

    const results = await db
      .select({
        id: transactions.id,
        billTitle: bills.title,
        amount: transactions.amount,
        paidAt: transactions.paidAt,
        notes: transactions.notes,
        categoryIcon: billCategories.icon,
      })
      .from(transactions)
      .innerJoin(bills, eq(transactions.billId, bills.id))
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.paidAt));

    return results;
  },

  /**
   * Fetches all payments made on a specific date, optionally filtered by bill tag.
   *
   * @param date - Date string in YYYY-MM-DD format
   * @param tag - Optional tag slug for filtering
   * @returns Payments with bill information and category icons, ordered by paidAt descending
   * @throws Error if date string is invalid or cannot be parsed
   */
  async getPaymentsByDate(date: string, tag?: string): Promise<PaymentWithBill[]> {
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(dateObj)) {
      throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD format.`);
    }
    const startDate = startOfDay(dateObj);
    const endDate = endOfDay(dateObj);

    let billIds: string[] | undefined;
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

      billIds = billsWithTag.map((b) => b.billId);

      if (billIds.length === 0) {
        return [];
      }
    }

    const conditions = [
      gte(transactions.paidAt, startDate),
      lte(transactions.paidAt, endDate),
    ];

    if (billIds) {
      conditions.push(inArray(transactions.billId, billIds));
    }

    const results = await db
      .select({
        id: transactions.id,
        billTitle: bills.title,
        amount: transactions.amount,
        paidAt: transactions.paidAt,
        notes: transactions.notes,
        categoryIcon: billCategories.icon,
      })
      .from(transactions)
      .innerJoin(bills, eq(transactions.billId, bills.id))
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.paidAt));

    return results;
  },

  /**
   * Fetches transactions for a specific bill with optional limit and ordering.
   *
   * @param billId - Bill ID to fetch transactions for
   * @param options - Optional limit and ordering
   * @returns Array of transactions ordered by paidAt
   */
  async getByBillId(
    billId: string,
    options?: { limit?: number; orderBy?: 'paidAt' | 'paidAt DESC' }
  ): Promise<Transaction[]> {
    const baseQuery = db
      .select()
      .from(transactions)
      .where(eq(transactions.billId, billId));

    const orderedQuery =
      options?.orderBy === 'paidAt DESC'
        ? baseQuery.orderBy(desc(transactions.paidAt))
        : baseQuery.orderBy(transactions.paidAt);

    if (options?.limit) {
      return orderedQuery.limit(options.limit);
    }

    return orderedQuery;
  },

  /**
   * Fetches transactions for a specific bill within a specific month and year.
   *
   * Uses a two-phase approach to handle timezone boundaries:
   * 1. Extended query boundaries: Fetches transactions that could potentially
   *    belong to the target month in any timezone (UTC-12 to UTC+14)
   * 2. Post-query filtering: Filters results to include only payments that
   *    truly fall within the target month's boundaries
   *
   * This ensures payments logged at month boundaries (e.g., Oct 1 00:00 in UTC+2
   * = Sept 30 22:00 UTC) appear in October, not September, regardless of server
   * timezone.
   *
   * @param billId - Bill ID to fetch transactions for
   * @param month - Month number (1-12, where 1 = January, 12 = December)
   * @param year - Year number
   * @returns Array of transactions ordered by paidAt descending
   */
  async getByBillIdAndMonth(
    billId: string,
    month: number,
    year: number
  ): Promise<Transaction[]> {
    if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
      return [];
    }

    const boundaries = calculateMonthBoundaries(year, month);
    const { queryStart, queryEnd } = calculateExtendedQueryBoundaries(boundaries);
    const filterBoundaries = calculateFilterBoundaries(year, month, boundaries);

    const results = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.billId, billId),
          gte(transactions.paidAt, queryStart),
          lte(transactions.paidAt, queryEnd)
        )
      )
      .orderBy(desc(transactions.paidAt));

    return results.filter((payment) => isTimestampInMonth(payment.paidAt, filterBoundaries));
  },

  /**
   * Fetches all payments for a specific month, optionally filtered by bill tag.
   *
   * Uses a two-phase approach to handle timezone boundaries:
   * 1. Extended query boundaries: Fetches transactions that could potentially
   *    belong to the target month in any timezone (UTC-12 to UTC+14)
   * 2. Post-query filtering: Filters results to include only payments that
   *    truly fall within the target month's boundaries
   *
   * This ensures payments logged at month boundaries (e.g., Oct 1 00:00 in UTC+2
   * = Sept 30 22:00 UTC) appear in October, not September, regardless of server
   * timezone.
   *
   * Includes payments from archived bills if the payment date falls within the month.
   * This ensures complete historical accuracy in Monthly History views.
   *
   * @param month - Month string in YYYY-MM format (e.g., "2025-10")
   * @param tag - Optional tag slug for filtering payments by bill tag
   * @returns Payments with bill information and category icons, ordered by paidAt descending
   */
  async getPaymentsByMonth(month: string, tag?: string): Promise<PaymentWithBill[]> {
    const [yearStr, monthStr] = month.split('-');
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return [];
    }

    const boundaries = calculateMonthBoundaries(yearNum, monthNum);
    const { queryStart, queryEnd } = calculateExtendedQueryBoundaries(boundaries);
    const filterBoundaries = calculateFilterBoundaries(yearNum, monthNum, boundaries);

    let billIds: string[] | undefined;
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

      billIds = billsWithTag.map((b) => b.billId);

      if (billIds.length === 0) {
        return [];
      }
    }

    const conditions = [
      gte(transactions.paidAt, queryStart),
      lte(transactions.paidAt, queryEnd),
    ];

    if (billIds) {
      conditions.push(inArray(transactions.billId, billIds));
    }

    const results = await db
      .select({
        id: transactions.id,
        billTitle: bills.title,
        amount: transactions.amount,
        paidAt: transactions.paidAt,
        notes: transactions.notes,
        categoryIcon: billCategories.icon,
      })
      .from(transactions)
      .innerJoin(bills, eq(transactions.billId, bills.id))
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.paidAt));

    return results.filter((payment) => isTimestampInMonth(payment.paidAt, filterBoundaries));
  },

  /**
   * Fetches aggregated payment totals grouped by month for chart visualization.
   *
   * Uses a two-phase approach for each month in the range to handle timezone boundaries:
   * 1. Extended query boundaries: Fetches transactions that could potentially
   *    belong to the target month in any timezone (UTC-12 to UTC+14)
   * 2. Post-query filtering: Filters results to include only payments that
   *    truly fall within the target month's boundaries before aggregation
   *
   * This ensures payments logged at month boundaries appear in the correct month
   * regardless of server timezone, and prevents payments from being counted in
   * multiple months.
   *
   * Includes payments from archived bills if the payment date falls within the
   * selected date range. This ensures complete historical accuracy in Monthly
   * History chart views.
   *
   * @param startMonth - Starting month string in YYYY-MM format (e.g., "2025-10")
   * @param months - Number of months to include in the range (e.g., 12 for a full year)
   * @param tag - Optional tag slug for filtering payments by bill tag
   * @returns Array of monthly payment totals with month labels, ordered chronologically
   */
  async getMonthlyPaymentTotals(
    startMonth: string,
    months: number,
    tag?: string
  ): Promise<MonthlyPaymentTotal[]> {
    const startDate = parse(startMonth, 'yyyy-MM', new Date());
    let billIds: string[] | undefined;

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

      billIds = billsWithTag.map((b) => b.billId);

      if (billIds.length === 0) {
        return [];
      }
    }

    const monthlyTotals: MonthlyPaymentTotal[] = [];

    for (let i = 0; i < months; i++) {
      const currentMonth = addMonths(startDate, i);
      const yearNum = currentMonth.getFullYear();
      const monthNum = currentMonth.getMonth() + 1;

      const boundaries = calculateMonthBoundaries(yearNum, monthNum);
      const { queryStart, queryEnd } = calculateExtendedQueryBoundaries(boundaries);
      const filterBoundaries = calculateFilterBoundaries(yearNum, monthNum, boundaries);

      const conditions = [
        gte(transactions.paidAt, queryStart),
        lte(transactions.paidAt, queryEnd),
      ];

      if (billIds) {
        conditions.push(inArray(transactions.billId, billIds));
      }

      const results = await db
        .select({
          amount: transactions.amount,
          paidAt: transactions.paidAt,
        })
        .from(transactions)
        .innerJoin(bills, eq(transactions.billId, bills.id))
        .where(and(...conditions));

      const filtered = results.filter((tx) => isTimestampInMonth(tx.paidAt, filterBoundaries));

      const totalPaid = filtered.reduce((sum, tx) => sum + tx.amount, 0);
      const monthLabel = format(currentMonth, 'MMM');
      const monthStr = format(currentMonth, 'yyyy-MM');

      monthlyTotals.push({
        month: monthStr,
        monthLabel,
        totalPaid,
      });
    }

    return monthlyTotals;
  },

  /**
   * Fetches all payments for a year, grouped by bill, with aggregated statistics.
   *
   * Uses extended query boundaries to handle timezone offsets. All dates are stored
   * in UTC in the database (per codebase guidelines), which ensures consistent behavior
   * regardless of server timezone.
   *
   * When querying for payments within a calendar year, we need to account for the fact
   * that a payment logged on "Jan 1, 2025" in the user's local timezone may be stored
   * with a UTC timestamp from Dec 31, 2024 (for timezones ahead of UTC). Similarly, a
   * payment logged on "Dec 31, 2025" may be stored with a UTC timestamp from Jan 1, 2026
   * (for timezones behind UTC).
   *
   * To include all payments logged within the calendar year regardless of user timezone,
   * we extend the query boundaries to cover the maximum possible timezone offsets:
   * - UTC+14 (Line Islands, Kiribati): Jan 1, 2025 00:00:00 local = 2024-12-31T10:00:00.000Z
   * - UTC-12 (Baker Island, Howland Island): Dec 31, 2025 23:59:59 local = 2026-01-01T11:59:59.999Z
   *
   * This is an intentional design decision, not a workaround. Storing in UTC and querying
   * with UTC boundaries that account for timezone offsets is the standard approach for
   * calendar-based queries when timezone information is not stored with each record.
   *
   * Includes payments from archived bills if the payment date falls within the selected
   * year. This ensures complete historical accuracy in Annual Spending views.
   *
   * @param year - Year string in YYYY format (e.g., "2025")
   * @returns Array of aggregated bill spending data sorted by totalAmount descending
   */
  async getPaymentsByYearAggregatedByBill(year: string): Promise<AggregatedBillSpending[]> {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return [];
    }

    // Extended query boundaries to catch all timezone offsets (see JSDoc above for rationale)
    const yearStart = parseISO(`${yearNum - 1}-12-31T10:00:00.000Z`);
    const yearEnd = parseISO(`${yearNum + 1}-01-01T11:59:59.999Z`);

    const results = await db
      .select({
        billId: transactions.billId,
        billTitle: bills.title,
        categoryIcon: billCategories.icon,
        amount: transactions.amount,
      })
      .from(transactions)
      .innerJoin(bills, eq(transactions.billId, bills.id))
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(gte(transactions.paidAt, yearStart), lte(transactions.paidAt, yearEnd)))
      .orderBy(transactions.billId);

    // Group payments by billId using a Map for O(1) lookups
    const aggregatedMap = new Map<string, {
      billId: string;
      billTitle: string;
      categoryIcon: string;
      amounts: number[];
    }>();

    for (const result of results) {
      const existing = aggregatedMap.get(result.billId);
      if (existing) {
        existing.amounts.push(result.amount);
      } else {
        aggregatedMap.set(result.billId, {
          billId: result.billId,
          billTitle: result.billTitle,
          categoryIcon: result.categoryIcon,
          amounts: [result.amount],
        });
      }
    }

    // Calculate aggregated statistics for each bill
    const aggregated: AggregatedBillSpending[] = [];

    for (const [, data] of aggregatedMap) {
      const paymentCount = data.amounts.length;
      const totalAmount = data.amounts.reduce((sum, amount) => sum + amount, 0);
      // Round average to nearest integer (amounts are in minor units, so rounding is appropriate)
      const averageAmount = Math.round(totalAmount / paymentCount);

      aggregated.push({
        billId: data.billId,
        billTitle: data.billTitle,
        categoryIcon: data.categoryIcon,
        paymentCount,
        totalAmount,
        averageAmount,
      });
    }

    // Sort by totalAmount descending (highest spending first)
    aggregated.sort((a, b) => b.totalAmount - a.totalAmount);

    return aggregated;
  },
};

