'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillFormDialog } from './BillFormDialog';

interface AddBillButtonProps {
  currencySymbol?: string;
}

export function AddBillButton({ currencySymbol }: AddBillButtonProps) {
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
      />
    </>
  );
}

