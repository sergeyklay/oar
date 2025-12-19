import { SettingsService } from '@/lib/services/SettingsService';
import { PAST_RANGE_LABELS } from '@/lib/constants';

export async function PaidRecentlyHeader() {
  const paidRecentlyRange = await SettingsService.getPaidRecentlyRange();
  const rangeLabel = PAST_RANGE_LABELS[String(paidRecentlyRange)] || 'Last 7 days';

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Paid Recently</h1>
        <p className="text-sm text-muted-foreground">
          {rangeLabel}
        </p>
      </div>
    </div>
  );
}

