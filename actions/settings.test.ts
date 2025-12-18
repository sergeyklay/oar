import { getSettingsStructure } from './settings';
import { SettingsService } from '@/lib/services/SettingsService';

jest.mock('@/lib/services/SettingsService');
jest.mock('@/db', () => ({
  db: {},
  settings: {},
  settingsCategories: {},
  settingsSections: {},
}));

describe('getSettingsStructure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success with structure data', async () => {
    const mockStructure = {
      categories: [
        {
          id: 'cat1',
          slug: 'general',
          name: 'General',
          displayOrder: 1,
          sections: [],
        },
      ],
    };

    (SettingsService.getStructure as jest.Mock).mockResolvedValue(mockStructure);

    const result = await getSettingsStructure();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStructure);
    expect(SettingsService.getStructure).toHaveBeenCalledTimes(1);
  });

  it('returns error when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Database error');

    (SettingsService.getStructure as jest.Mock).mockRejectedValue(error);

    const result = await getSettingsStructure();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to load settings structure');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch settings structure:', error);

    consoleSpy.mockRestore();
  });
});

