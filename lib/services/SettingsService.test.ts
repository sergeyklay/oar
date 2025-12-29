import { SettingsService } from './SettingsService';
import { db, settingsCategories, settingsSections, settings, resetDbMocks } from '@/db';
import {
  ALLOWED_RANGE_VALUES,
  DEFAULT_CATEGORIES,
  DEFAULT_SECTIONS,
  DEFAULT_SETTINGS_VALUES,
  DEFAULT_WEEKEND_ADJUSTMENT,
} from '@/lib/constants';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/money';
import { getLogger } from '@/lib/logger';

jest.mock('@/db');
jest.mock('@/lib/logger');

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

type QueryBuilder = {
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
  orderBy: jest.Mock;
  all: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
  get: jest.Mock;
  onConflictDoUpdate: jest.Mock;
  onConflictDoNothing: jest.Mock;
  run: jest.Mock;
  then?: (onResolve: (value: unknown[]) => unknown) => Promise<unknown>;
};

const createSelectBuilder = (result: unknown[]): QueryBuilder => {
  const resultPromise = Promise.resolve(result);
  const builder: QueryBuilder = {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(result),
        orderBy: jest.fn().mockResolvedValue(result),
        then: resultPromise.then.bind(resultPromise),
        catch: resultPromise.catch.bind(resultPromise),
      }),
      orderBy: jest.fn().mockResolvedValue(result),
      then: resultPromise.then.bind(resultPromise),
      catch: resultPromise.catch.bind(resultPromise),
    }),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    orderBy: jest.fn().mockResolvedValue(result),
    all: jest.fn().mockReturnValue(result),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnValue(result[0] ?? null),
    onConflictDoUpdate: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn().mockReturnThis(),
    run: jest.fn(),
    then: resultPromise.then.bind(resultPromise),
  };
  return builder;
};

const createSelectBuilderSync = (result: unknown[]): QueryBuilder => {
  const resultPromise = Promise.resolve(result);
  const fromResult = {
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(result),
      orderBy: jest.fn().mockResolvedValue(result),
      then: resultPromise.then.bind(resultPromise),
      catch: resultPromise.catch.bind(resultPromise),
    }),
    orderBy: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockResolvedValue(result),
    then: resultPromise.then.bind(resultPromise),
    catch: resultPromise.catch.bind(resultPromise),
  };
  const builder: QueryBuilder = {
    from: jest.fn().mockReturnValue(fromResult),
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(result),
      orderBy: jest.fn().mockResolvedValue(result),
      then: resultPromise.then.bind(resultPromise),
      catch: resultPromise.catch.bind(resultPromise),
    }),
    limit: jest.fn().mockResolvedValue(result),
    orderBy: jest.fn().mockResolvedValue(result),
    all: jest.fn().mockReturnValue(result),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnValue(result[0] ?? null),
    onConflictDoUpdate: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn().mockReturnThis(),
    run: jest.fn(),
    then: resultPromise.then.bind(resultPromise),
  };
  return builder;
};

