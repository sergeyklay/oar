/**
 * ISO 4217 currency configuration.
 */
export interface CurrencyConfig {
  /** ISO 4217 currency code */
  code: string;
  /** Number of decimal places (e.g., 2 for PLN, 0 for JPY) */
  minorUnits: number;
  /** Display symbol */
  symbol: string;
}

/** Supported currency configurations */
export const CURRENCIES: Record<string, CurrencyConfig> = {
  PLN: { code: 'PLN', minorUnits: 2, symbol: 'zł' },
  USD: { code: 'USD', minorUnits: 2, symbol: '$' },
  EUR: { code: 'EUR', minorUnits: 2, symbol: '€' },
  GBP: { code: 'GBP', minorUnits: 2, symbol: '£' },
  JPY: { code: 'JPY', minorUnits: 0, symbol: '¥' },
} as const;

/** Default currency code */
export const DEFAULT_CURRENCY = 'PLN';

/** Default locale for formatting */
export const DEFAULT_LOCALE = 'pl-PL';

/**
 * Converts a decimal amount to minor units (e.g., cents).
 *
 * @param amount - Decimal amount as string or number
 * @param currencyCode - ISO 4217 currency code
 * @returns Amount in minor units as integer
 * @throws Error if currency is unsupported or amount is invalid
 *
 * @example
 * toMinorUnits('49.99', 'PLN') // 4999
 * toMinorUnits(100, 'JPY')     // 100
 */
export function toMinorUnits(
  amount: string | number,
  currencyCode: string = DEFAULT_CURRENCY
): number {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    throw new Error(`Unsupported currency: ${currencyCode}`);
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const multiplier = Math.pow(10, currency.minorUnits);
  return Math.round(numericAmount * multiplier);
}

/**
 * Converts minor units to major units for display.
 *
 * @param minorAmount - Amount in minor units
 * @param currencyCode - ISO 4217 currency code
 * @returns Amount in major units
 * @throws Error if currency is unsupported
 *
 * @example
 * toMajorUnits(4999, 'PLN') // 49.99
 */
export function toMajorUnits(
  minorAmount: number,
  currencyCode: string = DEFAULT_CURRENCY
): number {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    throw new Error(`Unsupported currency: ${currencyCode}`);
  }

  const divisor = Math.pow(10, currency.minorUnits);
  return minorAmount / divisor;
}

/**
 * Formats a minor unit amount as a localized currency string.
 *
 * @param minorAmount - Amount in minor units
 * @param currencyCode - ISO 4217 currency code
 * @param locale - BCP 47 locale identifier
 * @returns Formatted currency string
 *
 * @example
 * formatMoney(4999, 'PLN', 'pl-PL') // "49,99 zł"
 * formatMoney(4999, 'USD', 'en-US') // "$49.99"
 */
export function formatMoney(
  minorAmount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  const majorAmount = toMajorUnits(minorAmount, currencyCode);
  const currency = CURRENCIES[currencyCode];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency?.minorUnits ?? 2,
    maximumFractionDigits: currency?.minorUnits ?? 2,
  }).format(majorAmount);
}

/**
 * Returns the display symbol for a currency.
 *
 * @param currencyCode - ISO 4217 currency code
 * @returns Currency symbol or code as fallback
 *
 * @example
 * getCurrencySymbol('PLN') // "zł"
 */
export function getCurrencySymbol(
  currencyCode: string = DEFAULT_CURRENCY
): string {
  return CURRENCIES[currencyCode]?.symbol ?? currencyCode;
}

/**
 * Validates whether a string represents a valid non-negative monetary amount.
 *
 * @param input - User input string
 * @returns True if valid monetary value
 *
 * @example
 * isValidMoneyInput('49.99')  // true
 * isValidMoneyInput('49,99')  // true
 * isValidMoneyInput('-10')    // false
 */
export function isValidMoneyInput(input: string): boolean {
  const normalized = input.replace(',', '.');
  const num = parseFloat(normalized);
  return !isNaN(num) && num >= 0 && isFinite(num);
}

/**
 * Normalizes locale-formatted monetary input to a standard decimal string.
 * Handles comma decimal separators and removes thousand separators.
 *
 * @param input - User input string
 * @returns Normalized decimal string
 *
 * @example
 * parseMoneyInput('49,99')  // '49.99'
 * parseMoneyInput('1 000')  // '1000'
 */
export function parseMoneyInput(input: string): string {
  let cleaned = input.replace(/[\s\u00A0]/g, '');

  if (/,\d{1,2}$/.test(cleaned) && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }

  return cleaned;
}
