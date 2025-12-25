import { Skeleton } from '@/components/ui/skeleton';

/**
 * ForecastSkeleton
 *
 * Loading skeleton for forecast view while data is being fetched.
 * Matches the layout structure of ForecastContent.
 */
export function ForecastSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 h-full">
      <div className="flex flex-col gap-6 overflow-y-auto">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-64 bg-card border border-border rounded-lg">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
      <aside className="bg-card border-l border-border overflow-y-auto p-6">
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
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

