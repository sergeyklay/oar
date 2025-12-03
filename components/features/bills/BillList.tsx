import { getBillsFiltered } from '@/actions/bills';
import { getTags } from '@/actions/tags';
import { SettingsService } from '@/lib/services/SettingsService';
import { BillRow } from './BillRow';

interface BillListProps {
  /** Filter by specific date (YYYY-MM-DD) */
  date?: string;
  /** Filter by month (YYYY-MM) */
  month?: string;
  /** Filter by tag slug */
  tag?: string;
}

export async function BillList({ date, month, tag }: BillListProps) {
  const [bills, settings, availableTags] = await Promise.all([
    getBillsFiltered({ date, month, tag }),
    SettingsService.getAll(),
    getTags(),
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
                : 'No bills yet.'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {tag || date || month
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
          <th>Name</th>
          <th>Amount</th>
          <th>Due Date</th>
          <th>Frequency</th>
          <th>Status</th>
          <th className="w-[100px]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            currency={settings.currency}
            locale={settings.locale}
            availableTags={availableTags}
          />
        ))}
      </tbody>
    </table>
  );
}
