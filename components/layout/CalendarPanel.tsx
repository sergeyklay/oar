interface CalendarPanelProps {
  children?: React.ReactNode;
}

export function CalendarPanel({ children }: CalendarPanelProps) {
  return (
    <aside className="calendar-panel bg-card p-4">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Calendar
      </h2>
      {children}
      {/* MiniCalendar component will be passed as children */}
    </aside>
  );
}
