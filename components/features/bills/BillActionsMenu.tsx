'use client';

import { MoreHorizontal, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BillActionsMenuProps {
  onViewHistory: () => void;
}

/**
 * Dropdown menu for bill-specific actions in the table.
 * Currently only contains "View History" as other management actions
 * moved to the Bill Detail Panel.
 *
 * @param {BillActionsMenuProps} props - Component props.
 * @returns {JSX.Element} The actions menu.
 */
export function BillActionsMenu({
  onViewHistory,
}: BillActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
