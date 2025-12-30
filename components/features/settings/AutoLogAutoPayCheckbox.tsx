'use client';

import { useState } from 'react';
import { updateAutoLogAutoPay } from '@/actions/settings';
import { toast } from 'sonner';
import { SettingCheckbox } from '@/components/common/SettingCheckbox';

interface AutoLogAutoPayCheckboxProps {
  checked: boolean;
}

export function AutoLogAutoPayCheckbox({ checked: initialChecked }: AutoLogAutoPayCheckboxProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckedChange = async (newChecked: boolean) => {
    setIsLoading(true);
    setChecked(newChecked);

    const result = await updateAutoLogAutoPay({ enabled: newChecked });

    if (result.success) {
      toast.success('Setting updated');
    } else {
      toast.error(result.error || 'Failed to update setting');
      setChecked(!newChecked);
    }

    setIsLoading(false);
  };

  return (
    <SettingCheckbox
      id="autoLogAutoPay"
      label="Automatically log automatic bills"
      description="If an automatic bill has an amount due set, Oar will automatically log it on the due date"
      checked={checked}
      onCheckedChange={handleCheckedChange}
      isLoading={isLoading}
    />
  );
}

