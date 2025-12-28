'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { ActionResult } from '@/lib/types';
import { useSettingDropdown } from './useSettingDropdown';

interface BillEndActionDropdownProps {
  currentValue: 'mark_as_paid' | 'archive';
  onUpdate: (value: 'mark_as_paid' | 'archive') => Promise<ActionResult<void>>;
}

const OPTIONS = [
  { value: 'mark_as_paid' as const, label: 'Mark as Never Due' },
  { value: 'archive' as const, label: 'Move to the Archive' },
] as const;

export function BillEndActionDropdown({
  currentValue,
  onUpdate,
}: BillEndActionDropdownProps) {
  const { displayValue, isPending, handleValueChange } = useSettingDropdown({
    currentValue,
    onUpdate,
    showSuccessToast: true,
  });

  return (
    <div className="flex items-center gap-2">
      <Select
        value={displayValue}
        onValueChange={handleValueChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              OPTIONS.find((opt) => opt.value === displayValue)?.label || displayValue
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

