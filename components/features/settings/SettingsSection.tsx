import type { StructuredSettings } from '@/db/schema';

interface SettingsSectionProps {
  section: StructuredSettings['categories'][number]['sections'][number];
}

export function SettingsSection({ section }: SettingsSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{section.name}</h3>
      {section.description && (
        <p className="text-sm text-muted-foreground">{section.description}</p>
      )}
      <p className="text-sm text-muted-foreground italic">
        Settings coming soon
      </p>
    </div>
  );
}

