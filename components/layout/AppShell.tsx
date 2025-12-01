import { Sidebar } from './Sidebar';
import { CalendarPanel } from './CalendarPanel';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <CalendarPanel />
    </div>
  );
}
