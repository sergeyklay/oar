'use client';

import { useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateDueSoonRange } from '@/actions/settings';
import { RANGE_LABELS } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface DueSoonSettingDropdownProps {
  currentValue: string;
}

export function DueSoonSettingDropdown({
  currentValue,
}: DueSoonSettingDropdownProps) {
  const [value, setValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    startTransition(async () => {
      const result = await updateDueSoonRange({
        range: newValue as '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30',
      });
      if (!result.success) {
        console.error('Failed to update due soon range:', result.error);
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
              RANGE_LABELS[value] || value
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(RANGE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

