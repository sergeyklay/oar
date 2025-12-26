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

export const dynamic = 'force-dynamic';

interface DueSoonPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DueSoonPage({
  searchParams,
}: DueSoonPageProps) {
  const { tag, selectedBill, date } = await searchParamsCache.parse(searchParams);

  const [settings, dueSoonRange, tags, categoriesGrouped, defaultCategoryId] = await Promise.all([
    SettingsService.getAll(),
    SettingsService.getDueSoonRange(),
    getTags(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);
  const currencySymbol = getCurrencySymbol(settings.currency, settings.locale);

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
            dateRange={dueSoonRange}
            date={date ?? undefined}
            tag={tag ?? undefined}
            selectedBillId={selectedBill}
          />
        </MainContent>
      </AppShell>
    </AppShellClient>
  );
}

