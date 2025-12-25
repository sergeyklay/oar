import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { BillList } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { searchParamsCache } from '@/lib/search-params';
import { ArchiveHeader } from './ArchiveHeader';

export const dynamic = 'force-dynamic';

interface ArchivePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ArchivePage({
  searchParams,
}: ArchivePageProps) {
  const { tag, selectedBill } = await searchParamsCache.parse(searchParams);

  const settings = await SettingsService.getAll();

  return (
    <AppShell
      rightPanel={
        <RightPanel
          selectedBillId={selectedBill ?? null}
          currency={settings.currency}
          locale={settings.locale}
          weekStart={settings.weekStart}
          includeArchived={true}
          disableDateFilter={true}
        />
      }
    >
      <MainContent header={<ArchiveHeader />}>
        <BillList
          includeArchived={true}
          isArchived={true}
          tag={tag ?? undefined}
          selectedBillId={selectedBill}
        />
      </MainContent>
    </AppShell>
  );
}

