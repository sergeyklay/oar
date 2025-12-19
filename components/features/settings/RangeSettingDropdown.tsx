'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
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
  const [value, setValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    startTransition(async () => {
      const result = await onUpdate({
        range: newValue as RangeKey,
      });
      if (!result.success) {
        toast.error('Failed to update setting', {
          description: result.error || 'Please try again.',
        });
        setValue(currentValue);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              labels[value] || value
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

