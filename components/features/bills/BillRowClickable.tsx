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
    // This prevents clicks inside dialogs/popovers from triggering bill selection
    const target = e.target as HTMLElement;

    // Check if click is inside a dialog (Radix UI Dialog uses role="dialog")
    const isInsideDialog = target.closest('[role="dialog"]') !== null;

    // Check if click is inside a popover (Radix UI Popover content is in a portal)
    // Popovers are typically rendered outside the DOM hierarchy, so we check
    // if the target has a popover-related attribute or is inside a popover container
    const isInsidePopover =
      target.closest('[data-radix-popper-content-wrapper]') !== null ||
      target.closest('[data-radix-popover-content]') !== null ||
      target.closest('[role="dialog"][data-radix-popover-content]') !== null;

    if (isInsideDialog || isInsidePopover) {
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

