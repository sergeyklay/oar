import { Sidebar } from './Sidebar';
import { CalendarPanel } from './CalendarPanel';

interface AppShellProps {
  children: React.ReactNode;
  /** Right panel content; defaults to CalendarPanel. Pass null to hide. */
  rightPanel?: React.ReactNode | null;
}

export function AppShell({ children, rightPanel }: AppShellProps) {
  const showRightPanel = rightPanel !== null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      {showRightPanel && (rightPanel ?? <CalendarPanel />)}
    </div>
  );
}
