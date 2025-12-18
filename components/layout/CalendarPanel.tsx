import { Suspense } from 'react';
import { CalendarWidget } from '@/components/features/calendar';
import { Skeleton } from '@/components/ui/skeleton';

function CalendarSkeleton() {
  return (
    <div className="w-full max-w-[340px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>
    </div>
  );
}

export function CalendarPanel() {
  return (
    <aside className="calendar-panel bg-card p-4">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Calendar
      </h2>
      <div className="flex justify-center">
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarWidget />
        </Suspense>
      </div>
    </aside>
  );
}
