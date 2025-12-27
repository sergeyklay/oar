import { Skeleton } from '@/components/ui/skeleton';
import { ScrollableContainer } from '@/components/common/ScrollableContainer';
import { ReportSidebar } from '@/components/layout/ReportSidebar';

/**
 * AnnualSpendingSkeleton
 *
 * Loading skeleton for annual spending view while data is being fetched.
 * Matches the layout structure of AnnualSpendingContent.
 */
export function AnnualSpendingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-[400px] bg-card border border-border">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-border flex-1 min-h-0">
        <ScrollableContainer>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </ScrollableContainer>
        <ReportSidebar>
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
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </ReportSidebar>
      </div>
    </div>
  );
}

