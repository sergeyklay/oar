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
  /** Default category ID for new bills */
  defaultCategoryId: string;
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Bill
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

