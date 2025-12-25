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
  /** Include archived bills when fetching bill details */
  includeArchived?: boolean;
  /** Disable date filter feedback in calendar */
  disableDateFilter?: boolean;
}

/**
 * Conditional right panel that shows either:
 * - Bill detail view when a bill is selected
 * - Calendar view when no bill is selected
 *
 * Server Component: calls BillService directly for read-only data.
 */
export async function RightPanel({ selectedBillId, currency, locale, weekStart, includeArchived = false, disableDateFilter = false }: RightPanelProps) {
  if (!selectedBillId) {
    return <CalendarPanel weekStartsOn={weekStart} disableDateFilter={disableDateFilter} />;
  }

  const [bill, availableTags, categoriesGrouped, defaultCategoryId] = await Promise.all([
    BillService.getWithTags(selectedBillId, includeArchived),
    getTags(),
    getCategoriesGrouped(),
    getDefaultCategoryId(),
  ]);

  if (!bill) {
    return <CalendarPanel weekStartsOn={weekStart} disableDateFilter={disableDateFilter} />;
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

