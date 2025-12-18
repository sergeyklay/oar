'use server';

import { SettingsService } from '@/lib/services/SettingsService';
import type { StructuredSettings } from '@/db/schema';
import type { ActionResult } from '@/lib/types';

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

