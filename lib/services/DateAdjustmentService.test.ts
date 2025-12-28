import { DateAdjustmentService } from './DateAdjustmentService';

describe('DateAdjustmentService', () => {
  describe('isWeekend', () => {
    it.each([
      ['Saturday', new Date('2025-01-11'), true],
      ['Sunday', new Date('2025-01-12'), true],
      ['Monday', new Date('2025-01-13'), false],
      ['Tuesday', new Date('2025-01-14'), false],
      ['Wednesday', new Date('2025-01-15'), false],
      ['Thursday', new Date('2025-01-16'), false],
      ['Friday', new Date('2025-01-10'), false],
    ])('returns %s for %s', (_dayName, date, expected) => {
      const result = DateAdjustmentService.isWeekend(date);

      expect(result).toBe(expected);
    });
  });

  describe('adjustPaymentDate', () => {
    describe('unchanged strategy', () => {
      it('returns date unchanged for Saturday', () => {
        const saturday = new Date('2025-01-11');

        const result = DateAdjustmentService.adjustPaymentDate(saturday, 'unchanged');

        expect(result).toEqual(saturday);
      });

      it('returns date unchanged for Sunday', () => {
        const sunday = new Date('2025-01-12');

        const result = DateAdjustmentService.adjustPaymentDate(sunday, 'unchanged');

        expect(result).toEqual(sunday);
      });

      it('returns date unchanged for weekday', () => {
        const monday = new Date('2025-01-13');

        const result = DateAdjustmentService.adjustPaymentDate(monday, 'unchanged');

        expect(result).toEqual(monday);
      });
    });

    describe('next_business_day strategy', () => {
      it('moves Saturday to Monday', () => {
        const saturday = new Date('2025-01-11');
        const expectedMonday = new Date('2025-01-13');

        const result = DateAdjustmentService.adjustPaymentDate(saturday, 'next_business_day');

        expect(result).toEqual(expectedMonday);
      });

      it('moves Sunday to Monday', () => {
        const sunday = new Date('2025-01-12');
        const expectedMonday = new Date('2025-01-13');

        const result = DateAdjustmentService.adjustPaymentDate(sunday, 'next_business_day');

        expect(result).toEqual(expectedMonday);
      });

      it('leaves weekday unchanged', () => {
        const monday = new Date('2025-01-13');

        const result = DateAdjustmentService.adjustPaymentDate(monday, 'next_business_day');

        expect(result).toEqual(monday);
      });
    });

    describe('previous_business_day strategy', () => {
      it('moves Saturday to Friday', () => {
        const saturday = new Date('2025-01-11');
        const expectedFriday = new Date('2025-01-10');

        const result = DateAdjustmentService.adjustPaymentDate(saturday, 'previous_business_day');

        expect(result).toEqual(expectedFriday);
      });

      it('moves Sunday to Friday', () => {
        const sunday = new Date('2025-01-12');
        const expectedFriday = new Date('2025-01-10');

        const result = DateAdjustmentService.adjustPaymentDate(sunday, 'previous_business_day');

        expect(result).toEqual(expectedFriday);
      });

      it('leaves weekday unchanged', () => {
        const monday = new Date('2025-01-13');

        const result = DateAdjustmentService.adjustPaymentDate(monday, 'previous_business_day');

        expect(result).toEqual(monday);
      });
    });
  });

  describe('getEffectiveStrategy', () => {
    it.each([
      ['unchanged', 'next_business_day', 'unchanged'],
      ['next_business_day', 'previous_business_day', 'next_business_day'],
      ['previous_business_day', 'unchanged', 'previous_business_day'],
    ])('returns bill strategy %s when override is set (global: %s)', (billStrategy, globalStrategy, expected) => {
      const result = DateAdjustmentService.getEffectiveStrategy(
        billStrategy as 'unchanged' | 'next_business_day' | 'previous_business_day',
        globalStrategy as 'unchanged' | 'next_business_day' | 'previous_business_day'
      );

      expect(result).toBe(expected);
    });

    it.each([
      ['unchanged', 'unchanged'],
      ['next_business_day', 'next_business_day'],
      ['previous_business_day', 'previous_business_day'],
    ])('returns global strategy %s when bill override is null', (globalStrategy, expected) => {
      const result = DateAdjustmentService.getEffectiveStrategy(
        null,
        globalStrategy as 'unchanged' | 'next_business_day' | 'previous_business_day'
      );

      expect(result).toBe(expected);
    });
  });
});

