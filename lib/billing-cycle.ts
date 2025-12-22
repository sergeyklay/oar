/**
 * Pure utility functions for billing cycle calculations.
 *
 * These functions have NO database dependencies and can safely be used
 * in both server and client components.
 */

import { subDays, subMonths, subYears, startOfDay, isBefore } from 'date-fns';
import type { BillFrequency } from '@/db/schema';

/**
 * Calculates when the current billing cycle started.
 *
 * @param dueDate - The bill's current due date
 * @param frequency - Bill frequency
 * @returns Start date of the current billing cycle, or null for one-time bills
 */
export function getCycleStartDate(
  dueDate: Date,
  frequency: BillFrequency
): Date | null {
  switch (frequency) {
    case 'once':
      return null;
    case 'weekly':
      return subDays(dueDate, 7);
    case 'biweekly':
      return subDays(dueDate, 14);
    case 'twicemonthly':
      return subDays(dueDate, 14);
    case 'monthly':
      return subMonths(dueDate, 1);
    case 'bimonthly':
      return subMonths(dueDate, 2);
    case 'quarterly':
      return subMonths(dueDate, 3);
    case 'yearly':
      return subYears(dueDate, 1);
    default:
      return subMonths(dueDate, 1);
  }
}

/**
 * Determines if a payment date falls before the current billing cycle.
 *
 * Uses day-level comparison to avoid timezone edge cases.
 *
 * @param bill - Bill with dueDate and frequency
 * @param paidAt - The payment date
 * @returns True if paidAt is before the current billing cycle started
 */
export function isPaymentHistorical(
  bill: { dueDate: Date; frequency: BillFrequency },
  paidAt: Date
): boolean {
  const paidAtDay = startOfDay(paidAt);

  if (bill.frequency === 'once') {
    const dueDateDay = startOfDay(bill.dueDate);
    return isBefore(paidAtDay, dueDateDay);
  }

  const cycleStart = getCycleStartDate(bill.dueDate, bill.frequency);
  if (!cycleStart) {
    return false;
  }

  const cycleStartDay = startOfDay(cycleStart);
  return isBefore(paidAtDay, cycleStartDay);
}

