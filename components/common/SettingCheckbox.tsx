'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface SettingCheckboxProps {
  /** Unique identifier for the switch */
  id: string;
  /** Label text displayed above the switch */
  label: string;
  /** Optional description text displayed below the switch */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Callback when switch state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Whether the switch is in a loading state */
  isLoading?: boolean;
  /** Whether the switch is disabled */
  disabled?: boolean;
}

/**
 * Reusable switch component for settings pages.
 *
 * Follows consistent styling with Label above, switch control, and optional description below.
 * Displays loading spinner when updating.
 */
export function SettingCheckbox({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  isLoading = false,
  disabled = false,
}: SettingCheckboxProps) {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled || isLoading}
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </>
  );
}

