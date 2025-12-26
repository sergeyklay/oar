import { SidebarToggle } from './SidebarToggle';
import { AddBillButton } from '@/components/features/bills/AddBillButton';
import { TagFilter } from '@/components/features/bills/TagFilter';
import { BillSearch } from '@/components/features/bills/BillSearch';
import type { Tag, BillCategoryGroupWithCategories } from '@/lib/types';

interface PageHeaderProps {
  /** Currency symbol for the AddBillButton */
  currencySymbol?: string;
  /** All available tags for the AddBillButton and TagFilter */
  availableTags?: Tag[];
  /** Category groups with nested categories for AddBillButton */
  categoriesGrouped?: BillCategoryGroupWithCategories[];
  /** Default category ID for AddBillButton */
  defaultCategoryId?: string | null;
}

/**
 * PageHeader
 *
 * Unified header component for all pages. Composition component that orchestrates
 * atomic components (SidebarToggle, AddBillButton, TagFilter, BillSearch) with
 * consistent layout and spacing.
 *
 * Architecture: Composition Pattern
 * - Orchestrates layout (flex, spacing classes)
 * - Composes reusable atomic components
 * - Single source of truth for header structure across all pages
 *
 * Always renders: SidebarToggle, AddBillButton (if props provided), TagFilter (if tags provided), BillSearch
 *
 * Render Mode: Server Component (receives data via props, no hooks)
 */
export function PageHeader({
  currencySymbol,
  availableTags = [],
  categoriesGrouped,
  defaultCategoryId,
}: PageHeaderProps) {
  return (
    <div className="flex items-center w-full">
      <SidebarToggle />
      {categoriesGrouped && (
        <div className="ml-4">
          <AddBillButton
            currencySymbol={currencySymbol}
            availableTags={availableTags}
            categoriesGrouped={categoriesGrouped}
            defaultCategoryId={defaultCategoryId ?? null}
          />
        </div>
      )}
      {availableTags.length > 0 && (
        <div className={categoriesGrouped ? 'ml-2' : 'ml-4'}>
          <TagFilter tags={availableTags} />
        </div>
      )}
      <div className="ml-auto">
        <BillSearch />
      </div>
    </div>
  );
}

