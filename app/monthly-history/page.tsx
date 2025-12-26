import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { PageHeader } from '@/components/layout/PageHeader';
import { MonthlyHistoryContent } from '@/components/features/history/MonthlyHistoryContent';
import { MonthlyHistorySkeleton } from '@/components/features/history/MonthlyHistorySkeleton';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { getCategoriesGrouped, getDefaultCategoryId } from '@/actions/categories';
import { getCurrencySymbol } from '@/lib/money';
import { historySearchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface MonthlyHistoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonthlyHistoryPage({
  searchParams,
}: MonthlyHistoryPageProps) {
  const { month, tag } = await historySearchParamsCache.parse(searchParams);

  const [settings, tags, categoriesGrouped, defaultCategoryId] = await Promise.all([
    SettingsService.getAll(),
    getTags(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);
  const currencySymbol = getCurrencySymbol(settings.currency, settings.locale);

  return (
    <AppShellClient>
      <AppShell rightPanel={null}>
        <MainContent
          header={
            <PageHeader
              currencySymbol={currencySymbol}
              availableTags={tags}
              categoriesGrouped={categoriesGrouped}
              defaultCategoryId={defaultCategoryId}
            />
          }
        >
          <Suspense fallback={<MonthlyHistorySkeleton />}>
            <MonthlyHistoryContent
              month={month}
              tag={tag}
              currency={settings.currency}
              locale={settings.locale}
            />
          </Suspense>
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}

