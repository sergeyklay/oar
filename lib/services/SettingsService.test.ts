import { SettingsService } from './SettingsService';
import { db, settingsCategories, settingsSections, settings } from '@/db';
import { DEFAULT_CATEGORIES, DEFAULT_SECTIONS, DEFAULT_SETTINGS_VALUES } from '@/lib/constants';

jest.mock('@/db');

describe('SettingsService', () => {
  describe('initializeDefaults', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('seeds default settings when database is empty', async () => {
      const mockSelectBuilder = {
        from: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectBuilder);

      (db.transaction as jest.Mock).mockImplementation((callback) => {
        return callback(db);
      });

      await SettingsService.initializeDefaults();

      expect(db.transaction).toHaveBeenCalled();

      const insertCalls = (db.insert as jest.Mock).mock.calls;
      const insertResults = (db.insert as jest.Mock).mock.results;


      const totalInserts = DEFAULT_CATEGORIES.length + DEFAULT_SECTIONS.length + DEFAULT_SETTINGS_VALUES.length;
      expect(db.insert).toHaveBeenCalledTimes(totalInserts);

      let callIndex = 0;
      for (const cat of DEFAULT_CATEGORIES) {
        expect(insertCalls[callIndex][0]).toBe(settingsCategories);

        const builder = insertResults[callIndex].value;
        expect(builder.values).toHaveBeenCalledWith(expect.objectContaining({
          slug: cat.slug,
          name: cat.name,
          displayOrder: cat.displayOrder,
        }));
        callIndex++;
      }

      for (const section of DEFAULT_SECTIONS) {
        expect(insertCalls[callIndex][0]).toBe(settingsSections);

        const builder = insertResults[callIndex].value;
        expect(builder.values).toHaveBeenCalledWith(expect.objectContaining({
          slug: section.slug,
          name: section.name,
          description: section.description,
          displayOrder: section.displayOrder,
          categoryId: expect.any(String),
        }));
        callIndex++;
      }

      for (const setting of DEFAULT_SETTINGS_VALUES) {
        expect(insertCalls[callIndex][0]).toBe(settings);

        const builder = insertResults[callIndex].value;
        expect(builder.values).toHaveBeenCalledWith(expect.objectContaining({
          key: setting.key,
          value: setting.value,
          sectionId: expect.any(String),
        }));
        callIndex++;
      }
    });

    it('does not recreate structure when database is already populated', async () => {
      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First call: check for existing categories (async with limit)
          return {
            from: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([{ id: 'existing-category-id' }]),
          };
        }
        // Second call: get existing sections for ensureDefaultSettings (sync with .all())
        return {
          from: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([
              { id: 'section-1', slug: 'behavior-options' },
              { id: 'section-2', slug: 'view-options' },
              { id: 'section-3', slug: 'notification-settings' },
            ]),
          }),
        };
      });

      const runMock = jest.fn();
      const onConflictDoNothingMock = jest.fn().mockReturnValue({ run: runMock });
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: onConflictDoNothingMock,
        }),
      });

      (db.transaction as jest.Mock).mockImplementation((callback) => {
        callback(db);
      });

      await SettingsService.initializeDefaults();

      // ensureDefaultSettings uses a transaction for batched insert
      expect(db.transaction).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('getDueSoonRange', () => {
    it('returns stored value when valid', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: '14' }]),
          }),
        }),
      });

      const result = await SettingsService.getDueSoonRange();
      expect(result).toBe(14);
    });

    it('returns default (7) when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await SettingsService.getDueSoonRange();
      expect(result).toBe(7);
    });

    it('returns default (7) when stored value is invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'invalid' }]),
          }),
        }),
      });

      const result = await SettingsService.getDueSoonRange();
      expect(result).toBe(7);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('setDueSoonRange', () => {
    it('updates setting when valid', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'section-id' }]),
          }),
        }),
      });

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.setDueSoonRange(14);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when value is invalid', async () => {
      // @ts-expect-error Testing invalid input
      await expect(SettingsService.setDueSoonRange(99)).rejects.toThrow('Invalid days value');
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(SettingsService.setDueSoonRange(7)).rejects.toThrow('Behavior Options section not found');
    });
  });

  describe('getPaidRecentlyRange', () => {
    it('returns stored value when valid', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: '14' }]),
          }),
        }),
      });

      const result = await SettingsService.getPaidRecentlyRange();
      expect(result).toBe(14);
    });

    it('returns default (7) when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await SettingsService.getPaidRecentlyRange();
      expect(result).toBe(7);
    });

    it('returns default (7) when stored value is invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'invalid' }]),
          }),
        }),
      });

      const result = await SettingsService.getPaidRecentlyRange();
      expect(result).toBe(7);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('setPaidRecentlyRange', () => {
    it('updates setting when valid', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'section-id' }]),
          }),
        }),
      });

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.setPaidRecentlyRange(14);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when value is invalid', async () => {
      // @ts-expect-error Testing invalid input
      await expect(SettingsService.setPaidRecentlyRange(99)).rejects.toThrow('Invalid days value');
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(SettingsService.setPaidRecentlyRange(7)).rejects.toThrow('Behavior Options section not found');
    });
  });
});
