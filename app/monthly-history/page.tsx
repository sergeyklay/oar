import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { MonthlyHistoryHeader } from '@/components/features/history/MonthlyHistoryHeader';
import { MonthlyHistoryContent } from '@/components/features/history/MonthlyHistoryContent';
import { MonthlyHistorySkeleton } from '@/components/features/history/MonthlyHistorySkeleton';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { historySearchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface MonthlyHistoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonthlyHistoryPage({
  searchParams,
}: MonthlyHistoryPageProps) {
  const { month, tag } = await historySearchParamsCache.parse(searchParams);

  const [settings, tags] = await Promise.all([
    SettingsService.getAll(),
    getTags(),
  ]);

  return (
    <AppShellClient>
      <AppShell rightPanel={null}>
        <MainContent header={<MonthlyHistoryHeader tags={tags} />}>
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

