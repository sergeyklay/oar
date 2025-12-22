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
}

export async function BillList({ date, month, dateRange, tag, selectedBillId }: BillListProps) {
  const [bills, settings] = await Promise.all([
    getBillsFiltered({ date, month, dateRange, tag }),
    SettingsService.getAll(),
  ]);

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {tag
            ? 'No bills with this tag.'
            : date
              ? 'No bills due on this date.'
              : month
                ? 'No bills due this month.'
                : dateRange !== undefined
                  ? 'No bills due soon.'
                  : 'No bills yet.'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {tag || date || month || dateRange !== undefined
            ? 'Try selecting a different filter or clearing the filter.'
            : 'Click "Add Bill" to create your first bill.'}
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
            />
          </BillRowClickable>
        ))}
      </tbody>
    </table>
  );
}
