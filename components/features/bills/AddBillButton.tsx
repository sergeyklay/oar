'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillFormDialog } from './BillFormDialog';
import type { Tag, BillCategoryGroupWithCategories } from '@/lib/types';

interface AddBillButtonProps {
  currencySymbol?: string;
  /** All available tags for the form */
  availableTags?: Tag[];
  /** Category groups with nested categories for dropdown */
  categoriesGrouped: BillCategoryGroupWithCategories[];
  /** Default category ID for new bills (null if no categories exist) */
  defaultCategoryId: string | null;
}

export function AddBillButton({
  currencySymbol,
  availableTags = [],
  categoriesGrouped,
  defaultCategoryId,
}: AddBillButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="icon" aria-label="Add Bill">
        <Plus className="h-4 w-4" />
      </Button>
      <BillFormDialog
        open={open}
        onOpenChange={setOpen}
        currencySymbol={currencySymbol}
        availableTags={availableTags}
        categoriesGrouped={categoriesGrouped}
        defaultCategoryId={defaultCategoryId}
      />
    </>
  );
}

