import { TagFilter } from '@/components/features/bills';
import { getTags } from '@/actions/tags';
import { RANGE_LABELS } from '@/lib/constants';

interface DueSoonHeaderProps {
  dueSoonRange: number;
}

export async function DueSoonHeader({ dueSoonRange }: DueSoonHeaderProps) {
  const tags = await getTags();

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

