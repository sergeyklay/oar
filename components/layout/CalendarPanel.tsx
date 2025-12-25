import { CalendarWidget } from '@/components/features/calendar';
import type { WeekStartDay } from '@/lib/services/SettingsService';
import type { DateStatusMap, PaymentDateMap } from '@/actions/calendar';

interface CalendarPanelProps {
  weekStartsOn?: WeekStartDay;
  /** Disable date filter feedback (hide "Showing bills for..." message) */
  disableDateFilter?: boolean;
  /** Controls calendar dot rendering mode */
  dotMode?: 'status' | 'payment' | 'none';
  /** Custom function to fetch date data (for payment dates) */
  getDateData?: (month: string) => Promise<DateStatusMap | PaymentDateMap>;
}

export function CalendarPanel({ weekStartsOn = 0, disableDateFilter = false, dotMode, getDateData }: CalendarPanelProps) {
  return (
    <aside className="calendar-panel bg-card px-4 pt-4">
      <CalendarWidget
        weekStartsOn={weekStartsOn}
        disableDateFilter={disableDateFilter}
        dotMode={dotMode}
        getDateData={getDateData}
      />
    </aside>
  );
}
