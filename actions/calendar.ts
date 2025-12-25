'use server';

import { db, bills, transactions } from '@/db';
import { and, eq, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { BillStatus } from '@/db/schema';

/**
 * Map of date strings to arrays of bill statuses for that date.
 *
 * Example: { "2025-12-15": ["pending", "paid"], "2025-12-20": ["overdue"] }
 */
export type DateStatusMap = Record<string, BillStatus[]>;

/**
 * Map of date strings to boolean indicators for payment dates.
 *
 * Example: { "2025-12-15": true, "2025-12-20": true }
 * Used for calendar dot rendering on Paid Recently page.
 */
export type PaymentDateMap = Record<string, boolean>;

/**
 * Fetches bill statuses grouped by due date for a given month.
 *
 * This is a lightweight query designed for calendar dot rendering.
 * Returns only the data needed to color dots, not full bill details.
 *
 * @param monthStr - Month in YYYY-MM format (e.g., "2025-12")
 * @returns Map of date strings to status arrays
 */
export async function getBillDatesForMonth(
  monthStr: string
): Promise<DateStatusMap> {
  // Parse month string to date range
  const [year, month] = monthStr.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  // Query bills in date range (non-archived only)
  const results = await db
    .select({
      dueDate: bills.dueDate,
      status: bills.status,
    })
    .from(bills)
    .where(
      and(
        eq(bills.isArchived, false),
        gte(bills.dueDate, start),
        lte(bills.dueDate, end)
      )
    );

  // Group by date string
  const dateMap: DateStatusMap = {};

  for (const bill of results) {
    const dateKey = format(bill.dueDate, 'yyyy-MM-dd');
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = [];
    }
    dateMap[dateKey].push(bill.status);
  }

  return dateMap;
}

/**
 * Fetches payment dates grouped by day for a given month.
 *
 * Returns a map indicating which dates have payments (for white dot rendering).
 *
 * @param monthStr - Month in YYYY-MM format (e.g., "2025-12")
 * @returns Map of date strings to boolean (true = has payment)
 */
export async function getPaymentDatesForMonth(
  monthStr: string
): Promise<PaymentDateMap> {
  // Parse month string to date range
  const [year, month] = monthStr.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  // Query transactions in date range
  const results = await db
    .select({
      paidAt: transactions.paidAt,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.paidAt, start),
        lte(transactions.paidAt, end)
      )
    );

  // Group by date string
  const dateMap: PaymentDateMap = {};

  for (const transaction of results) {
    const dateKey = format(transaction.paidAt, 'yyyy-MM-dd');
    dateMap[dateKey] = true;
  }

  return dateMap;
}
