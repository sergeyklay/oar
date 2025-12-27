import { ScrollableContainer } from '@/components/common/ScrollableContainer';

interface ReportSidebarProps {
  children: React.ReactNode;
}

/**
 * ReportSidebar
 *
 * Structural layout component for the right sidebar on report pages
 * (Forecast, Monthly History, Annual Spending).
 *
 * Provides consistent styling and scrolling behavior for summary panels.
 * Always rendered in the right column of a two-column grid layout.
 *
 * Render Mode: Server Component (pure presentational wrapper)
 */
export function ReportSidebar({ children }: ReportSidebarProps) {
  return (
    <div className="bg-card border-l border-border p-6">
      <ScrollableContainer>
        {children}
      </ScrollableContainer>
    </div>
  );
}

