import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { render } from '@testing-library/react';
import { TIMEZONE_COOKIE_NAME } from '@/lib/constants';
import { TimezoneProvider } from './TimezoneProvider';

describe('TimezoneProvider', () => {
  let cookieGetter: Mock;
  let cookieSetter: Mock;
  let originalCookieDescriptor: PropertyDescriptor | undefined;

  beforeAll(() => {
    originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
  });

  afterAll(() => {
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', originalCookieDescriptor);
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cookieGetter = vi.fn().mockReturnValue('');
    cookieSetter = vi.fn();
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: cookieGetter,
      set: cookieSetter,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing visible', () => {
    const { container } = render(<TimezoneProvider />);

    expect(container.firstChild).toBeNull();
  });

  it('sets timezone cookie with correct format on mount', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    const oneYearInSeconds = 365 * 24 * 60 * 60;

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledTimes(1);
    expect(cookieSetter).toHaveBeenCalledWith(
      `${TIMEZONE_COOKIE_NAME}=1; path=/; max-age=${oneYearInSeconds}; SameSite=Lax`,
    );
  });

  it.each([
    { offsetMinutes: -60, expectedHours: 1, timezone: 'UTC+1 (CET)' },
    { offsetMinutes: 300, expectedHours: -5, timezone: 'UTC-5 (EST)' },
    { offsetMinutes: -540, expectedHours: 9, timezone: 'UTC+9 (JST)' },
    { offsetMinutes: 0, expectedHours: 0, timezone: 'UTC+0' },
    { offsetMinutes: -330, expectedHours: 5.5, timezone: 'UTC+5:30 (IST)' },
  ])(
    'converts $offsetMinutes minutes to $expectedHours hours ($timezone)',
    ({ offsetMinutes, expectedHours }) => {
      vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offsetMinutes);

      render(<TimezoneProvider />);

      expect(cookieSetter).toHaveBeenCalledWith(
        expect.stringContaining(`${TIMEZONE_COOKIE_NAME}=${expectedHours}`),
      );
    },
  );

  it('does not update cookie if value is already correct', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`${TIMEZONE_COOKIE_NAME}=1`);

    render(<TimezoneProvider />);

    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it('updates cookie if existing value differs', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`${TIMEZONE_COOKIE_NAME}=-5`);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining(`${TIMEZONE_COOKIE_NAME}=1`));
  });

  it('only runs once per component instance', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);

    const { rerender } = render(<TimezoneProvider />);
    rerender(<TimezoneProvider />);
    rerender(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledTimes(1);
  });

  it('handles cookie with multiple entries', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`other-cookie=value; ${TIMEZONE_COOKIE_NAME}=1; another=test`);

    render(<TimezoneProvider />);

    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it('handles fractional offsets with tolerance', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
    cookieGetter.mockReturnValue(`${TIMEZONE_COOKIE_NAME}=5.5`);

    render(<TimezoneProvider />);

    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it('updates cookie when value differs slightly beyond tolerance', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
    cookieGetter.mockReturnValue(`${TIMEZONE_COOKIE_NAME}=5.4`);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${TIMEZONE_COOKIE_NAME}=5.5`),
    );
  });

  it('handles invalid cookie value gracefully', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`${TIMEZONE_COOKIE_NAME}=invalid`);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining(`${TIMEZONE_COOKIE_NAME}=1`));
  });
});
