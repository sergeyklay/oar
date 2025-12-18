import type { StructuredSettings } from '@/db/schema';
import { SettingsCategory } from './SettingsCategory';

interface SettingsCategoryListProps {
  structure: StructuredSettings;
}

export function SettingsCategoryList({ structure }: SettingsCategoryListProps) {
  return (
    <div className="p-6 space-y-8">
      {structure.categories.map((category) => (
        <SettingsCategory key={category.id} category={category} />
      ))}
    </div>
  );
}

