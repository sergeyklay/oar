import { SettingsSection } from './SettingsSection';
import type { StructuredSettings } from '@/db/schema';

interface SettingsCategoryProps {
  category: StructuredSettings['categories'][number];
}

export function SettingsCategory({ category }: SettingsCategoryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{category.name}</h2>
      <div className="space-y-6 pl-4 border-l-2 border-border">
        {category.sections.map((section) => (
          <SettingsSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

