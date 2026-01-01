import { resolve } from 'path';
import { cn, generateSlug, clampToEndOfMonth, resolveDatabasePath } from './utils';
import { DEFAULT_DATABASE_PATH } from './constants';

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-2 py-1', 'py-2')).toBe('px-2 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('text-red-500', true && 'text-blue-500')).toBe('text-blue-500');
    expect(cn('text-red-500', false && 'text-blue-500')).toBe('text-red-500');
  });

  it('handles undefined and null values', () => {
    expect(cn('px-2', undefined, null, 'py-2')).toBe('px-2 py-2');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('generateSlug', () => {
  it('converts basic strings to slugs', () => {
    expect(generateSlug('Business Expenses')).toBe('business-expenses');
    expect(generateSlug('My Credit Card')).toBe('my-credit-card');
  });

  it('removes special characters', () => {
    expect(generateSlug('My Credit Card!')).toBe('my-credit-card');
    expect(generateSlug('Hello@World#Test')).toBe('helloworldtest');
    expect(generateSlug('Price: $100')).toBe('price-100');
  });

  it('handles polish diacritics', () => {
    expect(generateSlug('żółw')).toBe('w');
    expect(generateSlug('Żółta łódź')).toBe('ta-d');
    expect(generateSlug('ąęćżźń')).toBe('');
  });

  it('handles multiple spaces and dashes', () => {
    expect(generateSlug('hello   world')).toBe('hello-world');
    expect(generateSlug('hello---world')).toBe('hello-world');
    expect(generateSlug('hello - world')).toBe('hello-world');
  });

  it('handles underscores', () => {
    expect(generateSlug('hello_world')).toBe('hello-world');
    expect(generateSlug('hello__world')).toBe('hello-world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('-hello-world-')).toBe('hello-world');
    expect(generateSlug('---hello---')).toBe('hello');
  });

  it('handles empty and whitespace-only strings', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(generateSlug('!@#$%')).toBe('');
  });

  it('converts to lowercase', () => {
    expect(generateSlug('HELLO WORLD')).toBe('hello-world');
    expect(generateSlug('HeLLo WoRLD')).toBe('hello-world');
  });

  it('handles mixed content', () => {
    expect(generateSlug('Test 123 Value!')).toBe('test-123-value');
    expect(generateSlug('2024 Budget')).toBe('2024-budget');
  });
});

describe('clampToEndOfMonth', () => {
  it('clamps 31st to last day of February in non-leap year', () => {
    const targetMonth = new Date(2025, 1, 1);
    const originalTime = new Date(2025, 0, 31, 14, 30, 45, 123);

    const result = clampToEndOfMonth(targetMonth, 31, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(45);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('clamps 31st to last day of February in leap year', () => {
    const targetMonth = new Date(2024, 1, 1);
    const originalTime = new Date(2024, 0, 31, 10, 15, 30, 500);

    const result = clampToEndOfMonth(targetMonth, 31, originalTime);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(15);
    expect(result.getSeconds()).toBe(30);
    expect(result.getMilliseconds()).toBe(500);
  });

  it('clamps 31st to 30th in 30-day months', () => {
    const targetMonth = new Date(2025, 3, 1);
    const originalTime = new Date(2025, 0, 31, 9, 0, 0, 0);

    const result = clampToEndOfMonth(targetMonth, 31, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(30);
    expect(result.getHours()).toBe(9);
  });

  it('preserves original day when target month has enough days', () => {
    const targetMonth = new Date(2025, 2, 1);
    const originalTime = new Date(2025, 0, 31, 12, 30, 0, 0);

    const result = clampToEndOfMonth(targetMonth, 31, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(31);
    expect(result.getHours()).toBe(12);
    expect(result.getMinutes()).toBe(30);
  });

  it('clamps 30th to 28th in February non-leap year', () => {
    const targetMonth = new Date(2025, 1, 1);
    const originalTime = new Date(2025, 0, 30, 8, 45, 20, 100);

    const result = clampToEndOfMonth(targetMonth, 30, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(45);
    expect(result.getSeconds()).toBe(20);
    expect(result.getMilliseconds()).toBe(100);
  });

  it('clamps 30th to 29th in February leap year', () => {
    const targetMonth = new Date(2024, 1, 1);
    const originalTime = new Date(2024, 0, 30, 16, 20, 10, 250);

    const result = clampToEndOfMonth(targetMonth, 30, originalTime);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
    expect(result.getHours()).toBe(16);
  });

  it('preserves 30th in 30-day months', () => {
    const targetMonth = new Date(2025, 3, 1);
    const originalTime = new Date(2025, 0, 30, 11, 0, 0, 0);

    const result = clampToEndOfMonth(targetMonth, 30, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(30);
  });

  it('clamps 29th to 28th in February non-leap year', () => {
    const targetMonth = new Date(2025, 1, 1);
    const originalTime = new Date(2025, 0, 29, 13, 15, 5, 75);

    const result = clampToEndOfMonth(targetMonth, 29, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
    expect(result.getHours()).toBe(13);
  });

  it('preserves 29th in February leap year', () => {
    const targetMonth = new Date(2024, 1, 1);
    const originalTime = new Date(2024, 0, 29, 7, 30, 45, 999);

    const result = clampToEndOfMonth(targetMonth, 29, originalTime);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('preserves days that exist in all months', () => {
    const targetMonth = new Date(2025, 1, 1);
    const originalTime = new Date(2025, 0, 15, 14, 30, 0, 0);

    const result = clampToEndOfMonth(targetMonth, 15, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(15);
  });

  it('handles first day of month', () => {
    const targetMonth = new Date(2025, 1, 1);
    const originalTime = new Date(2025, 0, 1, 0, 0, 0, 0);

    const result = clampToEndOfMonth(targetMonth, 1, originalTime);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });

  it('preserves time components across different months', () => {
    const targetMonth = new Date(2025, 5, 1);
    const originalTime = new Date(2025, 0, 31, 23, 59, 59, 999);

    const result = clampToEndOfMonth(targetMonth, 31, originalTime);

    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  describe.each([
    { month: 3, name: 'April' },
    { month: 5, name: 'June' },
    { month: 8, name: 'September' },
    { month: 10, name: 'November' },
  ])('30-day month: $name', ({ month }) => {
    it('clamps 31st to 30th', () => {
      const targetMonth = new Date(2025, month, 1);
      const originalTime = new Date(2025, 0, 31, 12, 0, 0, 0);

      const result = clampToEndOfMonth(targetMonth, 31, originalTime);

      expect(result.getMonth()).toBe(month);
      expect(result.getDate()).toBe(30);
    });
  });

  it('handles all 31-day months correctly', () => {
    const months31Days = [0, 2, 4, 6, 7, 9, 11];

    months31Days.forEach((month) => {
      const targetMonth = new Date(2025, month, 1);
      const originalTime = new Date(2025, 0, 31, 12, 0, 0, 0);

      const result = clampToEndOfMonth(targetMonth, 31, originalTime);

      expect(result.getMonth()).toBe(month);
      expect(result.getDate()).toBe(31);
    });
  });
});

describe('resolveDatabasePath', () => {
  const originalEnv = process.env.DATABASE_URL;
  const originalCwd = process.cwd;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    process.cwd = jest.fn(() => '/home/user/project');
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    process.cwd = originalCwd;
  });

  it('returns absolute path when DATABASE_URL is set to absolute path', () => {
    process.env.DATABASE_URL = '/absolute/path/to/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/absolute/path/to/db.sqlite');
  });

  it('resolves relative path when DATABASE_URL is set to relative path', () => {
    process.env.DATABASE_URL = './data/custom.db';

    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', './data/custom.db'));
  });

  it('strips file: protocol from absolute path', () => {
    process.env.DATABASE_URL = 'file:/absolute/path/to/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/absolute/path/to/db.sqlite');
  });

  it('strips file: protocol from relative path without resolving it', () => {
    process.env.DATABASE_URL = 'file:./data/custom.db';

    const result = resolveDatabasePath();

    expect(result).toBe('./data/custom.db');
  });

  it('returns :memory: unchanged when DATABASE_URL is set to :memory:', () => {
    process.env.DATABASE_URL = ':memory:';

    const result = resolveDatabasePath();

    expect(result).toBe(':memory:');
  });

  it('returns :memory: when DATABASE_URL is not set but :memory: is used', () => {
    const result = resolveDatabasePath(':memory:');

    expect(result).toBe(':memory:');
  });

  it('uses DEFAULT_DATABASE_PATH when DATABASE_URL is not set', () => {
    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', DEFAULT_DATABASE_PATH));
  });

  it('handles nested relative paths correctly', () => {
    process.env.DATABASE_URL = '../../other-project/data.db';

    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', '../../other-project/data.db'));
  });

  it('handles file: protocol with absolute Windows path', () => {
    process.env.DATABASE_URL = 'file:C:\\Users\\test\\db.sqlite';
    process.cwd = jest.fn(() => 'C:\\Users\\test');

    const result = resolveDatabasePath();

    expect(result).toBe('C:\\Users\\test\\db.sqlite');
  });

  it('strips file: protocol from parent-relative path without resolving it', () => {
    process.env.DATABASE_URL = 'file:../data/test.db';

    const result = resolveDatabasePath();

    expect(result).toBe('../data/test.db');
  });

  it('preserves absolute path with file: protocol when path is already absolute', () => {
    process.env.DATABASE_URL = 'file:/usr/local/data/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/usr/local/data/db.sqlite');
  });
});
