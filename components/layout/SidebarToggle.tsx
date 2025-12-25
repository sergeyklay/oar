'use client';

import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarToggleProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * SidebarToggle
 *
 * Client component that toggles sidebar visibility via URL state.
 * Clicking the button toggles between visible and hidden states.
 *
 * WHY CLIENT:
 * - Uses useQueryState hook for URL state management
 * - Requires click handler for interactivity
 */
export function SidebarToggle({ className }: SidebarToggleProps) {
  const [sidebarState, setSidebarState] = useQueryState(
    'sidebar',
    parseAsStringLiteral(['hidden'])
  );

  function handleToggle() {
    setSidebarState(sidebarState === 'hidden' ? null : 'hidden');
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className={className}
      aria-label={sidebarState === 'hidden' ? 'Show sidebar' : 'Hide sidebar'}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}

