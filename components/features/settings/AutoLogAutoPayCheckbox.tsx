'use client';

import { useState } from 'react';
import { updateAutoLogAutoPay } from '@/actions/settings';
import { toast } from 'sonner';
import { Toggle } from '@/components/common/Toggle';
import { getLogger } from '@/lib/logger';

const logger = getLogger('AutoLogAutoPayCheckbox');

interface AutoLogAutoPayCheckboxProps {
  checked: boolean;
}

/**
 * Renders a toggle that enables or disables automatically logging automatic bills and manages optimistic update with rollback on failure.
 *
 * @param checked - Initial checked state for the toggle
 * @returns The Toggle element controlling the automatic logging setting
 */
export function AutoLogAutoPayCheckbox({ checked: initialChecked }: AutoLogAutoPayCheckboxProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckedChange = async (newChecked: boolean) => {
    setIsLoading(true);
    setChecked(newChecked);

    try {
      const result = await updateAutoLogAutoPay({ enabled: newChecked });

      if (!result.success) {
        toast.error(result.error || 'Failed to update setting');
        setChecked(!newChecked);
      }
    } catch (error) {
      toast.error('Failed to update setting');
      logger.error(error, 'Failed to update auto-log auto-pay setting');

      setChecked(!newChecked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Toggle
      id="autoLogAutoPay"
      label="Automatically log automatic bills"
      description="If an automatic bill has an amount due set, Oar will automatically log it on the due date"
      checked={checked}
      onCheckedChange={handleCheckedChange}
      isLoading={isLoading}
    />
  );
}
