'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { type Prop } from '@/lib/types';

interface BillRowClickableProps {
  billId: string;
  isSelected: boolean;
  children: React.ReactNode;
}

/**
 * Checks if an element is inside a dialog or popover.
 * Radix UI Dialog uses role="dialog", while Popover uses data-radix-popper-content-wrapper.
 */
function isInsideDialogOrPopover(element: Element | null): boolean {
  if (!element) return false;
  const isInsideDialog = element.closest('[role="dialog"]') !== null;
  const isInsidePopover =
    element.closest('[data-radix-popper-content-wrapper]') !== null ||
    element.closest('[data-radix-popover-content]') !== null;
  return isInsideDialog || isInsidePopover;
}

/**
 * Checks if an element is an editable input (input, textarea, or contenteditable).
 */
function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable =
    element.getAttribute('contenteditable') === 'true' ||
    (element as HTMLElement).isContentEditable;
  return isInput || isContentEditable;
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

  const handleClick: Prop<'tr', 'onClick'> = (e) => {
    // Don't handle clicks if any dialog or popover is currently open
    const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]') !== null;
    const hasOpenPopover = document.querySelector('[data-radix-popper-content-wrapper]') !== null;
    if (hasOpenDialog || hasOpenPopover) {
      e.stopPropagation();
      return;
    }

    // Don't handle clicks if the target is inside a dialog or popover
    const target = e.target as HTMLElement;
    if (isInsideDialogOrPopover(target)) {
      e.stopPropagation();
      return;
    }

    // Toggle: if already selected, deselect; otherwise select
    setSelectedBill(isSelected ? null : billId);
  };

  return (
    <tr
      onClick={handleClick}
      data-selected={isSelected}
      className="bill-row-clickable"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Don't handle keyboard events if focus is on an editable element (input, textarea, etc.)
          if (isEditableElement(e.target as Element)) {
            return;
          }

          e.preventDefault();

          // Don't handle keyboard events if any dialog or popover is currently open
          const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]') !== null;
          const hasOpenPopover = document.querySelector('[data-radix-popper-content-wrapper]') !== null;
          if (hasOpenDialog || hasOpenPopover) {
            return;
          }

          // Don't handle keyboard events if focus is inside a dialog or popover
          if (isInsideDialogOrPopover(document.activeElement)) {
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
