'use client';

import { useState, useRef } from 'react';
import { updateAutoLogAutoPay } from '@/actions/settings';
import { Toggle } from '@/components/common/Toggle';
import { getLogger } from '@/lib/logger';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';

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
  const previousCheckedRef = useRef(checked);

  const { execute, isPending: isLoading } = useAsyncAction({
    action: (enabled: boolean) => updateAutoLogAutoPay({ enabled }),
    errorMessage: 'Failed to update setting',
    showSuccessToast: false,
    onError: () => {
      setChecked(previousCheckedRef.current);
    },
  });

  const handleCheckedChange = (newChecked: boolean) => {
    previousCheckedRef.current = checked;
    setChecked(newChecked);

    execute(newChecked).catch((error) => {
      logger.error(error, 'Failed to update auto-log auto-pay setting');
      setChecked(previousCheckedRef.current);
    });
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
