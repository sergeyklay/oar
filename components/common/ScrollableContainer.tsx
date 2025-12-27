import { cn } from '@/lib/utils';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ScrollableContainer
 *
 * Standardized scrollable container with consistent scrollbar styling.
 * Applies the .bill-list-container class to ensure uniform scrollbar appearance.
 *
 * This is a generic reusable component for any scrollable content area.
 * It belongs in components/common/ because it's not layout-specific.
 *
 * Render Mode: Server Component (pure presentational wrapper)
 */
export function ScrollableContainer({
  children,
  className,
}: ScrollableContainerProps) {
  return (
    <div className={cn('bill-list-container', className)}>
      {children}
    </div>
  );
}

