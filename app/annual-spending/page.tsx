import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { PageHeader } from '@/components/layout/PageHeader';
import { AnnualSpendingContent } from '@/components/features/history/AnnualSpendingContent';
import { AnnualSpendingSkeleton } from '@/components/features/history/AnnualSpendingSkeleton';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { getCategoriesGrouped, getDefaultCategoryId } from '@/actions/categories';
import { getCurrencySymbol } from '@/lib/money';
import { annualSpendingSearchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface AnnualSpendingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnnualSpendingPage({
  searchParams,
}: AnnualSpendingPageProps) {
  const { year } = await annualSpendingSearchParamsCache.parse(searchParams);

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
          <Suspense fallback={<AnnualSpendingSkeleton />}>
            <AnnualSpendingContent
              year={year}
              currency={settings.currency}
              locale={settings.locale}
            />
          </Suspense>
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}

