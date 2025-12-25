import { Sidebar } from './Sidebar';
import { CalendarPanel } from './CalendarPanel';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  children: React.ReactNode;
  /** Right panel content; defaults to CalendarPanel. Pass null to hide. */
  rightPanel?: React.ReactNode | null;
}

export function AppShell({ children, rightPanel }: AppShellProps) {
  const showRightPanel = rightPanel !== null;

  return (
    <div className={cn('app-shell', !showRightPanel && 'no-right-panel')}>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      {showRightPanel && (rightPanel ?? <CalendarPanel />)}
    </div>
  );
}
