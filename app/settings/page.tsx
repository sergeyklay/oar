import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { SettingsService } from '@/lib/services/SettingsService';
import { getSettingsStructure } from '@/actions/settings';
import { SettingsHeader } from '@/components/features/settings/SettingsHeader';
import { SettingsCategoryList } from '@/components/features/settings/SettingsCategoryList';

export default async function SettingsPage() {
  await SettingsService.initializeDefaults();

  const result = await getSettingsStructure();

  if (!result.success || !result.data) {
    return (
      <AppShell>
        <MainContent header={<SettingsHeader />}>
          <div className="p-6">
            <p className="text-destructive">
              {result.error ?? 'Failed to load settings structure'}
            </p>
          </div>
        </MainContent>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MainContent header={<SettingsHeader />}>
        <SettingsCategoryList structure={result.data} />
      </MainContent>
    </AppShell>
  );
}

