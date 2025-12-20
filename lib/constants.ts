import type { BillFrequency } from '@/lib/types';

export const RANGE_KEYS = ['0', '1', '3', '5', '7', '10', '14', '20', '30'] as const;

export type RangeKey = typeof RANGE_KEYS[number];

export const ALLOWED_RANGE_VALUES = [0, 1, 3, 5, 7, 10, 14, 20, 30] as const;

export type AllowedRangeValue = typeof ALLOWED_RANGE_VALUES[number];

/** Labels for future-looking ranges (Due Soon) */
export const FUTURE_RANGE_LABELS: Record<string, string> = {
  '0': 'Today',
  '1': 'Today or tomorrow',
  '3': 'In next 3 days',
  '5': 'In next 5 days',
  '7': 'In next 7 days',
  '10': 'In next 10 days',
  '14': 'In next 14 days',
  '20': 'In next 20 days',
  '30': 'In next 30 days',
};

/** Labels for past-looking ranges (Paid Recently) */
export const PAST_RANGE_LABELS: Record<string, string> = {
  '0': 'Today',
  '1': 'Today or yesterday',
  '3': 'Last 3 days',
  '5': 'Last 5 days',
  '7': 'Last 7 days',
  '10': 'Last 10 days',
  '14': 'Last 14 days',
  '20': 'Last 20 days',
  '30': 'Last 30 days',
};

export const DEFAULT_CATEGORIES = [
  { slug: 'general', name: 'General', displayOrder: 1 },
  { slug: 'notification', name: 'Notification', displayOrder: 2 },
  { slug: 'logging', name: 'Logging', displayOrder: 3 },
] as const;

export const DEFAULT_SECTIONS = [
  {
    categorySlug: 'general',
    slug: 'view-options',
    name: 'View Options',
    description: 'Customize how information is displayed',
    displayOrder: 1,
  },
  {
    categorySlug: 'general',
    slug: 'behavior-options',
    name: 'Behavior Options',
    description: 'Configure application behavior',
    displayOrder: 2,
  },
  {
    categorySlug: 'general',
    slug: 'other-options',
    name: 'Other Options',
    description: 'Additional preferences',
    displayOrder: 3,
  },
  {
    categorySlug: 'notification',
    slug: 'notification-settings',
    name: 'Notification Settings',
    description: 'Configure notification preferences',
    displayOrder: 1,
  },
  {
    categorySlug: 'logging',
    slug: 'logging-settings',
    name: 'Logging Settings',
    description: 'Configure logging preferences',
    displayOrder: 1,
  },
] as const;

export const DEFAULT_SETTINGS_VALUES = [
  { key: 'dueSoonRange', value: '7', sectionSlug: 'behavior-options' },
  { key: 'paidRecentlyRange', value: '7', sectionSlug: 'behavior-options' },
  { key: 'currency', value: 'USD', sectionSlug: 'view-options' },
  { key: 'theme', value: 'system', sectionSlug: 'view-options' },
  { key: 'notifications_enabled', value: 'true', sectionSlug: 'notification-settings' },
] as const;

/**
 * Human-readable labels for bill frequency display in table subtitles.
 * Used in the Overview table Name column subtitle.
 */
export const FREQUENCY_DISPLAY_LABELS: Record<BillFrequency, string> = {
  once: 'One-time',
  monthly: 'Every month',
  yearly: 'Every year',
};
