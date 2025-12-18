import { SettingsService } from './SettingsService';
import { db, settingsCategories, settingsSections } from '@/db';
import { asc } from 'drizzle-orm';
import type { AllowedRangeValue } from '@/lib/constants';

jest.mock('@/db');

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStructure', () => {
    it('returns structured settings with categories and sections', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          slug: 'general',
          name: 'General',
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      const mockSections = [
        {
          id: 'sec1',
          categoryId: 'cat1',
          slug: 'view-options',
          name: 'View Options',
          description: 'Customize display',
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockCategories),
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
            where: jest.fn().mockResolvedValue([{ count: 5 }]),
          }),
        };
      });

      const result = await SettingsService.getStructure();

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].id).toBe('cat1');
      expect(result.categories[0].sections).toHaveLength(1);
      expect(result.categories[0].sections[0].id).toBe('sec1');
      expect(result.categories[0].sections[0].settingsCount).toBe(5);
    });

    it('orders categories by displayOrder then name', async () => {
      const mockCategories = [
        {
          id: 'cat2',
          slug: 'notification',
          name: 'Notification',
          displayOrder: 2,
          createdAt: new Date(),
        },
        {
          id: 'cat1',
          slug: 'general',
          name: 'General',
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      const orderByMock = jest.fn().mockResolvedValue(mockCategories);
      const fromMock = jest.fn().mockReturnValue({
        orderBy: orderByMock,
      });

      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: fromMock,
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        };
      });

      await SettingsService.getStructure();

      expect(fromMock).toHaveBeenCalledWith(settingsCategories);
      expect(orderByMock).toHaveBeenCalledWith(
        asc(settingsCategories.displayOrder),
        asc(settingsCategories.name)
      );
    });

    it('orders sections by displayOrder then name', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          slug: 'general',
          name: 'General',
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      const mockSectionsOrdered = [
        {
          id: 'sec1',
          categoryId: 'cat1',
          slug: 'view-options',
          name: 'View Options',
          description: null,
          displayOrder: 1,
          createdAt: new Date(),
        },
        {
          id: 'sec2',
          categoryId: 'cat1',
          slug: 'behavior-options',
          name: 'Behavior Options',
          description: null,
          displayOrder: 2,
          createdAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockCategories),
            }),
          };
        }
        if (selectCallCount === 2) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue(mockSectionsOrdered),
              }),
            }),
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        };
      });

      const result = await SettingsService.getStructure();

      expect(result.categories[0].sections[0].displayOrder).toBe(1);
      expect(result.categories[0].sections[1].displayOrder).toBe(2);
    });

    it('returns zero settingsCount when no settings exist', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          slug: 'general',
          name: 'General',
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      const mockSections = [
        {
          id: 'sec1',
          categoryId: 'cat1',
          slug: 'view-options',
          name: 'View Options',
          description: null,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockCategories),
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
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        };
      });

      const result = await SettingsService.getStructure();

      expect(result.categories[0].sections[0].settingsCount).toBe(0);
    });

    it('returns empty categories array when no categories exist', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await SettingsService.getStructure();

      expect(result.categories).toHaveLength(0);
    });
  });

  describe('initializeDefaults', () => {
    it('creates default categories and sections when none exist', async () => {
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      (db.insert as jest.Mock)
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'general-id' }]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'notification-id' }]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'logging-id' }]),
          }),
        })
        .mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        });

      await SettingsService.initializeDefaults();

      expect(db.insert).toHaveBeenCalledTimes(4);
      expect(db.insert).toHaveBeenNthCalledWith(1, settingsCategories);
      expect(db.insert).toHaveBeenNthCalledWith(4, settingsSections);
    });

    it('does not create defaults when categories already exist', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: 'existing' }]),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await SettingsService.initializeDefaults();

      expect(db.insert).not.toHaveBeenCalled();
    });

    it('creates correct default categories', async () => {
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      const valuesMock = jest.fn();
      const returningMock = jest.fn().mockResolvedValue([{ id: 'cat-id' }]);
      valuesMock.mockReturnValue({ returning: returningMock });

      (db.insert as jest.Mock).mockReturnValue({
        values: valuesMock,
      });

      await SettingsService.initializeDefaults();

      expect(valuesMock).toHaveBeenCalled();
      const firstCall = valuesMock.mock.calls[0][0];
      expect(firstCall.slug).toBe('general');
      expect(firstCall.name).toBe('General');
      expect(firstCall.displayOrder).toBe(1);
    });

    it('creates correct default sections for General category', async () => {
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      const valuesMock = jest.fn();
      const returningMock = jest.fn().mockResolvedValue([{ id: 'general-id' }]);
      valuesMock.mockReturnValue({ returning: returningMock });

      (db.insert as jest.Mock).mockReturnValue({
        values: valuesMock,
      });

      await SettingsService.initializeDefaults();

      const sectionsCall = valuesMock.mock.calls[3];
      const sectionsValues = sectionsCall[0];

      expect(sectionsValues).toHaveLength(5);
      expect(sectionsValues[0].slug).toBe('view-options');
      expect(sectionsValues[0].name).toBe('View Options');
      expect(sectionsValues[0].categoryId).toBe('general-id');
    });
  });

  describe('getDueSoonRange', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns default value of 7 when setting does not exist', async () => {
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

    it('returns parsed value when setting exists', async () => {
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

    it('returns default value when setting value is invalid', async () => {
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
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid dueSoonRange value: invalid')
      );

      consoleSpy.mockRestore();
    });

    it('returns default value when setting value is not in allowed set', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ value: '99' }]),
          }),
        }),
      });

      const result = await SettingsService.getDueSoonRange();

      expect(result).toBe(7);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('returns correct value for all allowed range values', async () => {
      const allowedValues = [0, 1, 3, 5, 7, 10, 14, 20, 30];

      for (const value of allowedValues) {
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ value: String(value) }]),
            }),
          }),
        });

        const result = await SettingsService.getDueSoonRange();

        expect(result).toBe(value);
      }
    });
  });

  describe('setDueSoonRange', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('updates setting with valid days value', async () => {
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ id: 'section-id' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await SettingsService.setDueSoonRange(14);

      expect(db.insert).toHaveBeenCalled();
      const insertCall = (db.insert as jest.Mock).mock.calls[0];
      expect(insertCall[0]).toBeDefined();
      const valuesCall = (db.insert as jest.Mock).mock.results[0].value.values.mock.calls[0][0];
      expect(valuesCall.key).toBe('dueSoonRange');
      expect(valuesCall.value).toBe('14');
      expect(valuesCall.sectionId).toBe('section-id');
    });

    it('throws error for invalid days value', async () => {
      await expect(SettingsService.setDueSoonRange(99 as AllowedRangeValue)).rejects.toThrow(
        'Invalid days value: 99'
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('throws error when behavior options section not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(SettingsService.setDueSoonRange(7)).rejects.toThrow(
        'Behavior Options section not found'
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('accepts all valid range values', async () => {
      const validValues: AllowedRangeValue[] = [0, 1, 3, 5, 7, 10, 14, 20, 30];

      for (const value of validValues) {
        jest.clearAllMocks();
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ id: 'section-id' }]),
            }),
          }),
        });

        const valuesMock = jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        });
        (db.insert as jest.Mock).mockReturnValue({
          values: valuesMock,
        });

        await SettingsService.setDueSoonRange(value);

        const valuesCall = valuesMock.mock.calls[0][0];
        expect(valuesCall.value).toBe(String(value));
      }
    });
  });
});

