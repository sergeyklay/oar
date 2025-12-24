'use client';

import { useQueryState } from 'nuqs';
import { DEFAULT_SETTINGS_CATEGORY } from '@/lib/constants';
import { type Prop } from '@/lib/types';
import type { SettingsNavLinkProps } from './types';

/**
 * Navigation link for settings categories with active state detection.
 *
 * Uses nuqs to manage URL state for category selection.
 * Active state is determined by comparing the current category param with the slug.
 */
export function SettingsNavLink({ slug, name }: SettingsNavLinkProps) {
  const [category, setCategory] = useQueryState('category', {
    defaultValue: DEFAULT_SETTINGS_CATEGORY,
    shallow: false,
  });

  const isActive = category === slug;

  const baseClasses = 'flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer';
  const activeClasses = 'bg-accent text-foreground border-l-2 border-primary';
  const inactiveClasses = 'text-muted-foreground hover:text-foreground hover:bg-accent';

  const handleClick: Prop<'button', 'onClick'> = () => {
    setCategory(slug);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} w-full text-left`}
      data-active={isActive}
    >
      {name}
    </button>
  );
}

