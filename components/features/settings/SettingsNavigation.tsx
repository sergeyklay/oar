import { SettingsNavLink } from './SettingsNavLink';
import type { SettingsNavigationProps } from './types';

/**
 * Secondary sidebar navigation for the Settings page.
 *
 * Displays a list of category navigation links.
 */
export function SettingsNavigation({ categories }: SettingsNavigationProps) {
  return (
    <div className="p-4 flex flex-col">
      <nav className="flex flex-col gap-1">
        {categories.map((category) => (
          <SettingsNavLink
            key={category.id}
            slug={category.slug}
            name={category.name}
          />
        ))}
      </nav>
    </div>
  );
}

