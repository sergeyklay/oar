'use client';

import { icons, CircleDashed, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  /** Lucide icon name in kebab-case (e.g., "house", "credit-card") */
  icon: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Converts kebab-case to PascalCase for Lucide icon lookup.
 *
 * @example kebabToPascal('credit-card') // 'CreditCard'
 */
function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Renders a Lucide icon by name.
 *
 * Uses dynamic icon lookup from lucide-react's icons object.
 * Falls back to CircleDashed if icon name is invalid.
 */
export function CategoryIcon({
  icon,
  size = 16,
  className,
}: CategoryIconProps) {
  const pascalName = kebabToPascal(icon);
  const IconComponent: LucideIcon = icons[pascalName as keyof typeof icons] ?? CircleDashed;

  return (
    <IconComponent
      size={size}
      className={cn('shrink-0', className)}
    />
  );
}


