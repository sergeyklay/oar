import { CalendarWidget } from '@/components/features/calendar';
import type { WeekStartDay } from '@/lib/services/SettingsService';

interface CalendarPanelProps {
  weekStartsOn?: WeekStartDay;
  /** Disable date filter feedback (hide "Showing bills for..." message) */
  disableDateFilter?: boolean;
}

export function CalendarPanel({ weekStartsOn = 0, disableDateFilter = false }: CalendarPanelProps) {
  return (
    <aside className="calendar-panel bg-card px-4 pt-4">
      <CalendarWidget weekStartsOn={weekStartsOn} disableDateFilter={disableDateFilter} />
    </aside>
  );
}
