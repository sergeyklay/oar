import { getBills } from '@/actions/bills';
import { formatMoney } from '@/lib/money';
import { SettingsService } from '@/lib/services/SettingsService';
import { BillStatusBadge } from './BillStatusBadge';

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
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <tr key={bill.id}>
            <td className="font-medium">{bill.title}</td>
            <td className="font-mono">
              {formatMoney(bill.amount, settings.currency, settings.locale)}
            </td>
            <td className="text-muted-foreground">
              {bill.dueDate.toLocaleDateString(settings.locale)}
            </td>
            <td className="capitalize text-muted-foreground">
              {bill.frequency}
            </td>
            <td>
              <BillStatusBadge status={bill.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
