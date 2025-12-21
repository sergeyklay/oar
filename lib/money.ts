/** Default currency code */
export const DEFAULT_CURRENCY = 'USD';

/** Default locale for formatting */
export const DEFAULT_LOCALE = 'en-US';

/**
 * Determines the number of minor units (decimal places) for a currency.
 * Uses Intl.NumberFormat to resolve the currency's fraction digits.
 *
 * @param currencyCode - ISO 4217 currency code
 * @returns Number of decimal places (e.g., 2 for USD, 0 for JPY)
 *
 * @example
 * getMinorUnits('USD') // 2
 * getMinorUnits('JPY') // 0
 */
export function getMinorUnits(currencyCode: string): number {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    });
    return formatter.resolvedOptions().minimumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/**
 * Converts a decimal amount to minor units (e.g., cents).
 *
 * @param amount - Decimal amount as string or number
 * @param currencyCode - ISO 4217 currency code
 * @returns Amount in minor units as integer
 * @throws Error if amount is invalid
 *
 * @example
 * toMinorUnits('49.99', 'USD') // 4999
 * toMinorUnits(100, 'JPY')     // 100
 */
export function toMinorUnits(
  amount: string | number,
  currencyCode: string = DEFAULT_CURRENCY
): number {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const minorUnits = getMinorUnits(currencyCode);
  const multiplier = Math.pow(10, minorUnits);
  return Math.round(numericAmount * multiplier);
}

/**
 * Converts minor units to major units for display.
 *
 * @param minorAmount - Amount in minor units
 * @param currencyCode - ISO 4217 currency code
 * @returns Amount in major units
 *
 * @example
 * toMajorUnits(4999, 'USD') // 49.99
 */
export function toMajorUnits(
  minorAmount: number,
  currencyCode: string = DEFAULT_CURRENCY
): number {
  const minorUnits = getMinorUnits(currencyCode);
  const divisor = Math.pow(10, minorUnits);
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
 * formatMoney(4999, 'USD', 'en-US') // "$49.99"
 * formatMoney(4999, 'PLN', 'pl-PL') // "49,99 zł"
 */
export function formatMoney(
  minorAmount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  const majorAmount = toMajorUnits(minorAmount, currencyCode);
  const minorUnits = getMinorUnits(currencyCode);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(majorAmount);
}

/**
 * Returns the display symbol for a currency.
 * Uses Intl.NumberFormat to extract the symbol dynamically.
 *
 * @param currencyCode - ISO 4217 currency code
 * @param locale - BCP 47 locale identifier
 * @returns Currency symbol or code as fallback
 *
 * @example
 * getCurrencySymbol('USD', 'en-US') // "$"
 * getCurrencySymbol('PLN', 'pl-PL') // "zł"
 */
export function getCurrencySymbol(
  currencyCode: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    });
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === 'currency');
    return symbolPart?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
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
