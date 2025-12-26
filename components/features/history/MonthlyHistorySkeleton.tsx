import { Skeleton } from '@/components/ui/skeleton';

/**
 * MonthlyHistorySkeleton
 *
 * Loading skeleton for monthly history view while data is being fetched.
 * Matches the layout structure of MonthlyHistoryContent.
 */
export function MonthlyHistorySkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-[200px] bg-card border border-border">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-border">
        <div className="overflow-y-auto">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <div className="bg-card border-l border-border overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-24" />
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

