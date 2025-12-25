'use client';

import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import { parseAsBoolean } from 'nuqs';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * SettingsToggle
 *
 * Icon button that opens a popover with independent toggles for
 * "Amount to Save" and "Estimates" visibility.
 * Updates URL search params via nuqs.
 *
 * WHY CLIENT:
 * - Uses nuqs for URL state management
 * - Interactive button and popover
 * - Checkbox state management
 */
export function SettingsToggle() {
  const [open, setOpen] = useState(false);
  const [{ showAmortization, showEstimates }, setParams] = useQueryStates(
    {
      showAmortization: parseAsBoolean.withDefault(true),
      showEstimates: parseAsBoolean.withDefault(true),
    },
    {
      shallow: false, // Trigger server re-render
    }
  );

  const handleAmortizationChange = (checked: boolean) => {
    setParams({ showAmortization: checked });
  };

  const handleEstimatesChange = (checked: boolean) => {
    setParams({ showEstimates: checked });
  };

  const isActive = !showAmortization || !showEstimates;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className="h-9"
          aria-label="Forecast settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Display Options</h4>
            <p className="text-xs text-muted-foreground">
              Control which columns are visible in the forecast view.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-amortization"
                checked={showAmortization}
                onCheckedChange={handleAmortizationChange}
              />
              <Label
                htmlFor="show-amortization"
                className="text-sm font-normal cursor-pointer"
              >
                Show Amount to Save
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-estimates"
                checked={showEstimates}
                onCheckedChange={handleEstimatesChange}
              />
              <Label
                htmlFor="show-estimates"
                className="text-sm font-normal cursor-pointer"
              >
                Show Estimates
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

