import {
  cn,
  generateSlug,
  clampToEndOfMonth,
  calculateMonthBoundaries,
  calculateExtendedQueryBoundaries,
  calculateFilterBoundaries,
  isTimestampInMonth,
} from './utils';

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

describe('calculateMonthBoundaries', () => {
  it('calculates boundaries for mid-year month', () => {
    const result = calculateMonthBoundaries(2026, 6);

    expect(result.prevMonth).toBe(5);
    expect(result.prevMonthYear).toBe(2026);
    expect(result.nextMonth).toBe(7);
    expect(result.nextMonthYear).toBe(2026);
    expect(result.lastDayOfPrevMonth).toBe(31);
  });

  it('wraps January to previous year December', () => {
    const result = calculateMonthBoundaries(2026, 1);

    expect(result.prevMonth).toBe(12);
    expect(result.prevMonthYear).toBe(2025);
    expect(result.nextMonth).toBe(2);
    expect(result.nextMonthYear).toBe(2026);
    expect(result.lastDayOfPrevMonth).toBe(31);
  });

  it('wraps December to next year January', () => {
    const result = calculateMonthBoundaries(2025, 12);

    expect(result.prevMonth).toBe(11);
    expect(result.prevMonthYear).toBe(2025);
    expect(result.nextMonth).toBe(1);
    expect(result.nextMonthYear).toBe(2026);
    expect(result.lastDayOfPrevMonth).toBe(30);
  });

  it('handles leap year February correctly', () => {
    const result = calculateMonthBoundaries(2024, 3);

    expect(result.lastDayOfPrevMonth).toBe(29);
  });
});

describe('calculateExtendedQueryBoundaries', () => {
  it('calculates query boundaries for mid-year month', () => {
    const boundaries = calculateMonthBoundaries(2026, 6);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2026-05-31T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2026-07-01T11:59:59.999Z');
  });

  it('calculates query boundaries for January with year boundary', () => {
    const boundaries = calculateMonthBoundaries(2026, 1);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2025-12-31T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2026-02-01T11:59:59.999Z');
  });

  it('calculates query boundaries for December with year boundary', () => {
    const boundaries = calculateMonthBoundaries(2025, 12);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2025-11-30T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2026-01-01T11:59:59.999Z');
  });

  it('handles February in non-leap year', () => {
    const boundaries = calculateMonthBoundaries(2025, 2);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2025-01-31T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2025-03-01T11:59:59.999Z');
  });

  it('handles February in leap year', () => {
    const boundaries = calculateMonthBoundaries(2024, 2);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2024-01-31T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2024-03-01T11:59:59.999Z');
  });

  it('handles March following leap year February', () => {
    const boundaries = calculateMonthBoundaries(2024, 3);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2024-02-29T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2024-04-01T11:59:59.999Z');
  });

  it('handles March following non-leap year February', () => {
    const boundaries = calculateMonthBoundaries(2025, 3);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2025-02-28T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2025-04-01T11:59:59.999Z');
  });

  describe.each([
    { month: 4, name: 'April', prevLastDay: 31 },
    { month: 6, name: 'June', prevLastDay: 31 },
    { month: 9, name: 'September', prevLastDay: 31 },
    { month: 11, name: 'November', prevLastDay: 31 },
  ])('30-day month: $name', ({ month, prevLastDay }) => {
    it('uses correct last day of previous month', () => {
      const boundaries = calculateMonthBoundaries(2025, month);
      const result = calculateExtendedQueryBoundaries(boundaries);

      const expectedStart = new Date(
        Date.UTC(2025, month - 2, prevLastDay, 10, 0, 0, 0)
      );
      expect(result.queryStart.getTime()).toBe(expectedStart.getTime());
    });
  });

  describe.each([
    { month: 1, name: 'January' },
    { month: 3, name: 'March' },
    { month: 5, name: 'May' },
    { month: 7, name: 'July' },
    { month: 8, name: 'August' },
    { month: 10, name: 'October' },
    { month: 12, name: 'December' },
  ])('31-day month: $name', ({ month }) => {
    it('handles correct query boundaries', () => {
      const boundaries = calculateMonthBoundaries(2025, month);
      const result = calculateExtendedQueryBoundaries(boundaries);

      expect(result.queryStart).toBeInstanceOf(Date);
      expect(result.queryEnd).toBeInstanceOf(Date);
      expect(result.queryStart.getTime()).toBeLessThan(result.queryEnd.getTime());
    });
  });

  it('uses exact time 10:00:00.000 UTC for query start', () => {
    const boundaries = calculateMonthBoundaries(2026, 6);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.getUTCHours()).toBe(10);
    expect(result.queryStart.getUTCMinutes()).toBe(0);
    expect(result.queryStart.getUTCSeconds()).toBe(0);
    expect(result.queryStart.getUTCMilliseconds()).toBe(0);
  });

  it('uses exact time 11:59:59.999 UTC for query end', () => {
    const boundaries = calculateMonthBoundaries(2026, 6);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryEnd.getUTCHours()).toBe(11);
    expect(result.queryEnd.getUTCMinutes()).toBe(59);
    expect(result.queryEnd.getUTCSeconds()).toBe(59);
    expect(result.queryEnd.getUTCMilliseconds()).toBe(999);
  });

  it('returns Date objects not timestamps', () => {
    const boundaries = calculateMonthBoundaries(2026, 6);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart).toBeInstanceOf(Date);
    expect(result.queryEnd).toBeInstanceOf(Date);
  });

  it('ensures query start is before query end', () => {
    const boundaries = calculateMonthBoundaries(2026, 6);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.getTime()).toBeLessThan(result.queryEnd.getTime());
  });

  it('handles year 2100 correctly', () => {
    const boundaries = calculateMonthBoundaries(2100, 6);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('2100-05-31T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2100-07-01T11:59:59.999Z');
  });

  it('handles edge case year 2000 correctly', () => {
    const boundaries = calculateMonthBoundaries(2000, 1);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryStart.toISOString()).toBe('1999-12-31T10:00:00.000Z');
    expect(result.queryEnd.toISOString()).toBe('2000-02-01T11:59:59.999Z');
  });

  it('formats month with leading zero for single digit months', () => {
    const boundaries = calculateMonthBoundaries(2026, 1);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryEnd.toISOString()).toContain('2026-02-01');
  });

  it('formats day with leading zero when needed', () => {
    const boundaries = calculateMonthBoundaries(2026, 2);
    const result = calculateExtendedQueryBoundaries(boundaries);

    expect(result.queryEnd.toISOString()).toContain('2026-03-01');
  });
});

