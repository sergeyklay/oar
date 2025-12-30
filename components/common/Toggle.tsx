'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Layout options for the Toggle component.
 */
type Layout = 'vertical' | 'horizontal';

/**
 * Props for the Toggle component.
 */
interface ToggleProps {
  /** Unique identifier for the toggle */
  id: string;
  /** Label text */
  label: string;
  /** Optional description text */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Callback invoked when toggle state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Whether the toggle is in a loading state */
  isLoading?: boolean;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Layout orientation: 'vertical' (label above) or 'horizontal' (label beside) */
  layout?: Layout;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Reusable toggle component for the entire application.
 *
 * Provides consistent styling and behavior for boolean controls across settings, forms, and dialogs.
 * Supports both vertical (label above) and horizontal (label beside) layouts.
 * Always uses Switch control for consistent user experience.
 *
 * @param {ToggleProps} props - Component props
 * @returns The rendered toggle component
 */
export function Toggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  isLoading = false,
  disabled = false,
  layout = 'vertical',
  className,
}: ToggleProps) {
  const controlContent = (
    <>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || isLoading}
      />
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
    </>
  );

  if (layout === 'horizontal') {
    const labelElement = (
      <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
    );

    const descriptionElement = description && (
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    );

    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex items-center gap-2">
          {controlContent}
          {labelElement}
        </div>
        {descriptionElement}
      </div>
    );
  }

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {controlContent}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

