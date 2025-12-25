import { TagFilter } from '@/components/features/bills';
import { getTags } from '@/actions/tags';

export async function ArchiveHeader() {
  const tags = await getTags();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Archived bills
        </p>
      </div>
      <div className="flex items-center gap-2">
        <TagFilter tags={tags} />
      </div>
    </div>
  );
}

