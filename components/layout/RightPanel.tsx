import { getBillWithTags } from '@/actions/bills';
import { CalendarPanel } from './CalendarPanel';
import { BillDetailPanel } from '@/components/features/bills/BillDetailPanel';

interface RightPanelProps {
  selectedBillId: string | null;
  currency: string;
  locale: string;
}

/**
 * Conditional right panel that shows either:
 * - Bill detail view when a bill is selected
 * - Calendar view when no bill is selected
 */
export async function RightPanel({ selectedBillId, currency, locale }: RightPanelProps) {
  if (!selectedBillId) {
    return <CalendarPanel />;
  }

  const bill = await getBillWithTags(selectedBillId);

  if (!bill) {
    // Bill not found or archived - fallback to calendar
    return <CalendarPanel />;
  }

  return <BillDetailPanel bill={bill} currency={currency} locale={locale} />;
}

