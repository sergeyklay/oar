'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SettingsService } from '@/lib/services/SettingsService';
import { RANGE_KEYS, type AllowedRangeValue } from '@/lib/constants';
import type { StructuredSettings } from '@/db/schema';
import type { ActionResult as BaseActionResult } from '@/lib/types';
import { getLogger } from '@/lib/logger';

const logger = getLogger('Actions:Settings');

interface ActionResult<T = void> extends BaseActionResult<T> {
  fieldErrors?: Record<string, string[]>;
}

/**
 * Fetches the complete settings structure (categories, sections, settings counts).
 *
 * Returns hierarchical data for rendering the Settings page.
 */
export async function getSettingsStructure(): Promise<ActionResult<StructuredSettings>> {
  try {
    const structure = await SettingsService.getStructure();
    return {
      success: true,
      data: structure,
    };
  } catch (error) {
    logger.error(error, 'Failed to fetch settings structure');
    return {
      success: false,
      error: 'Failed to load settings structure',
    };
  }
}

const updateRangeSchema = z.object({
  range: z.enum(RANGE_KEYS as readonly [string, ...string[]]),
});

/**
 * Updates the "due soon" range setting.
 *
 * @param input - Object containing the range value as a string
 * @returns ActionResult indicating success or failure
 */
export async function updateDueSoonRange(
  input: z.infer<typeof updateRangeSchema>
): Promise<ActionResult<void>> {
  const parsed = updateRangeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const parsedRange = parseInt(parsed.data.range, 10) as AllowedRangeValue;
    await SettingsService.setDueSoonRange(parsedRange);
    revalidatePath('/due-soon');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error(error, 'Failed to update due soon range');
    return {
      success: false,
      error: 'Failed to update setting',
    };
  }
}

/**
 * Updates the "paid recently" range setting.
 *
 * @param input - Object containing the range value as a string
 * @returns ActionResult indicating success or failure
 */
export async function updatePaidRecentlyRange(
  input: z.infer<typeof updateRangeSchema>
): Promise<ActionResult<void>> {
  const parsed = updateRangeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const parsedRange = parseInt(parsed.data.range, 10) as AllowedRangeValue;
    await SettingsService.setPaidRecentlyRange(parsedRange);
    revalidatePath('/paid-recently');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error(error, 'Failed to update paid recently range');
    return {
      success: false,
      error: 'Failed to update setting',
    };
  }
}

const billEndActionSchema = z.enum(['mark_as_paid', 'archive'], {
  message: 'Invalid bill end action',
});

export type BillEndAction = z.infer<typeof billEndActionSchema>;

const updateViewOptionsSchema = z.object({
  currency: z.string().length(3),
  locale: z.string().min(2),
  weekStart: z.coerce.number().min(0).max(6),
});

/**
 * Updates the view options settings (currency, locale, week start).
 *
 * @param input - Object containing currency, locale, and weekStart values
 * @returns ActionResult indicating success or failure
 */
export async function updateViewOptions(
  input: z.infer<typeof updateViewOptionsSchema>
): Promise<ActionResult<void>> {
  const parsed = updateViewOptionsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await SettingsService.setViewOptions(parsed.data);
    revalidatePath('/');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    logger.error(error, 'Failed to update view options');
    return {
      success: false,
      error: 'Failed to update settings',
    };
  }
}

/**
 * Updates the "after bill ends" action setting.
 *
 * @param action - The action to take when a bill ends ('mark_as_paid' or 'archive')
 * @returns ActionResult indicating success or failure
 */
export async function updateBillEndAction(
  action: BillEndAction
): Promise<ActionResult<void>> {
  const parsed = billEndActionSchema.safeParse(action);

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    const errorMessage = flattened.formErrors[0] || parsed.error.issues[0]?.message || 'Invalid bill end action';
    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    await SettingsService.setBillEndAction(parsed.data);
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    logger.error(error, 'Failed to update bill end action');
    return {
      success: false,
      error: 'Failed to update setting',
    };
  }
}

