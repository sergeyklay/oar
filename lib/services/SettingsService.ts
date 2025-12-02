import { db, settings } from '@/db';
import { eq } from 'drizzle-orm';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/money';

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
};
