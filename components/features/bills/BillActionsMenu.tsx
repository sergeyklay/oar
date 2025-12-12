'use client';

import { useState } from 'react';
import { MoreHorizontal, History, Pencil, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteBill, archiveBill } from '@/actions/bills';
import type { Bill } from '@/lib/types';

interface BillActionsMenuProps {
  bill: Bill;
  onViewHistory: () => void;
  onEdit: () => void;
}

export function BillActionsMenu({
  bill,
  onViewHistory,
  onEdit,
}: BillActionsMenuProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleArchive() {
    setIsProcessing(true);
    const result = await archiveBill(bill.id, true);
    setIsProcessing(false);

    if (result.success) {
      toast.success('Bill archived', {
        description: `"${bill.title}" has been archived.`,
      });
    } else {
      toast.error('Failed to archive bill', {
        description: result.error ?? 'Please try again.',
      });
    }
  }

  async function handleDelete() {
    setIsProcessing(true);
    const result = await deleteBill(bill.id);
    setIsProcessing(false);
    setDeleteDialogOpen(false);

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isProcessing}
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
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Bill
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive Bill
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Bill
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{bill.title}&quot;? This
              action cannot be undone and will also delete all payment history
              for this bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
