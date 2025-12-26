'use client';

import { SidebarToggle } from '@/components/layout/SidebarToggle';
import { TagFilter } from '@/components/features/bills/TagFilter';
import { BillSearch } from '@/components/features/bills/BillSearch';
import type { Tag } from '@/lib/types';

interface MonthlyHistoryHeaderProps {
  /** All available tags for filtering */
  tags: Tag[];
}

/**
 * MonthlyHistoryHeader
 *
 * Header component for monthly history view with sidebar toggle and tag filter.
 */
export function MonthlyHistoryHeader({ tags }: MonthlyHistoryHeaderProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <SidebarToggle />
      <TagFilter tags={tags} />
      <div className="ml-auto">
        <BillSearch />
      </div>
    </div>
  );
}

