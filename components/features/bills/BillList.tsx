import { getBillsFiltered } from '@/actions/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { BillRow } from './BillRow';
import { BillRowClickable } from './BillRowClickable';

interface BillListProps {
  /** Filter by specific date (YYYY-MM-DD) */
  date?: string;
  /** Filter by month (YYYY-MM) */
  month?: string;
  /** Filter by date range - number of days from today */
  dateRange?: number;
  /** Filter by tag slug */
  tag?: string;
  /** Currently selected bill ID */
  selectedBillId?: string | null;
  /** Include archived bills in query */
  includeArchived?: boolean;
  /** Archive mode - indicates bills should be displayed with archive formatting */
  isArchived?: boolean;
}

/**
 * Determines the empty state primary message based on filter options.
 */
function getEmptyStateMessage(props: {
  isArchived?: boolean;
  tag?: string;
  date?: string;
  month?: string;
  dateRange?: number;
}): string {
  const { isArchived, tag, date, month, dateRange } = props;

  if (isArchived) {
    return 'No archived bills.';
  }

  if (tag) {
    return 'No bills with this tag.';
  }

  if (date) {
    return 'No bills due on this date.';
  }

  if (month) {
    return 'No bills due this month.';
  }

  if (dateRange !== undefined) {
    return 'No bills due soon.';
  }

  return 'No bills yet.';
}

/**
 * Determines the empty state subtitle message based on filter options.
 */
function getEmptyStateSubtitle(props: {
  isArchived?: boolean;
  tag?: string;
  date?: string;
  month?: string;
  dateRange?: number;
}): string {
  const { isArchived, tag, date, month, dateRange } = props;

  if (isArchived) {
    return 'Archived bills will appear here.';
  }

  if (tag || date || month || dateRange !== undefined) {
    return 'Try selecting a different filter or clearing the filter.';
  }

  return 'Click "Add Bill" to create your first bill.';
}

export async function BillList({ date, month, dateRange, tag, selectedBillId, includeArchived, isArchived }: BillListProps) {
  const filterOptions = isArchived
    ? { archivedOnly: true, tag }
    : includeArchived
      ? { includeArchived: true, tag }
      : { date, month, dateRange, tag };

  const [bills, settings] = await Promise.all([
    getBillsFiltered(filterOptions),
    SettingsService.getAll(),
  ]);

  if (bills.length === 0) {
    const emptyMessage = getEmptyStateMessage({ isArchived, tag, date, month, dateRange });
    const emptySubtitle = getEmptyStateSubtitle({ isArchived, tag, date, month, dateRange });

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {emptyMessage}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptySubtitle}
        </p>
      </div>
    );
  }

  return (
    <table className="bill-table">
      <thead>
        <tr>
          <th className="w-10" aria-hidden="true" />
          <th>Name</th>
          <th>Amount</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <BillRowClickable
            key={bill.id}
            billId={bill.id}
            isSelected={bill.id === selectedBillId}
          >
            <BillRow
              bill={bill}
              currency={settings.currency}
              locale={settings.locale}
              isArchived={isArchived}
            />
          </BillRowClickable>
        ))}
      </tbody>
    </table>
  );
}
