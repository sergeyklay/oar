import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsService } from '@/lib/services/SettingsService';
import { getCategoriesGrouped, getDefaultCategoryId } from '@/actions/categories';
import { getCurrencySymbol } from '@/lib/money';
import { getLogger } from '@/lib/logger';

const logger = getLogger('SettingsPage');
import { SettingsLayout } from '@/components/features/settings/SettingsLayout';
import { SettingsNavigation } from '@/components/features/settings/SettingsNavigation';
import { SettingsCategoryPanel } from '@/components/features/settings/SettingsCategoryPanel';
import { settingsSearchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await SettingsService.initializeDefaults();

  const { category: categorySlug } = await settingsSearchParamsCache.parse(searchParams);

  const [settings, categoriesGrouped, defaultCategoryId] = await Promise.all([
    SettingsService.getAll(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);
  const currencySymbol = getCurrencySymbol(settings.currency, settings.locale);

  let structure;
  try {
    structure = await SettingsService.getStructure();
  } catch (error) {
    logger.error(error, 'Failed to load settings');
    return (
      <AppShellClient>
        <AppShell rightPanel={null}>
          <MainContent
            header={
              <PageHeader
                currencySymbol={currencySymbol}
                availableTags={[]}
                categoriesGrouped={categoriesGrouped}
                defaultCategoryId={defaultCategoryId}
              />
            }
          >
            <div className="p-6">
              <p className="text-destructive">
                Failed to load settings structure
              </p>
            </div>
          </MainContent>
        </AppShell>
      </AppShellClient>
    );
  }

  const selectedCategory =
    structure.categories.find((c) => c.slug === categorySlug) ??
    structure.categories.find((c) => c.slug === 'general') ??
    structure.categories[0];

  if (!selectedCategory) {
    return (
      <AppShellClient>
        <AppShell rightPanel={null}>
          <MainContent
            header={
              <PageHeader
                currencySymbol={currencySymbol}
                availableTags={[]}
                categoriesGrouped={categoriesGrouped}
                defaultCategoryId={defaultCategoryId}
              />
            }
          >
            <div className="p-6">
              <p className="text-muted-foreground">
                No settings categories available
              </p>
            </div>
          </MainContent>
        </AppShell>
      </AppShellClient>
    );
  }

  return (
    <AppShellClient>
      <AppShell rightPanel={null}>
        <MainContent
          header={
            <PageHeader
              currencySymbol={currencySymbol}
              availableTags={[]}
              categoriesGrouped={categoriesGrouped}
              defaultCategoryId={defaultCategoryId}
            />
          }
        >
          <SettingsLayout
            navigation={
              <SettingsNavigation categories={structure.categories} />
            }
          >
            <SettingsCategoryPanel category={selectedCategory} />
          </SettingsLayout>
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}
