'use client';

import { X } from 'lucide-react';
import { useQueryState, parseAsString } from 'nuqs';

import { Button } from '@/components/ui/button';
import { type Prop } from '@/lib/types';

/**
 * Client component for closing the bill detail panel.
 * Sets selectedBill URL param to null.
 */
export function CloseDetailButton() {
  // shallow: false triggers server component re-render
  const [, setSelectedBill] = useQueryState(
    'selectedBill',
    parseAsString.withOptions({ shallow: false })
  );

  const handleClose: Prop<typeof Button, 'onClick'> = () => {
    setSelectedBill(null);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleClose}
      aria-label="Close bill detail"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}

