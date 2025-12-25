'use server';

import { z } from 'zod';
import type { ActionResult } from '@/lib/types';
import { ForecastService, type ForecastBill } from '@/lib/services/ForecastService';

/**
 * Zod schema for forecast query parameters
 */
const forecastQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
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
  } catch {
    return {
      success: false,
      error: 'Failed to fetch forecast data',
    };
  }
}

