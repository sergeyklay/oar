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

interface ActionState {
  value: string;
  error: string | null;
}

export function RangeSettingDropdown({
  currentValue,
  labels,
  onUpdate,
}: RangeSettingDropdownProps) {
  const updateAction = async (
    prevState: ActionState,
    range: RangeKey
  ): Promise<ActionState> => {
    const result = await onUpdate({ range });
    if (!result.success) {
      return {
        value: prevState.value,
        error: result.error || 'Failed to update setting',
      };
    }
    return {
      value: range,
      error: null,
    };
  };

  const [state, updateRange, isPending] = useActionState(updateAction, {
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
    }
  }, [state]);

  const handleValueChange = (newValue: string) => {
    startTransition(() => {
      updateRange(newValue as RangeKey);
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
              labels[state.value] || state.value
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

