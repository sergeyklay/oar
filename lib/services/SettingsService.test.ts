
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

    it('does not seed settings when database is already populated', async () => {
      const mockSelectBuilder = {
        from: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectBuilder);

      await SettingsService.initializeDefaults();

      expect(db.transaction).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
