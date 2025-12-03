import { getBills } from '@/actions/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { BillRow } from './BillRow';

export async function BillList() {
  const [bills, settings] = await Promise.all([
    getBills(),
    SettingsService.getAll(),
  ]);

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">No bills yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Click &quot;Add Bill&quot; to create your first bill.
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
          />
        ))}
      </tbody>
    </table>
  );
}
