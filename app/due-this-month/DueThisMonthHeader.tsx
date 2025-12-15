import { TagFilter } from '@/components/features/bills';
import { getTags } from '@/actions/tags';

export async function DueThisMonthHeader() {
  const tags = await getTags();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Due This Month</h1>
        <p className="text-sm text-muted-foreground">
          All payments due this month
        </p>
      </div>
      <div className="flex items-center gap-2">
        <TagFilter tags={tags} />
      </div>
    </div>
  );
}

