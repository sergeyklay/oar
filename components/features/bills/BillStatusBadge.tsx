import { cn } from '@/lib/utils';
import type { BillStatus } from '@/lib/types';

interface BillStatusBadgeProps {
  status: BillStatus;
}

const statusStyles: Record<BillStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<BillStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
};

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
