import { render } from '@testing-library/react';
import { TimezoneProvider } from './TimezoneProvider';

describe('TimezoneProvider', () => {
  const COOKIE_NAME = 'oar-tz-offset';
  let cookieGetter: jest.Mock;
  let cookieSetter: jest.Mock;
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
    jest.clearAllMocks();
    cookieGetter = jest.fn().mockReturnValue('');
    cookieSetter = jest.fn();
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: cookieGetter,
      set: cookieSetter,
    });
  });

  it('renders nothing visible', () => {
    const { container } = render(<TimezoneProvider />);

    expect(container.firstChild).toBeNull();
  });

  it('sets timezone cookie on mount', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${COOKIE_NAME}=1`)
    );
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining('path=/')
    );
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining('SameSite=Lax')
    );
  });

  describe.each([
    { offsetMinutes: -60, expectedHours: 1, timezone: 'UTC+1 (CET)' },
    { offsetMinutes: 300, expectedHours: -5, timezone: 'UTC-5 (EST)' },
    { offsetMinutes: -540, expectedHours: 9, timezone: 'UTC+9 (JST)' },
    { offsetMinutes: 0, expectedHours: 0, timezone: 'UTC+0' },
    { offsetMinutes: -330, expectedHours: 5.5, timezone: 'UTC+5:30 (IST)' },
  ])('timezone offset conversion: $timezone', ({ offsetMinutes, expectedHours }) => {
    it(`converts ${offsetMinutes} minutes to ${expectedHours} hours`, () => {
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offsetMinutes);

      render(<TimezoneProvider />);

      expect(cookieSetter).toHaveBeenCalledWith(
        expect.stringContaining(`${COOKIE_NAME}=${expectedHours}`)
      );
    });
  });

  it('does not update cookie if value is already correct', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`${COOKIE_NAME}=1`);

    render(<TimezoneProvider />);

    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it('updates cookie if existing value differs', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`${COOKIE_NAME}=-5`);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${COOKIE_NAME}=1`)
    );
  });

  it('sets cookie with 1 year max-age', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);

    render(<TimezoneProvider />);

    const oneYearInSeconds = 365 * 24 * 60 * 60;
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`max-age=${oneYearInSeconds}`)
    );
  });

  it('only runs once per component instance', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);

    const { rerender } = render(<TimezoneProvider />);
    rerender(<TimezoneProvider />);
    rerender(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledTimes(1);
  });

  it('handles cookie with multiple entries', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`other-cookie=value; ${COOKIE_NAME}=1; another=test`);

    render(<TimezoneProvider />);

    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it('handles fractional offsets with tolerance', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
    cookieGetter.mockReturnValue(`${COOKIE_NAME}=5.5`);

    render(<TimezoneProvider />);

    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it('updates cookie when value differs slightly beyond tolerance', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
    cookieGetter.mockReturnValue(`${COOKIE_NAME}=5.4`);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${COOKIE_NAME}=5.5`)
    );
  });

  it('handles invalid cookie value gracefully', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
    cookieGetter.mockReturnValue(`${COOKIE_NAME}=invalid`);

    render(<TimezoneProvider />);

    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${COOKIE_NAME}=1`)
    );
  });
});
