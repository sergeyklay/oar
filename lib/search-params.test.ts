jest.mock('nuqs/server', () => ({
  createParser: jest.fn((parser) => ({
    ...parser,
    withDefault: jest.fn((defaultValue) => ({
      ...parser,
      defaultValue,
    })),
    withOptions: jest.fn((options) => ({
      ...parser,
      ...options,
    })),
  })),
  createSearchParamsCache: jest.fn(() => ({
    parse: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
  })),
  parseAsString: {
    withDefault: jest.fn(),
  },
}));

import { parseAsMonth } from './search-params';

describe('parseAsMonth', () => {
  describe('parse', () => {
    it('accepts valid month strings', () => {
      expect(parseAsMonth.parse('2026-01')).toBe('2026-01');
      expect(parseAsMonth.parse('2026-12')).toBe('2026-12');
      expect(parseAsMonth.parse('2024-02')).toBe('2024-02');
      expect(parseAsMonth.parse('2030-06')).toBe('2030-06');
    });

    it('rejects non-string values', () => {
      expect(parseAsMonth.parse(null as unknown as string)).toBeNull();
      expect(parseAsMonth.parse(undefined as unknown as string)).toBeNull();
      expect(parseAsMonth.parse(123 as unknown as string)).toBeNull();
      expect(parseAsMonth.parse({} as unknown as string)).toBeNull();
      expect(parseAsMonth.parse([] as unknown as string)).toBeNull();
    });

    it('rejects invalid format patterns', () => {
      expect(parseAsMonth.parse('garbage')).toBeNull();
      expect(parseAsMonth.parse('2026-1')).toBeNull();
      expect(parseAsMonth.parse('2026-001')).toBeNull();
      expect(parseAsMonth.parse('26-01')).toBeNull();
      expect(parseAsMonth.parse('202601')).toBeNull();
      expect(parseAsMonth.parse('2026/01')).toBeNull();
      expect(parseAsMonth.parse('01-2026')).toBeNull();
      expect(parseAsMonth.parse('2026-1-1')).toBeNull();
    });

    it('rejects invalid month numbers', () => {
      expect(parseAsMonth.parse('2026-00')).toBeNull();
      expect(parseAsMonth.parse('2026-13')).toBeNull();
      expect(parseAsMonth.parse('2026-99')).toBeNull();
    });

    it('rejects invalid dates', () => {
      expect(parseAsMonth.parse('2026-02-31')).toBeNull();
    });

    it('accepts edge case valid months', () => {
      expect(parseAsMonth.parse('2000-01')).toBe('2000-01');
      expect(parseAsMonth.parse('2099-12')).toBe('2099-12');
      expect(parseAsMonth.parse('1900-01')).toBe('1900-01');
    });

    it('rejects empty string', () => {
      expect(parseAsMonth.parse('')).toBeNull();
    });

    it('rejects strings with whitespace', () => {
      expect(parseAsMonth.parse(' 2026-01')).toBeNull();
      expect(parseAsMonth.parse('2026-01 ')).toBeNull();
      expect(parseAsMonth.parse('2026- 01')).toBeNull();
      expect(parseAsMonth.parse('2026 -01')).toBeNull();
    });
  });

  describe('serialize', () => {
    it('returns the string value as-is', () => {
      expect(parseAsMonth.serialize('2026-01')).toBe('2026-01');
      expect(parseAsMonth.serialize('2024-12')).toBe('2024-12');
      expect(parseAsMonth.serialize('2030-06')).toBe('2030-06');
    });
  });
});

