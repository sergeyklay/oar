'use server';

import { z } from 'zod';
import type { ActionResult } from '@/lib/types';
import {
  ForecastService,
  type ForecastBill,
  type MonthlyForecastTotal,
} from '@/lib/services/ForecastService';
import { getLogger } from '@/lib/logger';

const logger = getLogger('Actions:Forecast');

/**
 * Zod schema for forecast query parameters
 */
const forecastQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  tag: z.string().optional(),
});

/**
 * Zod schema for forecast range query parameters
 */
const forecastRangeQuerySchema = z.object({
  startMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  months: z.number().int().min(1).max(24).default(12),
  tag: z.string().optional(),
});

/**
 * Fetches forecast data for a specific month.
 *
 * @param input - Query parameters (month, optional tag)
 * @returns Forecast bills with estimates and amortization calculations
 */
export async function getForecastData(
  input: z.infer<typeof forecastQuerySchema>
): Promise<ActionResult<ForecastBill[]>> {
  const parsed = forecastQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid forecast query parameters',
    };
  }

  try {
    const bills = await ForecastService.getBillsForMonth(
      parsed.data.month,
      parsed.data.tag
    );
    return {
      success: true,
      data: bills,
    };
  } catch (error) {
    logger.error(error, 'Failed to fetch forecast data');
    return {
      success: false,
      error: 'Failed to fetch forecast data',
    };
  }
}

/**
 * Fetches forecast data for multiple months.
 *
 * @param input - Query parameters (startMonth, months, optional tag)
 * @returns Monthly forecast totals for chart visualization
 */
export async function getForecastDataForRange(
  input: z.infer<typeof forecastRangeQuerySchema>
): Promise<ActionResult<MonthlyForecastTotal[]>> {
  const parsed = forecastRangeQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid forecast range query parameters',
    };
  }

  try {
    const monthlyTotals = await ForecastService.getBillsForMonthRange(
      parsed.data.startMonth,
      parsed.data.months,
      parsed.data.tag
    );
    return {
      success: true,
      data: monthlyTotals,
    };
  } catch (error) {
    logger.error(error, 'Failed to fetch forecast data for range');
    return {
      success: false,
      error: 'Failed to fetch forecast data for range',
    };
  }
}

