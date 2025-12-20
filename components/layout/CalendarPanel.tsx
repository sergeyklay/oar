import { CalendarWidget } from '@/components/features/calendar';
import type { WeekStartDay } from '@/lib/services/SettingsService';

interface CalendarPanelProps {
  weekStartsOn?: WeekStartDay;
}

export function CalendarPanel({ weekStartsOn = 0 }: CalendarPanelProps) {
  return (
    <aside className="calendar-panel bg-card p-4">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Calendar
      </h2>
      <div className="flex justify-center">
        <CalendarWidget weekStartsOn={weekStartsOn} />
      </div>
    </aside>
  );
}
