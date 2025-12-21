import { BillService } from '@/lib/services/BillService';
import { CalendarPanel } from './CalendarPanel';
import { BillDetailPanel } from '@/components/features/bills/BillDetailPanel';
import { getTags } from '@/actions/tags';
import { getCategoriesGrouped, getDefaultCategoryId } from '@/actions/categories';
import type { WeekStartDay } from '@/lib/services/SettingsService';

interface RightPanelProps {
  selectedBillId: string | null;
  currency: string;
  locale: string;
  weekStart: WeekStartDay;
}

/**
 * Conditional right panel that shows either:
 * - Bill detail view when a bill is selected
 * - Calendar view when no bill is selected
 *
 * Server Component: calls BillService directly for read-only data.
 */
export async function RightPanel({ selectedBillId, currency, locale, weekStart }: RightPanelProps) {
  if (!selectedBillId) {
    return <CalendarPanel weekStartsOn={weekStart} />;
  }

  const [bill, availableTags, categoriesGrouped, defaultCategoryId] = await Promise.all([
    BillService.getWithTags(selectedBillId),
    getTags(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);

  if (!bill) {
    return <CalendarPanel weekStartsOn={weekStart} />;
  }

  return (
    <BillDetailPanel
      bill={bill}
      currency={currency}
      locale={locale}
      availableTags={availableTags}
      categoriesGrouped={categoriesGrouped}
      defaultCategoryId={defaultCategoryId ?? undefined}
    />
  );
}

