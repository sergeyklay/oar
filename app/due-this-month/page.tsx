import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { BillList } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { searchParamsCache } from '@/lib/search-params';
import { format } from 'date-fns';
import { DueThisMonthHeader } from './DueThisMonthHeader';

export const dynamic = 'force-dynamic';

interface DueThisMonthPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DueThisMonthPage({
  searchParams,
}: DueThisMonthPageProps) {
  const { tag, selectedBill } = await searchParamsCache.parse(searchParams);

  const settings = await SettingsService.getAll();
  const currentMonth = format(new Date(), 'yyyy-MM');

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
      <MainContent header={<DueThisMonthHeader />}>
        <BillList
          month={currentMonth}
          tag={tag ?? undefined}
          selectedBillId={selectedBill}
        />
      </MainContent>
    </AppShell>
  );
}

