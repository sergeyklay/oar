import type { SettingsLayoutProps } from './types';

/**
 * Two-column layout wrapper for the Settings page.
 *
 * Renders a CSS Grid with a fixed-width navigation sidebar (280px)
 * and a flexible content area that fills the remaining space.
 */
export function SettingsLayout({ navigation, children }: SettingsLayoutProps) {
  return (
    <div className="grid grid-cols-[280px_1fr] h-full">
      <aside className="bg-card border-r border-border overflow-y-auto">
        {navigation}
      </aside>
      <main className="overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

