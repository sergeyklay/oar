import { db, settings, settingsCategories, settingsSections } from '@/db';
import { eq, asc, sql } from 'drizzle-orm';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/money';
import { ALLOWED_RANGE_VALUES, type AllowedRangeValue } from '@/lib/constants';
import type { StructuredSettings } from '@/db/schema';

export interface UserSettings {
  currency: string;
  locale: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  currency: DEFAULT_CURRENCY,
  locale: DEFAULT_LOCALE,
};

/** Service for managing user preferences stored as key-value pairs. */
export const SettingsService = {
  /** Retrieves all settings, merged with defaults. */
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

  /** Retrieves a single setting by key. */
  async get<K extends keyof UserSettings>(key: K): Promise<UserSettings[K]> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));

    return (row?.value ?? DEFAULT_SETTINGS[key]) as UserSettings[K];
  },

  /** Updates or creates a setting. */
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

  /** Seeds default settings if they don't exist. */
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

  /** Fetches the complete settings structure (categories, sections, settings counts). */
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

  /** Retrieves the configured "due soon" range in days. */
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

    if (isNaN(parsedValue) || !ALLOWED_RANGE_VALUES.includes(parsedValue as AllowedRangeValue)) {
      console.warn(`Invalid dueSoonRange value: ${row.value}. Defaulting to 7.`);
      return 7;
    }

    return parsedValue;
  },

  /** Updates the "due soon" range setting. */
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

  /** Seeds default categories and sections if they don't exist. */
  async initializeDefaults(): Promise<void> {
    const [existingCategory] = await db
      .select()
      .from(settingsCategories)
      .limit(1);

    if (!existingCategory) {
      await db.transaction(async (tx) => {
        const [generalCategory] = await tx
          .insert(settingsCategories)
          .values({
            slug: 'general',
            name: 'General',
            displayOrder: 1,
          })
          .returning({ id: settingsCategories.id });

        const [notificationCategory] = await tx
          .insert(settingsCategories)
          .values({
            slug: 'notification',
            name: 'Notification',
            displayOrder: 2,
          })
          .returning({ id: settingsCategories.id });

        const [loggingCategory] = await tx
          .insert(settingsCategories)
          .values({
            slug: 'logging',
            name: 'Logging',
            displayOrder: 3,
          })
          .returning({ id: settingsCategories.id });

        await tx.insert(settingsSections).values([
          {
            categoryId: generalCategory.id,
            slug: 'view-options',
            name: 'View Options',
            description: 'Customize how information is displayed',
            displayOrder: 1,
          },
          {
            categoryId: generalCategory.id,
            slug: 'behavior-options',
            name: 'Behavior Options',
            description: 'Configure application behavior',
            displayOrder: 2,
          },
          {
            categoryId: generalCategory.id,
            slug: 'other-options',
            name: 'Other Options',
            description: 'Additional preferences',
            displayOrder: 3,
          },
          {
            categoryId: notificationCategory.id,
            slug: 'notification-settings',
            name: 'Notification Settings',
            description: 'Configure notification preferences',
            displayOrder: 1,
          },
          {
            categoryId: loggingCategory.id,
            slug: 'logging-settings',
            name: 'Logging Settings',
            description: 'Configure logging preferences',
            displayOrder: 1,
          },
        ]);
      });
    }

    const [behaviorOptionsSection] = await db
      .select()
      .from(settingsSections)
      .where(eq(settingsSections.slug, 'behavior-options'))
      .limit(1);

    if (behaviorOptionsSection) {
      const [existingSetting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'dueSoonRange'))
        .limit(1);

      if (!existingSetting) {
        await db
          .insert(settings)
          .values({
            key: 'dueSoonRange',
            value: '7',
            sectionId: behaviorOptionsSection.id,
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: '7', updatedAt: new Date() },
          });
      }
    }
  },
};
