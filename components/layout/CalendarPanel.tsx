import { CalendarWidget } from '@/components/features/calendar';
import type { WeekStartDay } from '@/lib/services/SettingsService';

interface CalendarPanelProps {
  weekStartsOn?: WeekStartDay;
}

export function CalendarPanel({ weekStartsOn = 0 }: CalendarPanelProps) {
  return (
    <aside className="calendar-panel bg-card px-4 pt-4">
      <CalendarWidget weekStartsOn={weekStartsOn} />
    </aside>
  );
}
