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
import type { ActionResult } from '@/lib/types';

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
  const [value, setValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (newValue: string) => {
    setValue(newValue as 'mark_as_paid' | 'archive');
    startTransition(async () => {
      const result = await onUpdate(newValue as 'mark_as_paid' | 'archive');
      if (!result.success) {
        toast.error('Failed to update setting', {
          description: result.error || 'Please try again.',
        });
        setValue(currentValue);
      } else {
        toast.success('Setting updated');
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
              OPTIONS.find((opt) => opt.value === value)?.label || value
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

