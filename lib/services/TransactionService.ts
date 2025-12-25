import { db, transactions, bills, billCategories } from '@/db';
import { gte, lte, desc, eq, and } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays, parse } from 'date-fns';
import type { PaymentWithBill } from '@/lib/types';

/**
 * Service for transaction-related operations.
 */
export const TransactionService = {
  /**
   * Fetches recent payments within the specified lookback period.
   *
   * @param days - Number of days to look back (0 = today only, 7 = last 7 days)
   * @returns Payments with bill information and category icons, ordered by paidAt descending
   */
  async getRecentPayments(days: number): Promise<PaymentWithBill[]> {
    const now = new Date();
    const endDate = endOfDay(now);
    const startDate = days === 0 ? startOfDay(now) : startOfDay(subDays(now, days));

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
      .where(
        and(
          gte(transactions.paidAt, startDate),
          lte(transactions.paidAt, endDate)
        )
      )
      .orderBy(desc(transactions.paidAt));

    return results;
  },

  /**
   * Fetches all payments made on a specific date.
   *
   * @param date - Date string in YYYY-MM-DD format
   * @returns Payments with bill information and category icons, ordered by paidAt descending
   */
  async getPaymentsByDate(date: string): Promise<PaymentWithBill[]> {
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    const startDate = startOfDay(dateObj);
    const endDate = endOfDay(dateObj);

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
      .where(
        and(
          gte(transactions.paidAt, startDate),
          lte(transactions.paidAt, endDate)
        )
      )
      .orderBy(desc(transactions.paidAt));

    return results;
  },
};

