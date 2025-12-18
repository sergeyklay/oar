import { db, settings } from '@/db';
import { eq } from 'drizzle-orm';
import type { StructuredSettings } from '@/db/schema';
import { DueSoonSettingDropdown } from './DueSoonSettingDropdown';

interface SettingsSectionProps {
  section: StructuredSettings['categories'][number]['sections'][number];
}

export async function SettingsSection({ section }: SettingsSectionProps) {
  const sectionSettings = await db
    .select()
    .from(settings)
    .where(eq(settings.sectionId, section.id));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{section.name}</h3>
        {section.description && (
          <p className="text-sm text-muted-foreground">{section.description}</p>
        )}
      </div>
      {sectionSettings.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Settings coming soon
        </p>
      ) : (
        <div className="space-y-4">
          {sectionSettings.map((setting) => {
            if (setting.key === 'dueSoonRange') {
              return (
                <div key={setting.key} className="space-y-2">
                  <label className="text-sm font-medium">Due soon means</label>
                  <DueSoonSettingDropdown currentValue={setting.value} />
                  <p className="text-xs text-muted-foreground">
                    Configure the time range for the &quot;Due Soon&quot; view
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

