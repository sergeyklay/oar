import { AppShell } from '@/components/layout/AppShell';
import { AppShellClient } from '@/components/layout/AppShellClient';
import { MainContent } from '@/components/layout/MainContent';
import { RightPanel } from '@/components/layout/RightPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { BillList } from '@/components/features/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { getTags } from '@/actions/tags';
import { getCategoriesGrouped, getDefaultCategoryId } from '@/actions/categories';
import { getCurrencySymbol } from '@/lib/money';
import { searchParamsCache } from '@/lib/search-params';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface DueThisMonthPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DueThisMonthPage({
  searchParams,
}: DueThisMonthPageProps) {
  const { tag, selectedBill, date } = await searchParamsCache.parse(searchParams);

  const [settings, tags, categoriesGrouped, defaultCategoryId] = await Promise.all([
    SettingsService.getAll(),
    getTags(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);
  const currencySymbol = getCurrencySymbol(settings.currency, settings.locale);
  const currentMonth = format(new Date(), 'yyyy-MM');

  return (
    <AppShellClient>
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
          <BillList
            month={currentMonth}
            date={date ?? undefined}
            tag={tag ?? undefined}
            selectedBillId={selectedBill}
          />
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}

