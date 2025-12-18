import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { BillList } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { searchParamsCache } from '@/lib/search-params';
import { DueSoonHeader } from './DueSoonHeader';

interface DueSoonPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DueSoonPage({
  searchParams,
}: DueSoonPageProps) {
  const { tag, selectedBill } = await searchParamsCache.parse(searchParams);

  const settings = await SettingsService.getAll();
  const dueSoonRange = await SettingsService.getDueSoonRange();

  return (
    <AppShell
      rightPanel={
        <RightPanel
          selectedBillId={selectedBill ?? null}
          currency={settings.currency}
          locale={settings.locale}
        />
      }
    >
      <MainContent header={<DueSoonHeader />}>
        <BillList
          dateRange={dueSoonRange}
          tag={tag ?? undefined}
          selectedBillId={selectedBill}
        />
      </MainContent>
    </AppShell>
  );
}

