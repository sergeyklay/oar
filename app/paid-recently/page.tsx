import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { PaidRecentlyList } from '@/components/features/payments';
import { SettingsService } from '@/lib/services/SettingsService';
import { TransactionService } from '@/lib/services/TransactionService';
import { searchParamsCache } from '@/lib/search-params';
import { getPaymentDatesForMonth } from '@/actions/calendar';
import { PaidRecentlyHeader } from './PaidRecentlyHeader';

export const dynamic = 'force-dynamic';

interface PaidRecentlyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaidRecentlyPage({
  searchParams,
}: PaidRecentlyPageProps) {
  const { date } = await searchParamsCache.parse(searchParams);

  const [settings, paidRecentlyRange] = await Promise.all([
    SettingsService.getAll(),
    SettingsService.getPaidRecentlyRange(),
  ]);

  const payments = date
    ? await TransactionService.getPaymentsByDate(date)
    : await TransactionService.getRecentPayments(paidRecentlyRange);

  return (
    <AppShell
      rightPanel={
        <RightPanel
          selectedBillId={null}
          currency={settings.currency}
          locale={settings.locale}
          weekStart={settings.weekStart}
          dotMode="payment"
          getDateData={getPaymentDatesForMonth}
        />
      }
    >
      <MainContent header={<PaidRecentlyHeader />}>
        <PaidRecentlyList
          payments={payments}
          currency={settings.currency}
          locale={settings.locale}
        />
      </MainContent>
    </AppShell>
  );
}

