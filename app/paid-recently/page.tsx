import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaidRecentlyList } from '@/components/features/payments';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { getCategoriesGrouped, getDefaultCategoryId } from '@/actions/categories';
import { getRecentPayments, getPaymentsByDate } from '@/actions/transactions';
import { getCurrencySymbol } from '@/lib/money';
import { searchParamsCache } from '@/lib/search-params';
import { getPaymentDatesForMonth } from '@/actions/calendar';

export const dynamic = 'force-dynamic';

interface PaidRecentlyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaidRecentlyPage({
  searchParams,
}: PaidRecentlyPageProps) {
  const { date, tag } = await searchParamsCache.parse(searchParams);

  const [settings, paidRecentlyRange, tags, categoriesGrouped, defaultCategoryId] = await Promise.all([
    SettingsService.getAll(),
    SettingsService.getPaidRecentlyRange(),
    getTags(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);
  const currencySymbol = getCurrencySymbol(settings.currency, settings.locale);

  // Use server actions to get timezone-aware payment data
  const paymentsResult = date
    ? await getPaymentsByDate({ date, tag: tag ?? undefined })
    : await getRecentPayments({ days: paidRecentlyRange, tag: tag ?? undefined });

  const payments = paymentsResult.success ? paymentsResult.data ?? [] : [];

  return (
    <AppShellClient>
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
        <MainContent
          header={
            <PageHeader
              currencySymbol={currencySymbol}
              availableTags={tags}
              categoriesGrouped={categoriesGrouped}
              defaultCategoryId={defaultCategoryId}
            />
          }
        >
          <PaidRecentlyList
            payments={payments}
            currency={settings.currency}
            locale={settings.locale}
          />
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}

