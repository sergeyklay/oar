import { cn, generateSlug, clampToEndOfMonth } from './utils';

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

  it('handles all 30-day months correctly', () => {
    const months30Days = [3, 5, 8, 10];

    months30Days.forEach((month) => {
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
