import { db, transactions, bills, billCategories, tags, billsToTags } from '@/db';
import { gte, lte, desc, eq, and, inArray } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays, parse, isValid, startOfMonth, endOfMonth, format, addMonths, startOfYear, endOfYear } from 'date-fns';
import type { PaymentWithBill, Transaction, MonthlyPaymentTotal, AggregatedBillSpending } from '@/lib/types';

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
   * @param billId - Bill ID to fetch transactions for
   * @param month - Month number (1-12)
   * @param year - Year number
   * @returns Array of transactions ordered by paidAt descending
   */
  async getByBillIdAndMonth(
    billId: string,
    month: number,
    year: number
  ): Promise<Transaction[]> {
    const monthDate = new Date(year, month - 1, 1);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const results = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.billId, billId),
          gte(transactions.paidAt, monthStart),
          lte(transactions.paidAt, monthEnd)
        )
      )
      .orderBy(desc(transactions.paidAt));

    return results;
  },

  /**
   * Fetches all payments for a specific month, optionally filtered by bill tag.
   *
   * @param month - Month string in YYYY-MM format
   * @param tag - Optional tag slug for filtering
   * @returns Payments with bill information and category icons, ordered by paidAt descending
   */
  async getPaymentsByMonth(month: string, tag?: string): Promise<PaymentWithBill[]> {
    const monthDate = parse(month, 'yyyy-MM', new Date());
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

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
      gte(transactions.paidAt, monthStart),
      lte(transactions.paidAt, monthEnd),
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
   * Fetches aggregated payment totals grouped by month for chart visualization.
   *
   * @param startMonth - Starting month string in YYYY-MM format
   * @param months - Number of months to include in the range
   * @param tag - Optional tag slug for filtering
   * @returns Array of monthly payment totals with month labels
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
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const conditions = [
        gte(transactions.paidAt, monthStart),
        lte(transactions.paidAt, monthEnd),
      ];

      if (billIds) {
        conditions.push(inArray(transactions.billId, billIds));
      }

      const results = await db
        .select({
          amount: transactions.amount,
        })
        .from(transactions)
        .innerJoin(bills, eq(transactions.billId, bills.id))
        .where(and(...conditions));

      const totalPaid = results.reduce((sum, tx) => sum + tx.amount, 0);
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
   * @param year - Year string in YYYY format
   * @returns Array of aggregated bill spending data sorted by totalAmount descending
   */
  async getPaymentsByYearAggregatedByBill(year: string): Promise<AggregatedBillSpending[]> {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return [];
    }

    const yearDate = parse(`${year}-06-15`, 'yyyy-MM-dd', new Date());
    const yearStart = startOfYear(yearDate);
    const yearEndDay = endOfYear(yearDate);

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
      .where(and(gte(transactions.paidAt, yearStart), lte(transactions.paidAt, yearEndDay)))
      .orderBy(transactions.billId);

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

    const aggregated: AggregatedBillSpending[] = [];

    for (const [, data] of aggregatedMap) {
      const paymentCount = data.amounts.length;
      const totalAmount = data.amounts.reduce((sum, amount) => sum + amount, 0);
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

    aggregated.sort((a, b) => b.totalAmount - a.totalAmount);

    return aggregated;
  },
};

