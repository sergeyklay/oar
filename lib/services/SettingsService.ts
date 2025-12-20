import { db, settings, settingsCategories, settingsSections } from '@/db';
import { eq, asc, sql } from 'drizzle-orm';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/money';
import {
  ALLOWED_RANGE_VALUES,
  type AllowedRangeValue,
  DEFAULT_CATEGORIES,
  DEFAULT_SECTIONS,
  DEFAULT_SETTINGS_VALUES,
} from '@/lib/constants';
import type { StructuredSettings } from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';

/**
 * User preferences for display and localization.
 *
 * @interface UserSettings
 */
export interface UserSettings {
  /** Currency code for monetary formatting (e.g., "USD", "EUR"). */
  currency: string;
  /** Locale identifier for number and date formatting (e.g., "en-US"). */
  locale: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  currency: DEFAULT_CURRENCY,
  locale: DEFAULT_LOCALE,
};

/**
 * Service for managing user preferences stored as key-value pairs.
 * Handles currency, locale, and behavior settings with SQLite persistence.
 */
export const SettingsService = {
  /**
   * Retrieves all user settings, merged with defaults for missing values.
   *
   * @returns {Promise<UserSettings>} Complete settings object with defaults applied.
   */
  async getAll(): Promise<UserSettings> {
    const rows = await db.select().from(settings);

    const settingsMap = rows.reduce(
      (acc, row) => {
        acc[row.key] = row.value;
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      currency: settingsMap['currency'] ?? DEFAULT_SETTINGS.currency,
      locale: settingsMap['locale'] ?? DEFAULT_SETTINGS.locale,
    };
  },

  /**
   * Retrieves a single setting by key with type-safe return value.
   *
   * @template K - The setting key type.
   * @param {K} key - The setting key to retrieve.
   * @returns {Promise<UserSettings[K]>} The setting value or its default.
   */
  async get<K extends keyof UserSettings>(key: K): Promise<UserSettings[K]> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));

    return (row?.value ?? DEFAULT_SETTINGS[key]) as UserSettings[K];
  },

  /**
   * Updates or creates a setting using upsert semantics.
   *
   * @template K - The setting key type.
   * @param {K} key - The setting key to update.
   * @param {UserSettings[K]} value - The new value to persist.
   * @returns {Promise<void>} Resolves when the setting is saved.
   */
  async set<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: String(value), updatedAt: new Date() },
      });
  },

  /**
   * Seeds default user settings if they don't exist.
   * Idempotent: skips settings that are already present.
   *
   * @returns {Promise<void>} Resolves when initialization completes.
   */
  async initialize(): Promise<void> {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const [existing] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key));

      if (!existing) {
        await db.insert(settings).values({ key, value: String(value) });
      }
    }
  },

  /**
   * Fetches a single category by slug with its sections and settings counts.
   *
   * @param slug - The URL-safe category identifier (e.g., "general", "notification").
   * @returns The category with sections, or null if not found.
   */
  async getCategoryBySlug(slug: string): Promise<StructuredSettings['categories'][number] | null> {
    const [category] = await db
      .select()
      .from(settingsCategories)
      .where(eq(settingsCategories.slug, slug))
      .limit(1);

    if (!category) {
      return null;
    }

    const sections = await db
      .select()
      .from(settingsSections)
      .where(eq(settingsSections.categoryId, category.id))
      .orderBy(asc(settingsSections.displayOrder), asc(settingsSections.name));

    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(settings)
          .where(eq(settings.sectionId, section.id));

        return {
          id: section.id,
          slug: section.slug,
          name: section.name,
          description: section.description,
          displayOrder: section.displayOrder,
          settingsCount: Number(countResult?.count ?? 0),
        };
      })
    );

    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      displayOrder: category.displayOrder,
      sections: sectionsWithCounts,
    };
  },

  /**
   * Fetches the complete settings structure with categories, sections, and counts.
   * Used by the Settings page to render the full hierarchy.
   *
   * @returns {Promise<StructuredSettings>} Nested structure of categories and sections.
   */
  async getStructure(): Promise<StructuredSettings> {
    const categories = await db
      .select()
      .from(settingsCategories)
      .orderBy(asc(settingsCategories.displayOrder), asc(settingsCategories.name));

    const structure: StructuredSettings = {
      categories: [],
    };

    for (const category of categories) {
      const sections = await db
        .select()
        .from(settingsSections)
        .where(eq(settingsSections.categoryId, category.id))
        .orderBy(asc(settingsSections.displayOrder), asc(settingsSections.name));

      const sectionsWithCounts = await Promise.all(
        sections.map(async (section) => {
          const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(settings)
            .where(eq(settings.sectionId, section.id));

          return {
            id: section.id,
            slug: section.slug,
            name: section.name,
            description: section.description,
            displayOrder: section.displayOrder,
            settingsCount: Number(countResult?.count ?? 0),
          };
        })
      );

      structure.categories.push({
        id: category.id,
        slug: category.slug,
        name: category.name,
        displayOrder: category.displayOrder,
        sections: sectionsWithCounts,
      });
    }

    return structure;
  },

  /**
   * Retrieves the configured "due soon" range in days.
   *
   * @returns {Promise<number>} The range in days, or 7 if missing/invalid.
   * @remarks Logs an error when an invalid value is encountered.
   */
  async getDueSoonRange(): Promise<number> {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'dueSoonRange'))
      .limit(1);

    if (!row) {
      return 7;
    }

    const parsedValue = parseInt(row.value, 10);

    if (isNaN(parsedValue) || !(ALLOWED_RANGE_VALUES as readonly number[]).includes(parsedValue)) {
      console.error(`Invalid dueSoonRange value: ${row.value}. Defaulting to 7.`);
      return 7;
    }

    return parsedValue;
  },

  /**
   * Persists the "due soon" range setting to the database.
   *
   * @param {AllowedRangeValue} days - Number of days (0, 1, 3, 5, 7, 10, 14, 20, or 30).
   * @returns {Promise<void>} Resolves when the setting is saved.
   * @throws {Error} If days is not one of the allowed values.
   * @throws {Error} If the "behavior-options" section does not exist.
   */
  async setDueSoonRange(days: AllowedRangeValue): Promise<void> {
    if (!ALLOWED_RANGE_VALUES.includes(days)) {
      throw new Error(`Invalid days value: ${days}. Must be one of: ${ALLOWED_RANGE_VALUES.join(', ')}`);
    }

    const [behaviorOptionsSection] = await db
      .select()
      .from(settingsSections)
      .where(eq(settingsSections.slug, 'behavior-options'))
      .limit(1);

    if (!behaviorOptionsSection) {
      throw new Error('Behavior Options section not found');
    }

    await db
      .insert(settings)
      .values({
        key: 'dueSoonRange',
        value: String(days),
        sectionId: behaviorOptionsSection.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: String(days), updatedAt: new Date() },
      });
  },

  /**
   * Retrieves the configured "paid recently" range in days.
   *
   * @returns The range in days, or 7 if missing/invalid.
   */
  async getPaidRecentlyRange(): Promise<number> {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'paidRecentlyRange'))
      .limit(1);

    if (!row) {
      return 7;
    }

    const parsedValue = parseInt(row.value, 10);

    if (isNaN(parsedValue) || !(ALLOWED_RANGE_VALUES as readonly number[]).includes(parsedValue)) {
      console.error(`Invalid paidRecentlyRange value: ${row.value}. Defaulting to 7.`);
      return 7;
    }

    return parsedValue;
  },

  /**
   * Persists the "paid recently" range setting to the database.
   *
   * @param days - Number of days (0, 1, 3, 5, 7, 10, 14, 20, or 30).
   * @throws If days is not one of the allowed values.
   * @throws If the "behavior-options" section does not exist.
   */
  async setPaidRecentlyRange(days: AllowedRangeValue): Promise<void> {
    if (!ALLOWED_RANGE_VALUES.includes(days)) {
      throw new Error(`Invalid days value: ${days}. Must be one of: ${ALLOWED_RANGE_VALUES.join(', ')}`);
    }

    const [behaviorOptionsSection] = await db
      .select()
      .from(settingsSections)
      .where(eq(settingsSections.slug, 'behavior-options'))
      .limit(1);

    if (!behaviorOptionsSection) {
      throw new Error('Behavior Options section not found');
    }

    await db
      .insert(settings)
      .values({
        key: 'paidRecentlyRange',
        value: String(days),
        sectionId: behaviorOptionsSection.id,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: String(days), updatedAt: new Date() },
      });
  },

  /**
   * Seeds default categories, sections, and settings if they don't exist.
   *
   * Creates: General, Notification, Logging categories with their sections
   * (view-options, behavior-options, other-options, notification-settings,
   * logging-settings) and settings with their default values.
   * Runs idempotently - skips structure creation if already initialized,
   * but always ensures all default settings exist.
   */
  async initializeDefaults(): Promise<void> {
    const [existingCategory] = await db
      .select()
      .from(settingsCategories)
      .limit(1);

    if (!existingCategory) {
      // First-time initialization: create all categories, sections, and settings
      db.transaction((tx) => {
        const categoryMap = new Map<string, string>();
        for (const cat of DEFAULT_CATEGORIES) {
          const result = tx
            .insert(settingsCategories)
            .values({
              id: createId(),
              slug: cat.slug,
              name: cat.name,
              displayOrder: cat.displayOrder,
            })
            .returning({ id: settingsCategories.id })
            .get();
          categoryMap.set(cat.slug, result.id);
        }

        const sectionMap = new Map<string, string>();
        for (const section of DEFAULT_SECTIONS) {
          const categoryId = categoryMap.get(section.categorySlug);
          if (!categoryId) {
            throw new Error(`Category not found for slug: ${section.categorySlug}`);
          }

          const result = tx
            .insert(settingsSections)
            .values({
              id: createId(),
              categoryId: categoryId,
              slug: section.slug,
              name: section.name,
              description: section.description,
              displayOrder: section.displayOrder,
            })
            .returning({ id: settingsSections.id })
            .get();
          sectionMap.set(section.slug, result.id);
        }

        for (const setting of DEFAULT_SETTINGS_VALUES) {
          const sectionId = sectionMap.get(setting.sectionSlug);
          if (!sectionId) {
            throw new Error(`Section not found for slug: ${setting.sectionSlug}`);
          }

          tx.insert(settings)
            .values({
              key: setting.key,
              value: setting.value,
              sectionId: sectionId,
            })
            .onConflictDoNothing()
            .run();
        }
      });
    } else {
      SettingsService.ensureDefaultSettings();
    }
  },

  /**
   * Ensures all settings from DEFAULT_SETTINGS_VALUES exist in the database.
   * Uses batched insert with onConflictDoNothing to avoid overwriting user values.
   */
  ensureDefaultSettings(): void {
    const existingSections = db.select().from(settingsSections).all();
    const sectionMap = new Map<string, string>();
    for (const section of existingSections) {
      sectionMap.set(section.slug, section.id);
    }

    const valuesArray: { key: string; value: string; sectionId: string }[] = [];

    for (const setting of DEFAULT_SETTINGS_VALUES) {
      const sectionId = sectionMap.get(setting.sectionSlug);
      if (!sectionId) {
        console.warn(`Section not found for slug: ${setting.sectionSlug}. Skipping setting: ${setting.key}`);
        continue;
      }

      valuesArray.push({
        key: setting.key,
        value: setting.value,
        sectionId: sectionId,
      });
    }

    if (valuesArray.length > 0) {
      db.transaction(() => {
        db.insert(settings).values(valuesArray).onConflictDoNothing().run();
      });
    }
  },
};
