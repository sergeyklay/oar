import { SettingsCategory } from './SettingsCategory';
import type { SettingsCategoryPanelProps } from './types';

/**
 * Content panel wrapper for the selected settings category.
 *
 * Renders the category with proper padding and scrollable content area.
 * Uses the existing SettingsCategory component for section rendering.
 */
export function SettingsCategoryPanel({ category }: SettingsCategoryPanelProps) {
  return (
    <div className="p-6">
      <SettingsCategory category={category} />
    </div>
  );
}

