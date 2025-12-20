import type { StructuredSettings } from '@/db/schema';

/**
 * Single category from the structured settings hierarchy.
 */
export type SettingsCategory = StructuredSettings['categories'][number];

/**
 * Props for SettingsNavigation component.
 */
export interface SettingsNavigationProps {
  /** All available categories for navigation. */
  categories: SettingsCategory[];
}

/**
 * Props for SettingsNavLink component.
 */
export interface SettingsNavLinkProps {
  /** Category slug for URL param. */
  slug: string;
  /** Display name. */
  name: string;
}

/**
 * Props for SettingsCategoryPanel component.
 */
export interface SettingsCategoryPanelProps {
  /** The category to display. */
  category: SettingsCategory;
}

/**
 * Props for SettingsLayout component.
 */
export interface SettingsLayoutProps {
  /** Navigation sidebar content. */
  navigation: React.ReactNode;
  /** Main content area. */
  children: React.ReactNode;
}

