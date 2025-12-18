import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { AddBillButton, BillList, TagFilter } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { getCurrencySymbol } from '@/lib/money';
import { searchParamsCache } from '@/lib/search-params';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function DashboardHeader() {
  const [settings, tags] = await Promise.all([
    SettingsService.getAll(),
    getTags(),
  ]);
  const currencySymbol = getCurrencySymbol(settings.currency);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Manage your bills and payments
        </p>
      </div>
      <div className="flex items-center gap-2">
        <TagFilter tags={tags} />
        <AddBillButton currencySymbol={currencySymbol} availableTags={tags} />
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  // In Next.js 15+, searchParams is a Promise that must be awaited
  // Note: month is parsed but not used for filtering (calendar navigation only)
  const { date, tag, selectedBill } = await searchParamsCache.parse(searchParams);

  // Fetch settings for right panel
  const settings = await SettingsService.getAll();

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
      <MainContent header={<DashboardHeader />}>
        <BillList
          date={date ?? undefined}
          tag={tag ?? undefined}
          selectedBillId={selectedBill}
        />
      </MainContent>
    </AppShell>
  );
}
