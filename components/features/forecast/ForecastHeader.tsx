'use client';

import { SidebarToggle } from '@/components/layout/SidebarToggle';
import { MonthPicker } from './MonthPicker';
import { SettingsToggle } from './SettingsToggle';
import { TagFilter } from '@/components/features/bills/TagFilter';
import type { Tag } from '@/lib/types';

interface ForecastHeaderProps {
  /** All available tags for filtering */
  tags: Tag[];
}

/**
 * ForecastHeader
 *
 * Header component for forecast view with sidebar toggle, month picker, tag filter, and settings toggle.
 *
 * WHY CLIENT:
 * - Contains interactive elements (SidebarToggle, MonthPicker, TagFilter, SettingsToggle)
 * - All components manage URL state via nuqs
 */
export function ForecastHeader({ tags }: ForecastHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <SidebarToggle />
      <MonthPicker />
      <TagFilter tags={tags} />
      <SettingsToggle />
    </div>
  );
}

