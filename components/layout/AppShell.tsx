import { Sidebar } from './Sidebar';
import { CalendarPanel } from './CalendarPanel';

interface AppShellProps {
  children: React.ReactNode;
  /** Optional right panel content; defaults to CalendarPanel */
  rightPanel?: React.ReactNode;
}

export function AppShell({ children, rightPanel }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      {rightPanel ?? <CalendarPanel />}
    </div>
  );
}
