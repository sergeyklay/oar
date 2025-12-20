import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { BillList } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { searchParamsCache } from '@/lib/search-params';
import { DueSoonHeader } from './DueSoonHeader';

export const dynamic = 'force-dynamic';

interface DueSoonPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DueSoonPage({
  searchParams,
}: DueSoonPageProps) {
  const { tag, selectedBill } = await searchParamsCache.parse(searchParams);

  const [settings, dueSoonRange] = await Promise.all([
    SettingsService.getAll(),
    SettingsService.getDueSoonRange(),
  ]);

  return (
    <AppShell
      rightPanel={
        <RightPanel
          selectedBillId={selectedBill ?? null}
          currency={settings.currency}
          locale={settings.locale}
          weekStart={settings.weekStart}
        />
      }
    >
      <MainContent header={<DueSoonHeader dueSoonRange={dueSoonRange} />}>
        <BillList
          dateRange={dueSoonRange}
          tag={tag ?? undefined}
          selectedBillId={selectedBill}
        />
      </MainContent>
    </AppShell>
  );
}

