import { SettingsSection } from './SettingsSection';
import type { StructuredSettings } from '@/db/schema';

interface SettingsCategoryProps {
  category: StructuredSettings['categories'][number];
}

export function SettingsCategory({ category }: SettingsCategoryProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{category.name}</h2>
      <div className="space-y-8">
        {category.sections.map((section) => (
          <SettingsSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
