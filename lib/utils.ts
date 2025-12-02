import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Standard utility used by shadcn/ui components
 *
 * @example
 * cn('px-2 py-1', 'py-2') // → 'px-2 py-2' (py-2 wins)
 * cn('text-red-500', isActive && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
