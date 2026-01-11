import { db, settings } from '@/db';
import { eq } from 'drizzle-orm';
import type { StructuredSettings } from '@/db/schema';
import { RangeSettingDropdown } from './RangeSettingDropdown';
import { ViewOptionsForm } from './ViewOptionsForm';
import { BillEndActionDropdown } from './BillEndActionDropdown';
import { WeekendAdjustmentDropdown } from './WeekendAdjustmentDropdown';
import {
  updateDueSoonRange,
  updatePaidRecentlyRange,
  updateBillEndAction,
  updateWeekendAdjustment,
} from '@/actions/settings';
import { AutoLogAutoPayCheckbox } from './AutoLogAutoPayCheckbox';
import { FUTURE_RANGE_LABELS, PAST_RANGE_LABELS } from '@/lib/constants';
import { SettingsService } from '@/lib/services/SettingsService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';

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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{section.name}</CardTitle>
          {section.description && <CardDescription>{section.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ViewOptionsForm
            initialCurrency={userSettings.currency}
            initialLocale={userSettings.locale}
            initialWeekStart={userSettings.weekStart}
            initialIncludeAutoPayInDueSoon={userSettings.includeAutoPayInDueSoon}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{section.name}</CardTitle>
        {section.description && <CardDescription>{section.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {sectionSettings.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Settings coming soon</p>
        ) : (
          <div className="space-y-6">
            {sectionSettings.map((setting) => {
              if (setting.key === 'dueSoonRange') {
                return (
                  <FormItem key={setting.key}>
                    <Label>Due soon means</Label>
                    <RangeSettingDropdown
                      currentValue={setting.value}
                      labels={FUTURE_RANGE_LABELS}
                      onUpdate={updateDueSoonRange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Configure the time range for the &quot;Due Soon&quot; view
                    </p>
                  </FormItem>
                );
              }
              if (setting.key === 'paidRecentlyRange') {
                return (
                  <FormItem key={setting.key}>
                    <Label>Paid recently means</Label>
                    <RangeSettingDropdown
                      currentValue={setting.value}
                      labels={PAST_RANGE_LABELS}
                      onUpdate={updatePaidRecentlyRange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Configure the time range for the &quot;Paid Recently&quot; view
                    </p>
                  </FormItem>
                );
              }
              if (setting.key === 'billEndAction') {
                return (
                  <FormItem key={setting.key}>
                    <Label>After a Bill Ends</Label>
                    <BillEndActionDropdown
                      currentValue={setting.value as 'mark_as_paid' | 'archive'}
                      onUpdate={updateBillEndAction}
                    />
                    <p className="text-xs text-muted-foreground">
                      A bill ends when you change its repeat interval to &quot;Never&quot; and then
                      log a payment that fully pays it, or when the next due date would exceed the
                      End Date set in the bill.
                    </p>
                  </FormItem>
                );
              }
              if (setting.key === 'weekendAdjustment') {
                return (
                  <FormItem key={setting.key}>
                    <Label>If a bill is due on the weekend</Label>
                    <WeekendAdjustmentDropdown
                      currentValue={
                        setting.value as 'unchanged' | 'next_business_day' | 'previous_business_day'
                      }
                      onUpdate={updateWeekendAdjustment}
                    />
                  </FormItem>
                );
              }
              if (setting.key === 'autoLogAutoPay') {
                return (
                  <FormItem key={setting.key}>
                    <AutoLogAutoPayCheckbox checked={setting.value === 'true'} />
                  </FormItem>
                );
              }
              return null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
