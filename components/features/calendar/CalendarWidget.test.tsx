import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CalendarWidget } from './CalendarWidget';
import { useCalendarState } from './useCalendarState';
import { getBillDatesForMonth } from '@/actions/calendar';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Triangle: ({ className }: { className: string }) => <span data-testid="triangle-icon" className={className} />,
  Circle: ({ className }: { className: string }) => <span data-testid="circle-icon" className={className} />,
}));

// Mock actions and state
jest.mock('./useCalendarState');
jest.mock('@/actions/calendar');

describe('CalendarWidget', () => {
  const mockSetMonth = jest.fn();
  const mockSetDate = jest.fn();
  const mockClearDate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCalendarState as jest.Mock).mockReturnValue({
      month: '2025-12',
      date: null,
      selectedBill: null,
      setMonth: mockSetMonth,
      setDate: mockSetDate,
      clearDate: mockClearDate,
    });
    (getBillDatesForMonth as jest.Mock).mockResolvedValue({});
  });

  it('renders the calendar with the initial month', async () => {
    await act(async () => {
      render(<CalendarWidget />);
    });

    // We expect multiple because react-day-picker renders a hidden screen-reader caption
    // and we render our custom visible caption.
    const monthLabels = screen.getAllByText('December 2025');
    expect(monthLabels.length).toBeGreaterThanOrEqual(1);
    expect(monthLabels[0]).toBeInTheDocument();

    await waitFor(() => {
      expect(getBillDatesForMonth).toHaveBeenCalledWith('2025-12');
    });
  });

  it('calls setMonth when navigation buttons are clicked', async () => {
    await act(async () => {
      render(<CalendarWidget />);
    });

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));

    // nextMonth will be January 2026
    const expectedDate = new Date(2026, 0, 1);
    expect(mockSetMonth).toHaveBeenCalledWith(expectedDate);
  });

  it('calls setMonth with current date when today button is clicked', async () => {
    await act(async () => {
      render(<CalendarWidget />);
    });

    fireEvent.click(screen.getByRole('button', { name: /go to today/i }));

    const today = new Date();
    const callDate = mockSetMonth.mock.calls[0][0];
    expect(callDate.getFullYear()).toBe(today.getFullYear());
    expect(callDate.getMonth()).toBe(today.getMonth());
  });

  it('calls setDate when a date is clicked', async () => {
    await act(async () => {
      render(<CalendarWidget />);
    });

    // Click on December 15th
    const dateButton = screen.getByLabelText(/Monday, December 15th, 2025/i);
    fireEvent.click(dateButton);

    const expectedDate = new Date(2025, 11, 15);
    expect(mockSetDate).toHaveBeenCalledWith(expectedDate);
  });

  it('displays filter info when a date is selected', async () => {
    (useCalendarState as jest.Mock).mockReturnValue({
      month: '2025-12',
      date: '2025-12-15',
      selectedBill: null,
      setMonth: mockSetMonth,
      setDate: mockSetDate,
      clearDate: mockClearDate,
    });

    await act(async () => {
      render(<CalendarWidget />);
    });

    expect(screen.getByText(/showing bills for/i)).toBeInTheDocument();
    expect(screen.getByText('December 15, 2025')).toBeInTheDocument();
  });

  it('calls clearDate when "Clear filter" is clicked', async () => {
    (useCalendarState as jest.Mock).mockReturnValue({
      month: '2025-12',
      date: '2025-12-15',
      selectedBill: null,
      setMonth: mockSetMonth,
      setDate: mockSetDate,
      clearDate: mockClearDate,
    });

    await act(async () => {
      render(<CalendarWidget />);
    });

    fireEvent.click(screen.getByRole('button', { name: /clear filter/i }));
    expect(mockClearDate).toHaveBeenCalled();
  });
});

