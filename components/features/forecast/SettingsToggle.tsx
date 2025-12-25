'use client';

import { useQueryStates } from 'nuqs';
import { parseAsBoolean } from 'nuqs';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SettingsToggle
 *
 * Icon button to toggle visibility of "Amount to Save" and "Estimates".
 * Updates URL search params via nuqs.
 *
 * WHY CLIENT:
 * - Uses nuqs for URL state management
 * - Interactive button click
 */
export function SettingsToggle() {
  const [{ showAmortization, showEstimates }, setParams] = useQueryStates(
    {
      showAmortization: parseAsBoolean.withDefault(true),
      showEstimates: parseAsBoolean.withDefault(true),
    },
    {
      shallow: false, // Trigger server re-render
    }
  );

  const handleToggle = () => {
    setParams({
      showAmortization: !showAmortization,
      showEstimates: !showEstimates,
    });
  };

  const isActive = !showAmortization || !showEstimates;

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      className="h-9"
      onClick={handleToggle}
      aria-label="Toggle forecast settings"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
}

