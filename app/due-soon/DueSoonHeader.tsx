import { TagFilter } from '@/components/features/bills';
import { getTags } from '@/actions/tags';
import { SettingsService } from '@/lib/services/SettingsService';
import { RANGE_LABELS } from '@/lib/constants';

export async function DueSoonHeader() {
  const [tags, dueSoonRange] = await Promise.all([
    getTags(),
    SettingsService.getDueSoonRange(),
  ]);

  const rangeLabel = RANGE_LABELS[String(dueSoonRange)] || 'In next 7 days';

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Due Soon</h1>
        <p className="text-sm text-muted-foreground">
          {rangeLabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <TagFilter tags={tags} />
      </div>
    </div>
  );
}

