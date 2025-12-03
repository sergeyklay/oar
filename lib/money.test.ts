import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  getCurrencySymbol,
  isValidMoneyInput,
  parseMoneyInput,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from './money';

describe('toMinorUnits', () => {
  it('converts decimal number to minor units', () => {
    expect(toMinorUnits(10.5, 'PLN')).toBe(1050);
    expect(toMinorUnits(49.99, 'USD')).toBe(4999);
    expect(toMinorUnits(100, 'EUR')).toBe(10000);
  });

  it('converts string amount to minor units', () => {
    expect(toMinorUnits('10.50', 'PLN')).toBe(1050);
    expect(toMinorUnits('49.99', 'USD')).toBe(4999);
  });

  it('rounds correctly for amounts with extra precision', () => {
    expect(toMinorUnits(10.505, 'PLN')).toBe(1051); // rounds up
    expect(toMinorUnits(10.504, 'PLN')).toBe(1050); // rounds down
    expect(toMinorUnits(10.5049, 'PLN')).toBe(1050);
    expect(toMinorUnits(10.5051, 'PLN')).toBe(1051);
  });

  it('handles zero-decimal currencies (JPY)', () => {
    expect(toMinorUnits(100, 'JPY')).toBe(100);
    expect(toMinorUnits(100.4, 'JPY')).toBe(100);
    expect(toMinorUnits(100.5, 'JPY')).toBe(101);
  });

  it('uses default currency when not specified', () => {
    expect(toMinorUnits(10.5)).toBe(1050);
  });

  it('throws error for unsupported currency', () => {
    expect(() => toMinorUnits(100, 'XYZ')).toThrow('Unsupported currency: XYZ');
  });

  it('throws error for invalid amount', () => {
    expect(() => toMinorUnits('abc', 'PLN')).toThrow('Invalid amount: abc');
    expect(() => toMinorUnits(NaN, 'PLN')).toThrow('Invalid amount: NaN');
  });
});

describe('toMajorUnits', () => {
  it('converts minor units to major units', () => {
    expect(toMajorUnits(1050, 'PLN')).toBe(10.5);
    expect(toMajorUnits(4999, 'USD')).toBe(49.99);
    expect(toMajorUnits(10000, 'EUR')).toBe(100);
  });

  it('handles zero-decimal currencies (JPY)', () => {
    expect(toMajorUnits(100, 'JPY')).toBe(100);
  });

  it('uses default currency when not specified', () => {
    expect(toMajorUnits(1050)).toBe(10.5);
  });

  it('throws error for unsupported currency', () => {
    expect(() => toMajorUnits(100, 'XYZ')).toThrow('Unsupported currency: XYZ');
  });
});

describe('formatMoney', () => {
  it('formats PLN with Polish locale', () => {
    const result = formatMoney(4999, 'PLN', 'pl-PL');
    expect(result).toMatch(/49[,.]99/);
    expect(result).toMatch(/zł|PLN/);
  });

  it('formats USD with US locale', () => {
    const result = formatMoney(4999, 'USD', 'en-US');
    expect(result).toContain('$');
    expect(result).toMatch(/49\.99/);
  });

  it('formats JPY without decimals', () => {
    const result = formatMoney(100, 'JPY', 'ja-JP');
    expect(result).toMatch(/¥|￥|JPY/); // Half-width or full-width Yen sign
    expect(result).toMatch(/100/);
  });
});

describe('getCurrencySymbol', () => {
  it('returns correct symbols for known currencies', () => {
    expect(getCurrencySymbol('PLN')).toBe('zł');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('GBP')).toBe('£');
    expect(getCurrencySymbol('JPY')).toBe('¥');
  });

  it('returns currency code as fallback for unknown currencies', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });

  it('uses default currency when not specified', () => {
    expect(getCurrencySymbol()).toBe('zł');
  });
});

describe('isValidMoneyInput', () => {
  it('returns true for valid positive amounts', () => {
    expect(isValidMoneyInput('49.99')).toBe(true);
    expect(isValidMoneyInput('100')).toBe(true);
    expect(isValidMoneyInput('0')).toBe(true);
    expect(isValidMoneyInput('0.01')).toBe(true);
  });

  it('handles comma decimal separator', () => {
    expect(isValidMoneyInput('49,99')).toBe(true);
  });

  it('returns false for negative amounts', () => {
    expect(isValidMoneyInput('-10')).toBe(false);
    expect(isValidMoneyInput('-0.01')).toBe(false);
  });

  it('returns false for non-numeric input', () => {
    expect(isValidMoneyInput('abc')).toBe(false);
    expect(isValidMoneyInput('')).toBe(false);
    expect(isValidMoneyInput('$100')).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isValidMoneyInput('Infinity')).toBe(false);
  });
});

describe('parseMoneyInput', () => {
  it('normalizes comma decimal separator to dot', () => {
    expect(parseMoneyInput('49,99')).toBe('49.99');
  });

  it('removes whitespace thousand separators', () => {
    expect(parseMoneyInput('1 000')).toBe('1000');
    expect(parseMoneyInput('1 000 000')).toBe('1000000');
  });

  it('removes non-breaking spaces', () => {
    expect(parseMoneyInput('1\u00A0000')).toBe('1000');
  });

  it('preserves valid decimal numbers', () => {
    expect(parseMoneyInput('49.99')).toBe('49.99');
    expect(parseMoneyInput('100')).toBe('100');
  });
});

describe('CURRENCIES config', () => {
  it('contains expected currencies', () => {
    expect(Object.keys(CURRENCIES)).toEqual(['PLN', 'USD', 'EUR', 'GBP', 'JPY']);
  });

  it('has correct minor units for each currency', () => {
    expect(CURRENCIES.PLN.minorUnits).toBe(2);
    expect(CURRENCIES.USD.minorUnits).toBe(2);
    expect(CURRENCIES.JPY.minorUnits).toBe(0);
  });
});

describe('DEFAULT_CURRENCY', () => {
  it('is set to PLN', () => {
    expect(DEFAULT_CURRENCY).toBe('PLN');
  });
});
