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
 * Render a labeled switch control with an optional description in either a vertical (label above) or horizontal (label beside) layout.
 *
 * @param id - Unique identifier used to associate the label with the switch
 * @param label - Text displayed for the control label
 * @param description - Optional supplementary text shown beneath the control
 * @param checked - Current checked state of the switch
 * @param onCheckedChange - Callback invoked with the new checked state when the switch is toggled
 * @param isLoading - When true, disables interaction and displays a spinner next to the switch
 * @param disabled - When true, disables interaction regardless of `isLoading`
 * @param layout - Layout orientation; `'vertical'` places the label above the switch, `'horizontal'` places it beside
 * @param className - Optional additional CSS classes applied to the outer container
 * @returns The rendered toggle element
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
