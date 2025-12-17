'use client';

import { useQueryState, parseAsString } from 'nuqs';

interface BillRowClickableProps {
  billId: string;
  isSelected: boolean;
  children: React.ReactNode;
}

/**
 * Clickable table row wrapper for bill selection.
 * Toggles the selectedBill URL parameter on click.
 */
export function BillRowClickable({ billId, isSelected, children }: BillRowClickableProps) {
  // shallow: false triggers server component re-render
  const [, setSelectedBill] = useQueryState(
    'selectedBill',
    parseAsString.withOptions({ shallow: false })
  );

  function handleClick(e: React.MouseEvent<HTMLTableRowElement>) {
    // Don't handle clicks if any dialog is currently open
    // This prevents clicks from triggering bill selection when editing
    const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]') !== null;
    if (hasOpenDialog) {
      e.stopPropagation();
      return;
    }

    // Don't handle clicks if the target is inside a dialog or popover
    // Radix UI Popover uses role="dialog" for accessibility, so this check covers both
    const target = e.target as HTMLElement;
    const isInsideDialog = target.closest('[role="dialog"]') !== null;

    if (isInsideDialog) {
      e.stopPropagation();
      return;
    }

    // Toggle: if already selected, deselect; otherwise select
    setSelectedBill(isSelected ? null : billId);
  }

  return (
    <tr
      onClick={handleClick}
      data-selected={isSelected}
      className="bill-row-clickable"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Don't handle keyboard events if any dialog is currently open
          const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]') !== null;
          if (hasOpenDialog) {
            return;
          }
          // Also check if focus is inside a dialog
          const activeElement = document.activeElement;
          if (activeElement && activeElement.closest('[role="dialog"]')) {
            return;
          }
          setSelectedBill(isSelected ? null : billId);
        }
      }}
    >
      {children}
    </tr>
  );
}

