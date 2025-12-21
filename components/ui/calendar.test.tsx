import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from './calendar';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Triangle: ({ className }: { className: string }) => <span data-testid="triangle-icon" className={className} />,
  Circle: ({ className }: { className: string }) => <span data-testid="circle-icon" className={className} />,
}));

describe('Calendar UI Component', () => {
  const currentMonth = new Date(2025, 11); // December 2025

  it('renders month and year title correctly', () => {
    render(<Calendar month={currentMonth} />);
    // We expect multiple because react-day-picker renders a hidden screen-reader caption
    // and we render our custom visible caption.
    const monthLabels = screen.getAllByText('December 2025');
    expect(monthLabels.length).toBeGreaterThanOrEqual(1);
    expect(monthLabels[0]).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<Calendar month={currentMonth} />);

    expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
  });

  it('calls onMonthChange when previous month button is clicked', () => {
    const onMonthChange = jest.fn();
    render(<Calendar month={currentMonth} onMonthChange={onMonthChange} />);

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));

    const expectedDate = new Date(currentMonth);
    expectedDate.setMonth(expectedDate.getMonth() - 1);
    expect(onMonthChange).toHaveBeenCalledWith(expectedDate);
  });

  it('calls onMonthChange when next month button is clicked', () => {
    const onMonthChange = jest.fn();
    render(<Calendar month={currentMonth} onMonthChange={onMonthChange} />);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));

    const expectedDate = new Date(currentMonth);
    expectedDate.setMonth(expectedDate.getMonth() + 1);
    expect(onMonthChange).toHaveBeenCalledWith(expectedDate);
  });

  it('calls onGoToToday when today button is clicked', () => {
    const onGoToToday = jest.fn();
    render(<Calendar month={currentMonth} onGoToToday={onGoToToday} />);

    fireEvent.click(screen.getByRole('button', { name: /go to today/i }));

    expect(onGoToToday).toHaveBeenCalled();
  });

  it('uses 3-letter uppercase weekday labels', () => {
    render(<Calendar month={currentMonth} />);

    const expectedWeekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    expectedWeekdays.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('renders outside days by default', () => {
    render(<Calendar month={currentMonth} />);

    // November 30, 2025 is an outside day for December 2025
    const outsideDay = screen.queryByLabelText(/Sunday, November 30th, 2025/i);
    expect(outsideDay).toBeInTheDocument();
  });

  it('hides outside days when showOutsideDays is false', () => {
    render(<Calendar month={currentMonth} showOutsideDays={false} />);

    // In react-day-picker, outside days are rendered with opacity-0 if hidden
    const outsideDay = screen.queryByLabelText(/Sunday, November 30th, 2025/i);
    expect(outsideDay).not.toBeInTheDocument();
  });
});

