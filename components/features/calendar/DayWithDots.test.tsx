import { render, screen } from '@testing-library/react';
import { DayWithDots } from './DayWithDots';
import type { DateStatusMap, PaymentDateMap } from '@/actions/calendar';
import type { CalendarDay } from 'react-day-picker';

jest.mock('date-fns', () => ({
  format: jest.fn((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
}));

const createMockDay = (date: Date): CalendarDay => ({
  date,
  dateLib: date,
  displayMonth: date,
  isoDate: date.toISOString().split('T')[0],
  displayMonthId: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  dateMonthId: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  isEqualTo: jest.fn(),
  modifiers: {},
  disabled: false,
  selected: false,
  today: false,
  outside: false,
} as unknown as CalendarDay);

describe('DayWithDots', () => {
  const mockDate = new Date('2025-12-15');
  const mockDay = createMockDay(mockDate);
  const mockModifiers = {};

  describe('dotMode: status', () => {
    it('renders colored dots for bill statuses', () => {
      const dateStatuses: DateStatusMap = {
        '2025-12-15': ['pending', 'overdue'],
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={false}
          dotMode="status"
          modifiers={mockModifiers}
        />
      );

      const dots = screen.getAllByLabelText(/bill$/);
      expect(dots.length).toBeGreaterThan(0);
    });

    it('does not render dots when no statuses for date', () => {
      const dateStatuses: DateStatusMap = {};

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={false}
          dotMode="status"
          modifiers={mockModifiers}
        />
      );

      expect(screen.queryByLabelText(/bill$/)).not.toBeInTheDocument();
    });

    it('does not render dots when loading', () => {
      const dateStatuses: DateStatusMap = {
        '2025-12-15': ['pending'],
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={true}
          dotMode="status"
          modifiers={mockModifiers}
        />
      );

      expect(screen.queryByLabelText(/bill$/)).not.toBeInTheDocument();
    });

    it('deduplicates and limits to 3 dots', () => {
      const dateStatuses: DateStatusMap = {
        '2025-12-15': ['pending', 'pending', 'overdue', 'paid', 'paid'],
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={false}
          dotMode="status"
          modifiers={mockModifiers}
        />
      );

      const dots = screen.getAllByLabelText(/bill$/);
      expect(dots.length).toBeLessThanOrEqual(3);
    });

    it('sorts statuses: overdue > pending > paid', () => {
      const dateStatuses: DateStatusMap = {
        '2025-12-15': ['paid', 'pending', 'overdue'],
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={false}
          dotMode="status"
          modifiers={mockModifiers}
        />
      );

      const dots = screen.getAllByLabelText(/bill$/);
      expect(dots).toHaveLength(3);

      const labels = dots.map((dot) => dot.getAttribute('aria-label'));
      expect(labels).toEqual(['overdue bill', 'pending bill', 'paid bill']);
    });
  });

  describe('dotMode: payment', () => {
    it('renders white dot when payment exists for date', () => {
      const paymentDates: PaymentDateMap = {
        '2025-12-15': true,
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={{}}
          isLoading={false}
          dotMode="payment"
          paymentDates={paymentDates}
          modifiers={mockModifiers}
        />
      );

      const dot = screen.getByLabelText('payment made');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('bg-white');
    });

    it('does not render dot when no payment for date', () => {
      const paymentDates: PaymentDateMap = {
        '2025-12-20': true,
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={{}}
          isLoading={false}
          dotMode="payment"
          paymentDates={paymentDates}
          modifiers={mockModifiers}
        />
      );

      expect(screen.queryByLabelText('payment made')).not.toBeInTheDocument();
    });

    it('does not render dot when loading', () => {
      const paymentDates: PaymentDateMap = {
        '2025-12-15': true,
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={{}}
          isLoading={true}
          dotMode="payment"
          paymentDates={paymentDates}
          modifiers={mockModifiers}
        />
      );

      expect(screen.queryByLabelText('payment made')).not.toBeInTheDocument();
    });

    it('does not render dot when paymentDates is undefined', () => {
      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={{}}
          isLoading={false}
          dotMode="payment"
          modifiers={mockModifiers}
        />
      );

      expect(screen.queryByLabelText('payment made')).not.toBeInTheDocument();
    });
  });

  describe('dotMode: none', () => {
    it('does not render any dots', () => {
      const dateStatuses: DateStatusMap = {
        '2025-12-15': ['pending', 'overdue'],
      };
      const paymentDates: PaymentDateMap = {
        '2025-12-15': true,
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={false}
          dotMode="none"
          paymentDates={paymentDates}
          modifiers={mockModifiers}
        />
      );

      expect(screen.queryByLabelText(/bill$/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('payment made')).not.toBeInTheDocument();
    });
  });

  describe('default behavior', () => {
    it('defaults to status mode when dotMode is undefined', () => {
      const dateStatuses: DateStatusMap = {
        '2025-12-15': ['pending'],
      };

      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={dateStatuses}
          isLoading={false}
          modifiers={mockModifiers}
        />
      );

      const dots = screen.getAllByLabelText(/bill$/);
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  describe('date number display', () => {
    it('displays the day number', () => {
      render(
        <DayWithDots
          day={mockDay}
          dateStatuses={{}}
          isLoading={false}
          dotMode="none"
          modifiers={mockModifiers}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});

