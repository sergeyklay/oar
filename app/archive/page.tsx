import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { BillList } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { searchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface ArchivePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ArchivePage({
  searchParams,
}: ArchivePageProps) {
  const { tag, selectedBill } = await searchParamsCache.parse(searchParams);

  const [settings, tags] = await Promise.all([
    SettingsService.getAll(),
    getTags(),
  ]);

  return (
    <AppShellClient>
      <AppShell
        rightPanel={
          <RightPanel
            selectedBillId={selectedBill ?? null}
            currency={settings.currency}
            locale={settings.locale}
            weekStart={settings.weekStart}
            includeArchived={true}
            disableDateFilter={true}
            dotMode="none"
          />
        }
      >
        <MainContent
          header={
            <PageHeader showCreateBill={false} showTagFilter={true} tagFilterTags={tags} />
          }
        >
          <BillList
            includeArchived={true}
            isArchived={true}
            tag={tag ?? undefined}
            selectedBillId={selectedBill}
          />
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}

