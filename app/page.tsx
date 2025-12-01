import { AppShell } from '@/components/layout/AppShell';
import { MainContent } from '@/components/layout/MainContent';

function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          December 2025 • 12 bills due
        </p>
      </div>
      <div className="flex gap-2">
        {/* Filter controls will go here */}
      </div>
    </div>
  );
}

// Deterministic mock data for testing scroll behavior
const mockBills = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Bill ${i + 1}`,
  amount: ((i * 1234 + 5678) % 50000) + 1000, // cents (deterministic)
  dueDate: new Date(2025, 11, (i % 28) + 1),
}));

function BillListPlaceholder() {

  return (
    <table className="bill-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Amount</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        {mockBills.map((bill) => (
          <tr key={bill.id}>
            <td className="font-medium">{bill.name}</td>
            <td className="font-mono">
              ${(bill.amount / 100).toFixed(2)}
            </td>
            <td className="text-muted-foreground">
              {bill.dueDate.toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <MainContent header={<DashboardHeader />}>
        <BillListPlaceholder />
      </MainContent>
    </AppShell>
  );
}
