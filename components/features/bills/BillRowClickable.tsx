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

  function handleClick() {
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
          handleClick();
        }
      }}
    >
      {children}
    </tr>
  );
}

