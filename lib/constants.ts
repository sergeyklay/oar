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

/** Default settings category slug for URL state. */
export const DEFAULT_SETTINGS_CATEGORY = 'general';

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
  { key: 'locale', value: 'en-US', sectionSlug: 'view-options' },
  { key: 'weekStart', value: '0', sectionSlug: 'view-options' },
  { key: 'theme', value: 'system', sectionSlug: 'view-options' },
  { key: 'notifications_enabled', value: 'true', sectionSlug: 'notification-settings' },
] as const;

/** Currency options for the view settings dropdown */
export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'JPY', label: 'JPY (¥)' },
  { code: 'CAD', label: 'CAD (C$)' },
  { code: 'AUD', label: 'AUD (A$)' },
  { code: 'CHF', label: 'CHF (Fr)' },
  { code: 'CNY', label: 'CNY (¥)' },
  { code: 'SEK', label: 'SEK (kr)' },
  { code: 'NZD', label: 'NZD ($)' },
  { code: 'PLN', label: 'PLN (zł)' },
  { code: 'INR', label: 'INR (₹)' },
  { code: 'BRL', label: 'BRL (R$)' },
  { code: 'ZAR', label: 'ZAR (R)' },
  { code: 'MXN', label: 'MXN ($)' },
  { code: 'UAH', label: 'UAH (₴)' },
] as const;

/** Locale options for the view settings dropdown */
export const LOCALE_OPTIONS = [
  { code: 'en-US', label: 'English (United States)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'en-CA', label: 'English (Canada)' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'pl-PL', label: 'Polish (Poland)' },
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'it-IT', label: 'Italian (Italy)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'zh-CN', label: 'Chinese (China)' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ru-RU', label: 'Russian (Russia)' },
  { code: 'uk-UA', label: 'Ukrainian (Ukraine)' },
] as const;

/** Week start day options for the calendar */
export const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
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