describe('calculateFilterBoundaries', () => {
  it('calculates January 2026 filter boundaries', () => {
    const boundaries = calculateMonthBoundaries(2026, 1);
    const result = calculateFilterBoundaries(2026, 1, boundaries);

    expect(result.filterStartUTC).toBe(Date.UTC(2025, 11, 31, 22, 0, 0, 0));
    expect(result.filterEndUTC).toBe(Date.UTC(2026, 0, 31, 21, 59, 59, 999));
  });

  it('calculates February 2026 filter boundaries', () => {
    const boundaries = calculateMonthBoundaries(2026, 2);
    const result = calculateFilterBoundaries(2026, 2, boundaries);

    expect(result.filterStartUTC).toBe(Date.UTC(2026, 0, 31, 22, 0, 0, 0));
    expect(result.filterEndUTC).toBe(Date.UTC(2026, 1, 28, 21, 59, 59, 999));
  });
});

describe('isTimestampInMonth', () => {
  const januaryBoundaries = calculateMonthBoundaries(2026, 1);
  const januaryFilterBoundaries = calculateFilterBoundaries(2026, 1, januaryBoundaries);

  describe('regression: timezone boundary bug fix', () => {
    it('excludes Feb 1 00:00 UTC+1 (stored as Jan 31 23:00 UTC) from January', () => {
      const feb1MidnightPoland = Date.UTC(2026, 0, 31, 23, 0, 0, 0);

      expect(isTimestampInMonth(feb1MidnightPoland, januaryFilterBoundaries)).toBe(false);
    });

    it('excludes Feb 1 00:00 UTC+2 (stored as Jan 31 22:00 UTC) from January', () => {
      const feb1MidnightWarsaw = Date.UTC(2026, 0, 31, 22, 0, 0, 0);

      expect(isTimestampInMonth(feb1MidnightWarsaw, januaryFilterBoundaries)).toBe(false);
    });

    it('includes Jan 31 23:59 UTC+2 (stored as Jan 31 21:59 UTC) in January', () => {
      const jan31LastSecondWarsaw = Date.UTC(2026, 0, 31, 21, 59, 59, 999);

      expect(isTimestampInMonth(jan31LastSecondWarsaw, januaryFilterBoundaries)).toBe(true);
    });
  });

  it('includes timestamps clearly within the month', () => {
    const jan15Noon = Date.UTC(2026, 0, 15, 12, 0, 0, 0);

    expect(isTimestampInMonth(jan15Noon, januaryFilterBoundaries)).toBe(true);
  });

  it('includes Jan 1 00:00 UTC+1 (stored as Dec 31 23:00 UTC) in January', () => {
    const jan1MidnightPoland = Date.UTC(2025, 11, 31, 23, 0, 0, 0);

    expect(isTimestampInMonth(jan1MidnightPoland, januaryFilterBoundaries)).toBe(true);
  });

  it('excludes Dec 31 23:59 UTC+1 (stored as Dec 31 22:59 UTC) from January', () => {
    const dec31NightPoland = Date.UTC(2025, 11, 31, 21, 59, 59, 999);

    expect(isTimestampInMonth(dec31NightPoland, januaryFilterBoundaries)).toBe(false);
  });

  it('accepts Date objects as input', () => {
    const dateObj = new Date(Date.UTC(2026, 0, 15, 12, 0, 0, 0));

    expect(isTimestampInMonth(dateObj, januaryFilterBoundaries)).toBe(true);
  });
});
