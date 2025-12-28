'use client';

import { useActionState, useEffect, useRef, startTransition } from 'react';
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

interface ActionState {
  value: 'mark_as_paid' | 'archive';
  error: string | null;
}

export function BillEndActionDropdown({
  currentValue,
  onUpdate,
}: BillEndActionDropdownProps) {
  const updateAction = async (
    prevState: ActionState,
    value: 'mark_as_paid' | 'archive'
  ): Promise<ActionState> => {
    const result = await onUpdate(value);
    if (!result.success) {
      return {
        value: prevState.value,
        error: result.error || 'Failed to update setting',
      };
    }
    return {
      value,
      error: null,
    };
  };

  const [state, updateValue, isPending] = useActionState(updateAction, {
    value: currentValue,
    error: null,
  });

  const prevStateRef = useRef(state);

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (state.error && !prevState.error) {
      toast.error('Failed to update setting', {
        description: state.error,
      });
    } else if (
      state.value !== prevState.value &&
      !state.error &&
      !isPending &&
      state.value !== currentValue
    ) {
      toast.success('Setting updated');
    }
  }, [state, isPending, currentValue]);

  const handleValueChange = (newValue: string) => {
    startTransition(() => {
      updateValue(newValue as 'mark_as_paid' | 'archive');
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={state.value}
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
              OPTIONS.find((opt) => opt.value === state.value)?.label || state.value
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

