import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { ForecastHeader } from '@/components/features/forecast/ForecastHeader';
import { ForecastContent } from '@/components/features/forecast/ForecastContent';
import { ForecastSkeleton } from '@/components/features/forecast/ForecastSkeleton';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { forecastSearchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface ForecastPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ForecastPage({
  searchParams,
}: ForecastPageProps) {
  const { month, tag } = await forecastSearchParamsCache.parse(searchParams);

  const [settings, tags] = await Promise.all([
    SettingsService.getAll(),
    getTags(),
  ]);

  return (
    <AppShellClient>
      <AppShell rightPanel={null}>
        <MainContent header={<ForecastHeader tags={tags} />}>
          <Suspense fallback={<ForecastSkeleton />}>
            <ForecastContent
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

