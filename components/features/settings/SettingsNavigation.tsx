import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SettingsNavLink } from './SettingsNavLink';
import type { SettingsNavigationProps } from './types';

/**
 * Secondary sidebar navigation for the Settings page.
 *
 * Displays the settings title, a search placeholder (disabled),
 * and a list of category navigation links.
 */
export function SettingsNavigation({ categories }: SettingsNavigationProps) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Find a setting..."
          disabled
          className="pl-9 opacity-50 cursor-not-allowed"
        />
      </div>

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

