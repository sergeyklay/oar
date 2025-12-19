'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Props for the NavLink component.
 */
interface NavLinkProps {
  /** Navigation target URL. */
  href: string;
  /** Whether this link displays stats (affects subtitle styling when active). */
  hasStats?: boolean;
  /** Link content rendered from Server Component. */
  children: React.ReactNode;
}

/**
 * Navigation link with active state detection.
 *
 * Renders a styled link that highlights when the current pathname matches the href.
 * Active state uses blue background with white text; inactive uses muted styling.
 * Children are rendered from the Server Component to avoid serialization issues with icons.
 */
export function NavLink({ href, hasStats, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const baseClasses = 'flex items-center gap-3 px-3 py-2 rounded-md transition-colors';
  const activeClasses = 'bg-primary text-white [&_.nav-subtitle]:text-white/70';
  const inactiveClasses = 'text-muted-foreground hover:text-foreground hover:bg-accent';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      data-active={isActive}
      data-has-stats={hasStats}
    >
      {children}
    </Link>
  );
}
