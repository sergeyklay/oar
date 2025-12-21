import { renderHook, act } from '@testing-library/react';
import { useCalendarState } from './useCalendarState';
import { useQueryStates } from 'nuqs';

// Mock nuqs
jest.mock('nuqs', () => ({
  useQueryStates: jest.fn(),
  parseAsString: {
    withDefault: jest.fn(() => ({
      parse: (v: string) => v,
      serialize: (v: string) => v,
    })),
  },
}));

describe('useCalendarState', () => {
  const mockSetParams = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryStates as jest.Mock).mockReturnValue([
      { month: '2025-12', date: '2025-12-15', selectedBill: 'bill-123' },
      mockSetParams,
    ]);
  });

  it('clears selectedBill when setMonth is called', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.setMonth(new Date(2026, 0, 1));
    });

    expect(mockSetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        month: '2026-01',
        date: null,
        selectedBill: null,
      })
    );
  });

  it('clears selectedBill when setDate is called with a date', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.setDate(new Date(2025, 11, 25));
    });

    expect(mockSetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2025-12-25',
        selectedBill: null,
      })
    );
  });

  it('clears selectedBill when setDate is called with null', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.setDate(null);
    });

    expect(mockSetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        date: null,
        selectedBill: null,
      })
    );
  });

  it('clears selectedBill when clearDate is called', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.clearDate();
    });

    expect(mockSetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        date: null,
        selectedBill: null,
      })
    );
  });
});

