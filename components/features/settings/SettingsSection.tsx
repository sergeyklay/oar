import { db, settings } from '@/db';
import { eq } from 'drizzle-orm';
import type { StructuredSettings } from '@/db/schema';
import { RangeSettingDropdown } from './RangeSettingDropdown';
import { ViewOptionsForm } from './ViewOptionsForm';
import { updateDueSoonRange, updatePaidRecentlyRange } from '@/actions/settings';
import { FUTURE_RANGE_LABELS, PAST_RANGE_LABELS } from '@/lib/constants';
import { SettingsService } from '@/lib/services/SettingsService';

interface SettingsSectionProps {
  section: StructuredSettings['categories'][number]['sections'][number];
}

export async function SettingsSection({ section }: SettingsSectionProps) {
  const sectionSettings = await db
    .select()
    .from(settings)
    .where(eq(settings.sectionId, section.id));

  if (section.slug === 'view-options') {
    const userSettings = await SettingsService.getAll();
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{section.name}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
        <ViewOptionsForm
          initialCurrency={userSettings.currency}
          initialLocale={userSettings.locale}
          initialWeekStart={userSettings.weekStart}
        />
      </div>
    );
  }

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
                  <RangeSettingDropdown
                    currentValue={setting.value}
                    labels={FUTURE_RANGE_LABELS}
                    onUpdate={updateDueSoonRange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Configure the time range for the &quot;Due Soon&quot; view
                  </p>
                </div>
              );
            }
            if (setting.key === 'paidRecentlyRange') {
              return (
                <div key={setting.key} className="space-y-2">
                  <label className="text-sm font-medium">Paid recently means</label>
                  <RangeSettingDropdown
                    currentValue={setting.value}
                    labels={PAST_RANGE_LABELS}
                    onUpdate={updatePaidRecentlyRange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Configure the time range for the &quot;Paid Recently&quot; view
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
