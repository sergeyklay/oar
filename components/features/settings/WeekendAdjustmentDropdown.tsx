'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { WeekendAdjustmentStrategy } from '@/lib/types';
import type { ActionResult } from '@/lib/types';
import { useSettingDropdown } from './useSettingDropdown';

interface WeekendAdjustmentDropdownProps {
  /** Current value */
  currentValue: WeekendAdjustmentStrategy;
  /** Callback when value changes */
  onUpdate: (input: { strategy: WeekendAdjustmentStrategy }) => Promise<ActionResult<void>>;
}

const STRATEGY_LABELS: Record<WeekendAdjustmentStrategy, string> = {
  unchanged: 'Leave Unchanged',
  next_business_day: 'Move to Next Business Day',
  previous_business_day: 'Move to Previous Business Day',
};

const STRATEGY_DESCRIPTIONS: Record<WeekendAdjustmentStrategy, string> = {
  unchanged: 'Keep the original date even if it falls on a weekend. Use this for bills that process on weekends, like digital subscriptions.',
  next_business_day: 'If a bill is due on Saturday or Sunday, show it as due on Monday instead. This matches how most banks handle payments.',
  previous_business_day: 'If a bill is due on Saturday or Sunday, show it as due on Friday instead. This ensures you pay before the weekend.',
};

export function WeekendAdjustmentDropdown({
  currentValue,
  onUpdate,
}: WeekendAdjustmentDropdownProps) {
  const { displayValue, isPending, handleValueChange } = useSettingDropdown({
    currentValue,
    onUpdate: (strategy: WeekendAdjustmentStrategy) => onUpdate({ strategy }),
    showSuccessToast: true,
  });

  return (
    <div className="space-y-2">
      <Select
        value={displayValue}
        onValueChange={handleValueChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue>
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              STRATEGY_LABELS[displayValue]
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STRATEGY_LABELS) as WeekendAdjustmentStrategy[]).map((strategy) => (
            <SelectItem key={strategy} value={strategy}>
              {STRATEGY_LABELS[strategy]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {STRATEGY_DESCRIPTIONS[displayValue]}
      </p>
    </div>
  );
}