describe('SettingsService', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.debug.mockClear();
  });

  describe('getAll', () => {
    it('returns all settings merged with defaults', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([
          { key: 'currency', value: 'EUR' },
          { key: 'locale', value: 'de-DE' },
          { key: 'weekStart', value: '1' },
          { key: 'includeAutoPayInDueSoon', value: 'false' },
        ])
      );

      const result = await SettingsService.getAll();

      expect(result.currency).toBe('EUR');
      expect(result.locale).toBe('de-DE');
      expect(result.weekStart).toBe(1);
      expect(result.includeAutoPayInDueSoon).toBe(false);
    });

    it('uses defaults when settings are missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getAll();

      expect(result.currency).toBe(DEFAULT_CURRENCY);
      expect(result.locale).toBe(DEFAULT_LOCALE);
      expect(result.weekStart).toBe(0);
      expect(result.includeAutoPayInDueSoon).toBe(true);
    });

    it('parses weekStart as number', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'weekStart', value: '6' }])
      );

      const result = await SettingsService.getAll();

      expect(result.weekStart).toBe(6);
      expect(typeof result.weekStart).toBe('number');
    });

    it.each([
      ['invalid', 0],
      ['7', 0],
      ['-1', 0],
      ['10', 0],
    ])('uses default weekStart for invalid value %s', async (value, expected) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'weekStart', value }])
      );

      const result = await SettingsService.getAll();

      expect(result.weekStart).toBe(expected);
    });

    it.each([
      ['true', true],
      ['false', false],
      ['invalid', true],
      ['', true],
    ])('parses includeAutoPayInDueSoon value %s correctly', async (value, expected) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'includeAutoPayInDueSoon', value }])
      );

      const result = await SettingsService.getAll();

      expect(result.includeAutoPayInDueSoon).toBe(expected);
    });

    it('uses default includeAutoPayInDueSoon when missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getAll();

      expect(result.includeAutoPayInDueSoon).toBe(true);
    });
  });

  describe('get', () => {
    it('returns stored value for currency', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'currency', value: 'EUR' }])
      );

      const result = await SettingsService.get('currency');

      expect(result).toBe('EUR');
    });

    it('returns stored value for locale', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'locale', value: 'de-DE' }])
      );

      const result = await SettingsService.get('locale');

      expect(result).toBe('de-DE');
    });

    it('returns stored value for weekStart', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'weekStart', value: '1' }])
      );

      const result = await SettingsService.get('weekStart');

      expect(result).toBe('1');
    });

    it('returns stored value for includeAutoPayInDueSoon', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ key: 'includeAutoPayInDueSoon', value: 'false' }])
      );

      const result = await SettingsService.get('includeAutoPayInDueSoon');

      expect(result).toBe('false');
    });

    it('returns default value when setting is missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.get('currency');

      expect(result).toBe(DEFAULT_CURRENCY);
    });
  });

  describe('set', () => {
    it('upserts currency setting', async () => {
      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.set('currency', 'EUR');

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('upserts locale setting', async () => {
      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.set('locale', 'de-DE');

      expect(db.insert).toHaveBeenCalledWith(settings);
    });

    it('converts weekStart number to string for storage', async () => {
      const valuesMock = jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });

      await SettingsService.set('weekStart', 1);

      expect(valuesMock).toHaveBeenCalledWith({
        key: 'weekStart',
        value: '1',
      });
    });

    it('converts includeAutoPayInDueSoon boolean to string for storage', async () => {
      const valuesMock = jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });

      await SettingsService.set('includeAutoPayInDueSoon', false);

      expect(valuesMock).toHaveBeenCalledWith({
        key: 'includeAutoPayInDueSoon',
        value: 'false',
      });
    });
  });

  describe('setViewOptions', () => {
    it('upserts all view options settings within a transaction', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'view-options-section-id' }])
      );

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
        includeAutoPayInDueSoon: true,
      });

      expect(db.transaction).toHaveBeenCalled();
      expect(txInsertMock).toHaveBeenCalledTimes(4);
      expect(txInsertMock).toHaveBeenCalledWith(settings);
      expect(runMock).toHaveBeenCalledTimes(4);
    });

    it('throws error when view-options section not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      await expect(
        SettingsService.setViewOptions({
          currency: 'USD',
          locale: 'en-US',
          weekStart: 0,
          includeAutoPayInDueSoon: true,
        })
      ).rejects.toThrow('View Options section not found');
    });

    it('converts weekStart number to string for storage', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

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
        includeAutoPayInDueSoon: true,
      });

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'weekStart', value: '6' })
      );
    });

    it('converts includeAutoPayInDueSoon boolean to string for storage', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

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
        weekStart: 0,
        includeAutoPayInDueSoon: false,
      });

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'includeAutoPayInDueSoon', value: 'false' })
      );
    });
  });

  describe('initialize', () => {
    it('creates missing settings with default values', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.initialize();

      expect(db.insert).toHaveBeenCalledTimes(4);
      expect(db.insert).toHaveBeenCalledWith(settings);
    });

    it('skips existing settings', async () => {
      (db.select as jest.Mock)
        .mockReturnValueOnce(createSelectBuilderSync([{ key: 'currency', value: 'EUR' }]))
        .mockReturnValueOnce(createSelectBuilderSync([]))
        .mockReturnValueOnce(createSelectBuilderSync([]))
        .mockReturnValueOnce(createSelectBuilderSync([]));

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.initialize();

      expect(db.insert).toHaveBeenCalledTimes(3);
    });
  });

  describe('getCategoryBySlug', () => {
    it('returns null when category not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

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
        {
          id: 'sec-1',
          slug: 'view-options',
          name: 'View Options',
          description: 'View settings',
          displayOrder: 1,
        },
        {
          id: 'sec-2',
          slug: 'behavior-options',
          name: 'Behavior Options',
          description: null,
          displayOrder: 2,
        },
      ];

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation((columns?: unknown) => {
        selectCallCount++;

        if (selectCallCount === 1) {
          return createSelectBuilderSync([mockCategory]);
        }

        if (selectCallCount === 2) {
          return createSelectBuilderSync(mockSections);
        }

        if (columns && typeof columns === 'object' && 'count' in columns) {
          return createSelectBuilderSync([
            { count: selectCallCount === 3 ? 2 : 1 },
          ]);
        }

        return createSelectBuilderSync([
          { count: selectCallCount === 3 ? 2 : 1 },
        ]);
      });

      const result = await SettingsService.getCategoryBySlug('general');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('general');
      expect(result?.name).toBe('General');
      expect(result?.sections).toHaveLength(2);
      expect(result?.sections[0].slug).toBe('view-options');
      expect(result?.sections[0].settingsCount).toBe(2);
      expect(result?.sections[1].slug).toBe('behavior-options');
      expect(result?.sections[1].settingsCount).toBe(1);
    });
  });

  describe('getStructure', () => {
    it('returns complete structure with categories, sections, and counts', async () => {
      const mockCategories = [
        { id: 'cat-1', slug: 'general', name: 'General', displayOrder: 1 },
        { id: 'cat-2', slug: 'notification', name: 'Notification', displayOrder: 2 },
      ];
      const mockSections = [
        {
          id: 'sec-1',
          categoryId: 'cat-1',
          slug: 'view-options',
          name: 'View Options',
          description: 'View settings',
          displayOrder: 1,
        },
        {
          id: 'sec-2',
          categoryId: 'cat-1',
          slug: 'behavior-options',
          name: 'Behavior Options',
          description: null,
          displayOrder: 2,
        },
        {
          id: 'sec-3',
          categoryId: 'cat-2',
          slug: 'notification-settings',
          name: 'Notification Settings',
          description: null,
          displayOrder: 1,
        },
      ];

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation((columns?: unknown) => {
        selectCallCount++;

        if (selectCallCount === 1) {
          return createSelectBuilderSync(mockCategories);
        }

        if (selectCallCount === 2) {
          return createSelectBuilderSync(
            mockSections.filter((s) => s.categoryId === 'cat-1')
          );
        }

        if (columns && typeof columns === 'object' && 'count' in columns) {
          if (selectCallCount === 3) {
            return createSelectBuilderSync([{ count: 3 }]);
          }
          if (selectCallCount === 4) {
            return createSelectBuilderSync([{ count: 2 }]);
          }
          return createSelectBuilderSync([{ count: 1 }]);
        }

        if (selectCallCount === 5) {
          return createSelectBuilderSync(
            mockSections.filter((s) => s.categoryId === 'cat-2')
          );
        }

        return createSelectBuilderSync([{ count: 1 }]);
      });

      const result = await SettingsService.getStructure();

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].slug).toBe('general');
      expect(result.categories[0].sections).toHaveLength(2);
      expect(result.categories[1].slug).toBe('notification');
      expect(result.categories[1].sections).toHaveLength(1);
    });

    it('returns empty structure when no categories exist', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getStructure();

      expect(result.categories).toHaveLength(0);
    });
  });

  describe('getDueSoonRange', () => {
    it.each(ALLOWED_RANGE_VALUES)('returns stored value %d when valid', async (value) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: String(value) }])
      );

      const result = await SettingsService.getDueSoonRange();

      expect(result).toBe(value);
    });

    it('returns default (7) when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getDueSoonRange();

      expect(result).toBe(7);
    });

    it('returns default (7) when stored value is invalid', async () => {
      mockLogger.error.mockClear();
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'invalid' }])
      );

      const result = await SettingsService.getDueSoonRange();

      expect(result).toBe(7);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { invalidValue: 'invalid' },
        'Invalid dueSoonRange value, defaulting to 7'
      );
    });

    it('returns default (7) when stored value is out of allowed range', async () => {
      mockLogger.error.mockClear();
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: '99' }])
      );

      const result = await SettingsService.getDueSoonRange();

      expect(result).toBe(7);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('setDueSoonRange', () => {
    it.each(ALLOWED_RANGE_VALUES)('updates setting when valid value %d', async (value) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.setDueSoonRange(value);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when value is invalid', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        SettingsService.setDueSoonRange(99)
      ).rejects.toThrow('Invalid days value');
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      await expect(SettingsService.setDueSoonRange(7)).rejects.toThrow(
        'Behavior Options section not found'
      );
    });
  });

  describe('getPaidRecentlyRange', () => {
    it.each(ALLOWED_RANGE_VALUES)('returns stored value %d when valid', async (value) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: String(value) }])
      );

      const result = await SettingsService.getPaidRecentlyRange();

      expect(result).toBe(value);
    });

    it('returns default (7) when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getPaidRecentlyRange();

      expect(result).toBe(7);
    });

    it('returns default (7) when stored value is invalid', async () => {
      mockLogger.error.mockClear();
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'invalid' }])
      );

      const result = await SettingsService.getPaidRecentlyRange();

      expect(result).toBe(7);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { invalidValue: 'invalid' },
        'Invalid paidRecentlyRange value, defaulting to 7'
      );
    });
  });

  describe('setPaidRecentlyRange', () => {
    it.each(ALLOWED_RANGE_VALUES)('updates setting when valid value %d', async (value) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.setPaidRecentlyRange(value);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when value is invalid', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        SettingsService.setPaidRecentlyRange(99)
      ).rejects.toThrow('Invalid days value');
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      await expect(SettingsService.setPaidRecentlyRange(7)).rejects.toThrow(
        'Behavior Options section not found'
      );
    });
  });

  describe('getBillEndAction', () => {
    it('returns stored value when set to archive', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'archive' }])
      );

      const result = await SettingsService.getBillEndAction();

      expect(result).toBe('archive');
    });

    it('returns mark_as_paid when stored value is mark_as_paid', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'mark_as_paid' }])
      );

      const result = await SettingsService.getBillEndAction();

      expect(result).toBe('mark_as_paid');
    });

    it('returns default mark_as_paid when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getBillEndAction();

      expect(result).toBe('mark_as_paid');
    });

    it('returns mark_as_paid for any value other than archive', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'invalid' }])
      );

      const result = await SettingsService.getBillEndAction();

      expect(result).toBe('mark_as_paid');
    });
  });

  describe('setBillEndAction', () => {
    it.each([
      ['mark_as_paid' as const],
      ['archive' as const],
    ])('updates setting when valid action %s provided', async (action) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.setBillEndAction(action);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when action value is invalid', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        SettingsService.setBillEndAction('invalid')
      ).rejects.toThrow('Invalid action value');
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      await expect(SettingsService.setBillEndAction('archive')).rejects.toThrow(
        'Behavior Options section not found'
      );
    });
  });

  describe('getWeekendAdjustment', () => {
    it.each([
      ['unchanged' as const],
      ['next_business_day' as const],
      ['previous_business_day' as const],
    ])('returns stored value when set to %s', async (strategy) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: strategy }])
      );

      const result = await SettingsService.getWeekendAdjustment();

      expect(result).toBe(strategy);
    });

    it('returns default when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getWeekendAdjustment();

      expect(result).toBe(DEFAULT_WEEKEND_ADJUSTMENT);
    });

    it('returns default for invalid value', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'invalid' }])
      );

      const result = await SettingsService.getWeekendAdjustment();

      expect(result).toBe(DEFAULT_WEEKEND_ADJUSTMENT);
    });
  });

  describe('setWeekendAdjustment', () => {
    it.each([
      ['unchanged' as const],
      ['next_business_day' as const],
      ['previous_business_day' as const],
    ])('updates setting when valid strategy %s provided', async (strategy) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

      const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      });

      await SettingsService.setWeekendAdjustment(strategy);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(onConflictDoUpdateMock).toHaveBeenCalled();
    });

    it('throws error when strategy value is invalid', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        SettingsService.setWeekendAdjustment('invalid')
      ).rejects.toThrow('Invalid strategy value');
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      await expect(SettingsService.setWeekendAdjustment('unchanged')).rejects.toThrow(
        'Behavior Options section not found'
      );
    });
  });

  describe('getIncludeAutoPayInDueSoon', () => {
    it('returns true when stored value is "true"', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'true' }])
      );

      const result = await SettingsService.getIncludeAutoPayInDueSoon();

      expect(result).toBe(true);
    });

    it('returns false when stored value is "false"', async () => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'false' }])
      );

      const result = await SettingsService.getIncludeAutoPayInDueSoon();

      expect(result).toBe(false);
    });

    it('returns default (true) when setting missing', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      const result = await SettingsService.getIncludeAutoPayInDueSoon();

      expect(result).toBe(true);
    });

    it('returns default (true) when stored value is invalid', async () => {
      mockLogger.error.mockClear();
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ value: 'invalid' }])
      );

      const result = await SettingsService.getIncludeAutoPayInDueSoon();

      expect(result).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { invalidValue: 'invalid' },
        'Invalid includeAutoPayInDueSoon value, defaulting to true'
      );
    });
  });

  describe('setIncludeAutoPayInDueSoon', () => {
    it.each([
      [true, 'true'],
      [false, 'false'],
    ])('updates setting when value is %s', async (value, expectedString) => {
      (db.select as jest.Mock).mockReturnValue(
        createSelectBuilderSync([{ id: 'section-id' }])
      );

      const valuesMock = jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });

      await SettingsService.setIncludeAutoPayInDueSoon(value);

      expect(db.insert).toHaveBeenCalledWith(settings);
      expect(valuesMock).toHaveBeenCalledWith({
        key: 'includeAutoPayInDueSoon',
        value: expectedString,
        sectionId: 'section-id',
      });
    });

    it('throws error when section not found', async () => {
      (db.select as jest.Mock).mockReturnValue(createSelectBuilderSync([]));

      await expect(
        SettingsService.setIncludeAutoPayInDueSoon(true)
      ).rejects.toThrow('View Options section not found');
    });
  });

  describe('initializeDefaults', () => {
    it('seeds default settings when database is empty', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      const returningMock = jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue({ id: 'mock-id' }),
      });
      const onConflictDoNothingMock = jest.fn().mockReturnValue({
        run: jest.fn(),
      });
      const valuesMock = jest.fn().mockReturnValue({
        returning: returningMock,
        onConflictDoNothing: onConflictDoNothingMock,
      });
      const txInsertMock = jest.fn().mockReturnValue({
        values: valuesMock,
      });

      (db.transaction as jest.Mock).mockImplementation((callback) => {
        return callback({ ...db, insert: txInsertMock });
      });

      await SettingsService.initializeDefaults();

      expect(db.transaction).toHaveBeenCalled();

      const insertCalls = (db.insert as jest.Mock).mock.calls;
      const insertResults = (db.insert as jest.Mock).mock.results;

      const totalInserts =
        DEFAULT_CATEGORIES.length + DEFAULT_SECTIONS.length + DEFAULT_SETTINGS_VALUES.length;
      expect(db.insert).toHaveBeenCalledTimes(totalInserts);

      let callIndex = 0;
      for (const cat of DEFAULT_CATEGORIES) {
        expect(insertCalls[callIndex][0]).toBe(settingsCategories);

        const builder = insertResults[callIndex].value;
        expect(builder.values).toHaveBeenCalledWith(
          expect.objectContaining({
            slug: cat.slug,
            name: cat.name,
            displayOrder: cat.displayOrder,
          })
        );
        callIndex++;
      }

      for (const section of DEFAULT_SECTIONS) {
        expect(insertCalls[callIndex][0]).toBe(settingsSections);

        const builder = insertResults[callIndex].value;
        expect(builder.values).toHaveBeenCalledWith(
          expect.objectContaining({
            slug: section.slug,
            name: section.name,
            description: section.description,
            displayOrder: section.displayOrder,
            categoryId: expect.any(String),
          })
        );
        callIndex++;
      }

      for (const setting of DEFAULT_SETTINGS_VALUES) {
        expect(insertCalls[callIndex][0]).toBe(settings);

        const builder = insertResults[callIndex].value;
        expect(builder.values).toHaveBeenCalledWith(
          expect.objectContaining({
            key: setting.key,
            value: setting.value,
            sectionId: expect.any(String),
          })
        );
        callIndex++;
      }
    });

    it('does not recreate structure when database is already populated', async () => {
      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ id: 'existing-category-id' }]),
            }),
          };
        }
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

      expect(db.transaction).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('ensureDefaultSettings', () => {
    it('inserts missing settings without overwriting existing ones', () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([
            { id: 'section-1', slug: 'behavior-options' },
            { id: 'section-2', slug: 'view-options' },
          ]),
        }),
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

      SettingsService.ensureDefaultSettings();

      expect(db.transaction).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(onConflictDoNothingMock).toHaveBeenCalled();
    });

    it('skips settings when section is not found', () => {
      mockLogger.warn.mockClear();
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([]),
        }),
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

      SettingsService.ensureDefaultSettings();

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('does not insert when values array is empty', () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([]),
        }),
      });

      SettingsService.ensureDefaultSettings();

      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
