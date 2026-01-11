'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { RangeKey } from '@/lib/constants';
import type { ActionResult } from '@/lib/types';
import { useSettingDropdown } from './useSettingDropdown';

interface RangeSettingDropdownProps {
  /** Current value as string (e.g., "7") */
  currentValue: string;
  /** Label map for dropdown options */
  labels: Record<string, string>;
  /** Server action to call on value change */
  onUpdate: (input: { range: RangeKey }) => Promise<ActionResult<void>>;
}

export function RangeSettingDropdown({
  currentValue,
  labels,
  onUpdate,
}: RangeSettingDropdownProps) {
  const { displayValue, isPending, handleValueChange } = useSettingDropdown<RangeKey>({
    currentValue: currentValue as RangeKey,
    onUpdate: (range: RangeKey) => onUpdate({ range }),
    showSuccessToast: false,
  });

  return (
    <div className="flex items-center gap-2">
      <Select value={displayValue} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              labels[displayValue] || displayValue
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(labels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
