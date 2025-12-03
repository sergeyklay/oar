import { CalendarWidget } from '@/components/features/calendar';

export function CalendarPanel() {
  return (
    <aside className="calendar-panel bg-card p-4">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Calendar
      </h2>
      <CalendarWidget />
    </aside>
  );
}
