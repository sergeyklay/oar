import { SidebarToggle } from './SidebarToggle';
import { AddBillButton } from '@/components/features/bills/AddBillButton';
import { TagFilter } from '@/components/features/bills/TagFilter';
import { BillSearch } from '@/components/features/bills/BillSearch';
import type { Tag, BillCategoryGroupWithCategories } from '@/lib/types';

interface PageHeaderProps {
  /** Whether to show the "Create New Bill" button (Overview page only) */
  showCreateBill?: boolean;
  /** Whether to show the Tag Filter */
  showTagFilter?: boolean;
  /** Whether to show the Search component (default: true) */
  showSearch?: boolean;
  /** Props for AddBillButton when showCreateBill is true */
  createBillProps?: {
    currencySymbol?: string;
    availableTags?: Tag[];
    categoriesGrouped: BillCategoryGroupWithCategories[];
    defaultCategoryId: string | null;
  };
  /** Tags array for TagFilter when showTagFilter is true */
  tagFilterTags?: Tag[];
}

/**
 * PageHeader
 *
 * Shared server component that standardizes header layout across all pages.
 * Provides consistent button layout with sidebar toggle, optional create bill button,
 * and optional tag filter.
 *
 * Render Mode: Server Component (receives data via props, no hooks)
 */
export function PageHeader({
  showCreateBill = false,
  showTagFilter = false,
  showSearch = true,
  createBillProps,
  tagFilterTags = [],
}: PageHeaderProps) {
  return (
    <div className="flex items-center w-full">
      <SidebarToggle />
      {showCreateBill && createBillProps && (
        <div className="ml-4">
          <AddBillButton
            currencySymbol={createBillProps.currencySymbol}
            availableTags={createBillProps.availableTags}
            categoriesGrouped={createBillProps.categoriesGrouped}
            defaultCategoryId={createBillProps.defaultCategoryId}
          />
        </div>
      )}
      {showTagFilter && tagFilterTags.length > 0 && (
        <div className={showCreateBill ? 'ml-2' : 'ml-4'}>
          <TagFilter tags={tagFilterTags} />
        </div>
      )}
      {showSearch && (
        <div className="ml-auto">
          <BillSearch />
        </div>
      )}
    </div>
  );
}

