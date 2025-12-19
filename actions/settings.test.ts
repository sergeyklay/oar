import { getSettingsStructure, updateDueSoonRange, updatePaidRecentlyRange } from './settings';
import { SettingsService } from '@/lib/services/SettingsService';
import { revalidatePath } from 'next/cache';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
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

describe('updateDueSoonRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates range setting successfully', async () => {
    (SettingsService.setDueSoonRange as jest.Mock).mockResolvedValue(undefined);

    const result = await updateDueSoonRange({ range: '7' });

    expect(result.success).toBe(true);
    expect(SettingsService.setDueSoonRange).toHaveBeenCalledWith(7);
    expect(revalidatePath).toHaveBeenCalledWith('/due-soon');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('converts string range to number', async () => {
    (SettingsService.setDueSoonRange as jest.Mock).mockResolvedValue(undefined);

    await updateDueSoonRange({ range: '14' });

    expect(SettingsService.setDueSoonRange).toHaveBeenCalledWith(14);
  });

  it('returns validation error for invalid range value', async () => {
    const result = await updateDueSoonRange({ range: '99' as '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors).toBeDefined();
    expect(SettingsService.setDueSoonRange).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('returns validation error for non-enum range value', async () => {
    const result = await updateDueSoonRange({ range: 'invalid' as '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors).toBeDefined();
  });

  it('returns error when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Database error');
    (SettingsService.setDueSoonRange as jest.Mock).mockRejectedValue(error);

    const result = await updateDueSoonRange({ range: '7' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update setting');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to update due soon range:', error);

    consoleSpy.mockRestore();
  });

  it('accepts all valid range values', async () => {
    (SettingsService.setDueSoonRange as jest.Mock).mockResolvedValue(undefined);

    const validRanges = ['0', '1', '3', '5', '7', '10', '14', '20', '30'];

    for (const range of validRanges) {
      await updateDueSoonRange({ range: range as '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30' });
      expect(SettingsService.setDueSoonRange).toHaveBeenCalledWith(parseInt(range, 10));
    }
  });
});

describe('updatePaidRecentlyRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates range setting successfully', async () => {
    (SettingsService.setPaidRecentlyRange as jest.Mock).mockResolvedValue(undefined);

    const result = await updatePaidRecentlyRange({ range: '7' });

    expect(result.success).toBe(true);
    expect(SettingsService.setPaidRecentlyRange).toHaveBeenCalledWith(7);
    expect(revalidatePath).toHaveBeenCalledWith('/paid-recently');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('converts string range to number', async () => {
    (SettingsService.setPaidRecentlyRange as jest.Mock).mockResolvedValue(undefined);

    await updatePaidRecentlyRange({ range: '14' });

    expect(SettingsService.setPaidRecentlyRange).toHaveBeenCalledWith(14);
  });

  it('returns validation error for invalid range value', async () => {
    type RangeKey = '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30';
    const result = await updatePaidRecentlyRange({ range: '99' as RangeKey });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors).toBeDefined();
    expect(SettingsService.setPaidRecentlyRange).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('returns validation error for non-enum range value', async () => {
    type RangeKey = '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30';
    const result = await updatePaidRecentlyRange({ range: 'invalid' as RangeKey });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors).toBeDefined();
  });

  it('returns error when service throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Database error');
    (SettingsService.setPaidRecentlyRange as jest.Mock).mockRejectedValue(error);

    const result = await updatePaidRecentlyRange({ range: '7' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update setting');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to update paid recently range:', error);

    consoleSpy.mockRestore();
  });

  it('accepts all valid range values', async () => {
    (SettingsService.setPaidRecentlyRange as jest.Mock).mockResolvedValue(undefined);

    const validRanges = ['0', '1', '3', '5', '7', '10', '14', '20', '30'];

    for (const range of validRanges) {
      type RangeKey = '0' | '1' | '3' | '5' | '7' | '10' | '14' | '20' | '30';
      await updatePaidRecentlyRange({ range: range as RangeKey });
      expect(SettingsService.setPaidRecentlyRange).toHaveBeenCalledWith(parseInt(range, 10));
    }
  });
});

