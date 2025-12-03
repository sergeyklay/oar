import { cn, generateSlug } from './utils';

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
