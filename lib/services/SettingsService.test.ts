import { SettingsService } from './SettingsService';
import { db, settingsCategories, settingsSections, settings } from '@/db';
import { DEFAULT_CATEGORIES, DEFAULT_SECTIONS, DEFAULT_SETTINGS_VALUES } from '@/lib/constants';
import { getLogger } from '@/lib/logger';

jest.mock('@/db');
jest.mock('@/lib/logger');

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
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'invalid' }]),
          }),
        }),
      });

      const result = await SettingsService.getDueSoonRange();
      expect(result).toBe(7);

      const logger = getLogger('SettingsService');
      expect(logger.error).toHaveBeenCalled();
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
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'invalid' }]),
          }),
        }),
      });

      const result = await SettingsService.getPaidRecentlyRange();
      expect(result).toBe(7);

      const logger = getLogger('SettingsService');
      expect(logger.error).toHaveBeenCalled();
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

  describe('getCategoryBySlug', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns null when category not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await SettingsService.getCategoryBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('returns category with sections and settings counts', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'general',
        name: 'General',
        displayOrder: 1,
      };
      const mockSections = [
        { id: 'sec-1', slug: 'view-options', name: 'View Options', description: 'View settings', displayOrder: 1 },
        { id: 'sec-2', slug: 'behavior-options', name: 'Behavior Options', description: null, displayOrder: 2 },
      ];

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;

        if (selectCallCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCategory]),
              }),
            }),
          };
        }

        if (selectCallCount === 2) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue(mockSections),
              }),
            }),
          };
        }

        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: selectCallCount === 3 ? 2 : 1 }]),
          }),
        };
      });

      const result = await SettingsService.getCategoryBySlug('general');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('general');
      expect(result?.name).toBe('General');
      expect(result?.sections).toHaveLength(2);
      expect(result?.sections[0].slug).toBe('view-options');
      expect(result?.sections[1].slug).toBe('behavior-options');
    });
  });

  describe('getAll', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns all settings merged with defaults', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue([
          { key: 'currency', value: 'EUR' },
          { key: 'locale', value: 'de-DE' },
          { key: 'weekStart', value: '1' },
        ]),
      });

      const result = await SettingsService.getAll();

      expect(result.currency).toBe('EUR');
      expect(result.locale).toBe('de-DE');
      expect(result.weekStart).toBe(1);
    });

    it('uses defaults when settings are missing', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await SettingsService.getAll();

      expect(result.currency).toBe('USD');
      expect(result.locale).toBe('en-US');
      expect(result.weekStart).toBe(0);
    });

    it('parses weekStart as number', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue([
          { key: 'weekStart', value: '6' },
        ]),
      });

      const result = await SettingsService.getAll();

      expect(result.weekStart).toBe(6);
      expect(typeof result.weekStart).toBe('number');
    });

    it('uses default weekStart for invalid values', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue([
          { key: 'weekStart', value: 'invalid' },
        ]),
      });

      const result = await SettingsService.getAll();

      expect(result.weekStart).toBe(0);
    });

    it('uses default weekStart for out-of-range values', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue([
          { key: 'weekStart', value: '7' },
        ]),
      });

      const result = await SettingsService.getAll();

      expect(result.weekStart).toBe(0);
    });
  });

  describe('setViewOptions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('upserts all view options settings within a transaction', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'view-options-section-id' }]),
          }),
        }),
      });

      const runMock = jest.fn();
      const onConflictDoUpdateMock = jest.fn().mockReturnValue({ run: runMock });
      const valuesMock = jest.fn().mockReturnValue({
        onConflictDoUpdate: onConflictDoUpdateMock,
      });
      const txInsertMock = jest.fn().mockReturnValue({ values: valuesMock });

      (db.transaction as jest.Mock).mockImplementation((callback) => {
        callback({ insert: txInsertMock });
      });

      await SettingsService.setViewOptions({
        currency: 'EUR',
        locale: 'de-DE',
        weekStart: 1,
      });

      expect(db.transaction).toHaveBeenCalled();
      expect(txInsertMock).toHaveBeenCalledTimes(3);
      expect(txInsertMock).toHaveBeenCalledWith(settings);
      expect(runMock).toHaveBeenCalledTimes(3);
    });

    it('throws error when view-options section not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        SettingsService.setViewOptions({
          currency: 'USD',
          locale: 'en-US',
          weekStart: 0,
        })
      ).rejects.toThrow('View Options section not found');
    });

    it('converts weekStart number to string for storage', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'section-id' }]),
          }),
        }),
      });

      const runMock = jest.fn();
      const onConflictDoUpdateMock = jest.fn().mockReturnValue({ run: runMock });
      const valuesMock = jest.fn().mockReturnValue({
        onConflictDoUpdate: onConflictDoUpdateMock,
      });
      const txInsertMock = jest.fn().mockReturnValue({ values: valuesMock });

      (db.transaction as jest.Mock).mockImplementation((callback) => {
        callback({ insert: txInsertMock });
      });

      await SettingsService.setViewOptions({
        currency: 'USD',
        locale: 'en-US',
        weekStart: 6,
      });

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'weekStart', value: '6' })
      );
    });
  });

  describe('getBillEndAction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns stored value when set to archive', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'archive' }]),
          }),
        }),
      });

      const result = await SettingsService.getBillEndAction();
      expect(result).toBe('archive');
    });

    it('returns mark_as_paid when stored value is mark_as_paid', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'mark_as_paid' }]),
          }),
        }),
      });

      const result = await SettingsService.getBillEndAction();
      expect(result).toBe('mark_as_paid');
    });

    it('returns default mark_as_paid when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await SettingsService.getBillEndAction();
      expect(result).toBe('mark_as_paid');
    });

    it('returns mark_as_paid for any value other than archive', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: 'invalid' }]),
          }),
        }),
      });

      const result = await SettingsService.getBillEndAction();
      expect(result).toBe('mark_as_paid');
    });
  });

  describe('setBillEndAction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('updates setting when valid action provided', async () => {
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

      await SettingsService.setBillEndAction('archive');

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when action value is invalid', async () => {
      // @ts-expect-error Testing invalid input
      await expect(SettingsService.setBillEndAction('invalid')).rejects.toThrow(
        'Invalid action value'
      );
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(SettingsService.setBillEndAction('archive')).rejects.toThrow(
        'Behavior Options section not found'
      );
    });

    it('accepts both mark_as_paid and archive values', async () => {
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

      await SettingsService.setBillEndAction('mark_as_paid');
      await SettingsService.setBillEndAction('archive');

      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });
});
