import { db, transactions, bills } from '@/db';
import { gte, lte, desc, eq, and } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { PaymentWithBill } from '@/lib/types';

/**
 * Service for transaction-related operations.
 */
export const TransactionService = {
  /**
   * Fetches recent payments within the specified lookback period.
   *
   * @param days - Number of days to look back (0 = today only, 7 = last 7 days)
   * @returns Payments with bill information, ordered by paidAt descending
   */
  async getRecentPayments(days: number): Promise<PaymentWithBill[]> {
    const now = new Date();
    let startDate: Date;
    const endDate = endOfDay(now);

    if (days === 0) {
      startDate = startOfDay(now);
    } else if (days === 1) {
      startDate = startOfDay(subDays(now, 1));
    } else {
      startDate = startOfDay(subDays(now, days));
    }

    const results = await db
      .select({
        id: transactions.id,
        billTitle: bills.title,
        amount: transactions.amount,
        paidAt: transactions.paidAt,
        notes: transactions.notes,
      })
      .from(transactions)
      .innerJoin(bills, eq(transactions.billId, bills.id))
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

