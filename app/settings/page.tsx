import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { SettingsService } from '@/lib/services/SettingsService';
import { SettingsHeader } from '@/components/features/settings/SettingsHeader';
import { SettingsCategoryList } from '@/components/features/settings/SettingsCategoryList';

export default async function SettingsPage() {
  await SettingsService.initializeDefaults();

  let structure;
  try {
    structure = await SettingsService.getStructure();
  } catch (error) {
    console.error('Failed to load settings:', error);
    return (
      <AppShell>
        <MainContent header={<SettingsHeader />}>
          <div className="p-6">
            <p className="text-destructive">
              Failed to load settings structure
            </p>
          </div>
        </MainContent>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MainContent header={<SettingsHeader />}>
        <SettingsCategoryList structure={structure} />
      </MainContent>
    </AppShell>
  );
}

