import { SettingsService } from './SettingsService';
import { db, settingsCategories, settingsSections } from '@/db';
import { asc } from 'drizzle-orm';

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
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

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
        }),
      });

      await SettingsService.initializeDefaults();

      expect(db.insert).not.toHaveBeenCalled();
    });

    it('creates correct default categories', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

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
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

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
});

