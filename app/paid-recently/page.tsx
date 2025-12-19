import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';
import { PaidRecentlyList } from '@/components/features/payments';
import { SettingsService } from '@/lib/services/SettingsService';
import { TransactionService } from '@/lib/services/TransactionService';
import { PaidRecentlyHeader } from './PaidRecentlyHeader';

export const dynamic = 'force-dynamic';

export default async function PaidRecentlyPage() {
  const [settings, paidRecentlyRange] = await Promise.all([
    SettingsService.getAll(),
    SettingsService.getPaidRecentlyRange(),
  ]);

  const payments = await TransactionService.getRecentPayments(paidRecentlyRange);

  return (
    <AppShell>
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

