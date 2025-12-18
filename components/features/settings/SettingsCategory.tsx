import { SettingsSection } from './SettingsSection';

interface SettingsCategoryProps {
  category: {
    id: string;
    slug: string;
    name: string;
    displayOrder: number;
    sections: Array<{
      id: string;
      slug: string;
      name: string;
      description: string | null;
      displayOrder: number;
      settingsCount: number;
    }>;
  };
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

