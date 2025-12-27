'use server';

import { z } from 'zod';
import type { ActionResult, PaymentWithBill, MonthlyPaymentTotal, AggregatedBillSpending } from '@/lib/types';
import { TransactionService } from '@/lib/services/TransactionService';
import { getLogger } from '@/lib/logger';

const logger = getLogger('Actions:History');

/**
 * Zod schema for history query parameters
 */
const historyQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  tag: z.string().optional(),
});

/**
 * Zod schema for history range query parameters
 */
const historyRangeQuerySchema = z.object({
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  months: z.number().int().min(1).max(24).default(12),
  tag: z.string().optional(),
});

/**
 * Zod schema for annual spending query parameters
 */
const annualSpendingQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Year must be in YYYY format'),
});

/**
 * Fetches payment history data for a specific month.
 *
 * @param input - Query parameters (month, optional tag)
 * @returns Payments with bill information and category icons
 */
export async function getMonthlyHistoryData(
  input: z.infer<typeof historyQuerySchema>
): Promise<ActionResult<PaymentWithBill[]>> {
  const parsed = historyQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid history query parameters',
    };
  }

  try {
    const payments = await TransactionService.getPaymentsByMonth(
      parsed.data.month,
      parsed.data.tag
    );
    return {
      success: true,
      data: payments,
    };
  } catch (error) {
    logger.error(error, 'Failed to fetch history data');
    return {
      success: false,
      error: 'Failed to fetch history data',
    };
  }
}

/**
 * Fetches payment history data for multiple months.
 *
 * @param input - Query parameters (startMonth, months, optional tag)
 * @returns Monthly payment totals for chart visualization
 */
export async function getMonthlyHistoryChartData(
  input: z.infer<typeof historyRangeQuerySchema>
): Promise<ActionResult<MonthlyPaymentTotal[]>> {
  const parsed = historyRangeQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid history range query parameters',
    };
  }

  try {
    const monthlyTotals = await TransactionService.getMonthlyPaymentTotals(
      parsed.data.startMonth,
      parsed.data.months,
      parsed.data.tag
    );
    return {
      success: true,
      data: monthlyTotals,
    };
  } catch (error) {
    logger.error(error, 'Failed to fetch chart data');
    return {
      success: false,
      error: 'Failed to fetch chart data',
    };
  }
}

/**
 * Fetches annual spending data aggregated by bill.
 *
 * @param input - Query parameters (year)
 * @returns Aggregated bill spending data with payment counts, totals, and averages
 */
export async function getAnnualSpendingData(
  input: z.infer<typeof annualSpendingQuerySchema>
): Promise<ActionResult<AggregatedBillSpending[]>> {
  const parsed = annualSpendingQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid annual spending query parameters',
    };
  }

  try {
    const aggregatedData = await TransactionService.getPaymentsByYearAggregatedByBill(
      parsed.data.year
    );
    return {
      success: true,
      data: aggregatedData,
    };
  } catch (error) {
    logger.error(error, 'Failed to fetch annual spending data');
    return {
      success: false,
      error: 'Failed to fetch annual spending data',
    };
  }
}

