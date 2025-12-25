'use client';

import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { cn } from '@/lib/utils';

interface AppShellClientProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShellClient
 *
 * Client component that reads sidebar visibility state from URL
 * and applies the sidebar-hidden class to its children.
 *
 * WHY CLIENT:
 * - Uses useQueryState hook to read URL param
 * - Conditionally applies CSS class based on URL state
 */
export function AppShellClient({ children, className }: AppShellClientProps) {
  const [sidebarState] = useQueryState('sidebar', parseAsStringLiteral(['hidden']));
  const isSidebarHidden = sidebarState === 'hidden';

  return (
    <div className={cn(className, isSidebarHidden && 'sidebar-hidden')}>
      {children}
    </div>
  );
}

