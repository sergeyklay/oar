import { Skeleton } from '@/components/ui/skeleton';

/**
 * Renders a loading skeleton placeholder for the calendar UI.
 *
 * Displays animated skeleton elements mimicking the calendar's navigation
 * controls and day grid while events or data are being fetched.
 *
 * @example
 * ```tsx
 * // Use as a fallback while calendar data is loading
 * <Suspense fallback={<CalendarSkeleton />}>
 *   <Calendar events={events} />
 * </Suspense>
 * ```
 */
export function CalendarSkeleton() {
  return (
    <div
      className="w-full max-w-[340px] mx-auto space-y-4"
      role="status"
      aria-label="Loading calendar"
      aria-busy="true"
    >
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

