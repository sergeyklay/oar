'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SettingsService } from '@/lib/services/SettingsService';
import { RANGE_KEYS, type AllowedRangeValue } from '@/lib/constants';
import type { StructuredSettings } from '@/db/schema';
import type { ActionResult as BaseActionResult } from '@/lib/types';

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
    console.error('Failed to fetch settings structure:', error);
    return {
      success: false,
      error: 'Failed to load settings structure',
    };
  }
}

const updateDueSoonRangeSchema = z.object({
  range: z.enum(RANGE_KEYS as readonly [string, ...string[]]),
});

/**
 * Updates the "due soon" range setting.
 *
 * @param input - Object containing the range value as a string
 * @returns ActionResult indicating success or failure
 */
export async function updateDueSoonRange(
  input: z.infer<typeof updateDueSoonRangeSchema>
): Promise<ActionResult<void>> {
  const parsed = updateDueSoonRangeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const parsedRange = parseInt(parsed.data.range, 10) as AllowedRangeValue;
    await SettingsService.setDueSoonRange(parsedRange);
    revalidatePath('/due-soon');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update due soon range:', error);
    return {
      success: false,
      error: 'Failed to update setting',
    };
  }
}

