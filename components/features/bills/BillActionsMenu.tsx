'use client';

import { useState } from 'react';
import { MoreHorizontal, History, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteBill } from '@/actions/bills';
import type { Bill } from '@/db/schema';

interface BillActionsMenuProps {
  bill: Bill;
  onViewHistory: () => void;
}

export function BillActionsMenu({ bill, onViewHistory }: BillActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${bill.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteBill(bill.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success('Bill deleted', {
        description: `"${bill.title}" has been removed.`,
      });
    } else {
      toast.error('Failed to delete bill', {
        description: result.error ?? 'Please try again.',
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isDeleting}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onViewHistory}>
          <History className="mr-2 h-4 w-4" />
          View History
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Bill
          <span className="ml-auto text-xs text-muted-foreground">(Soon)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Bill
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
