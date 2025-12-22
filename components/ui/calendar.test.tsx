import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('calls onMonthChange when previous month button is clicked', async () => {
    const onMonthChange = jest.fn();
    render(<Calendar month={currentMonth} onMonthChange={onMonthChange} />);

    await userEvent.click(screen.getByRole('button', { name: /previous month/i }));

    const expectedDate = new Date(currentMonth);
    expectedDate.setMonth(expectedDate.getMonth() - 1);
    expect(onMonthChange).toHaveBeenCalledWith(expectedDate);
  });

  it('calls onMonthChange when next month button is clicked', async () => {
    const onMonthChange = jest.fn();
    render(<Calendar month={currentMonth} onMonthChange={onMonthChange} />);

    await userEvent.click(screen.getByRole('button', { name: /next month/i }));

    const expectedDate = new Date(currentMonth);
    expectedDate.setMonth(expectedDate.getMonth() + 1);
    expect(onMonthChange).toHaveBeenCalledWith(expectedDate);
  });

  it('calls onGoToToday when today button is clicked', async () => {
    const onGoToToday = jest.fn();
    render(<Calendar month={currentMonth} onGoToToday={onGoToToday} />);

    await userEvent.click(screen.getByRole('button', { name: /go to today/i }));

    expect(onGoToToday).toHaveBeenCalled();
  });

  it.each(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])(
    'renders %s weekday label',
    (day) => {
      render(<Calendar month={currentMonth} />);
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  );

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

  describe('Month Boundary Navigation', () => {
    const startMonth = new Date(2025, 0); // January 2025
    const endMonth = new Date(2025, 11); // December 2025

    it('disables the previous button when month equals startMonth', () => {
      render(<Calendar month={startMonth} startMonth={startMonth} />);

      expect(screen.getByRole('button', { name: /previous month/i })).toBeDisabled();
    });

    it('disables the next button when month equals endMonth', () => {
      render(<Calendar month={endMonth} endMonth={endMonth} />);

      expect(screen.getByRole('button', { name: /next month/i })).toBeDisabled();
    });

    it('enables the previous button when month is after startMonth', () => {
      const month = new Date(2025, 1); // February 2025
      render(<Calendar month={month} startMonth={startMonth} />);

      expect(screen.getByRole('button', { name: /previous month/i })).toBeEnabled();
    });

    it('enables the next button when month is before endMonth', () => {
      const month = new Date(2025, 10); // November 2025
      render(<Calendar month={month} endMonth={endMonth} />);

      expect(screen.getByRole('button', { name: /next month/i })).toBeEnabled();
    });

    it('disables previous button even if on the first day of startMonth with timestamp difference', () => {
      // displayMonth is 2025-01-01 12:00:00, startMonth is 2025-01-01 00:00:00
      const displayMonth = new Date(2025, 0, 1, 12);
      const limitMonth = new Date(2025, 0, 1, 0);
      render(<Calendar month={displayMonth} startMonth={limitMonth} />);

      expect(screen.getByRole('button', { name: /previous month/i })).toBeDisabled();
    });

    it('disables next button even if on the last day of endMonth with timestamp difference', () => {
      // displayMonth is 2025-11-30 00:00:00, endMonth is 2025-11-01 00:00:00
      const displayMonth = new Date(2025, 11, 30);
      const limitMonth = new Date(2025, 11, 1);
      render(<Calendar month={displayMonth} endMonth={limitMonth} />);

      expect(screen.getByRole('button', { name: /next month/i })).toBeDisabled();
    });
  });

  describe('Uncontrolled Mode', () => {
    it('navigates to previous month without month prop', async () => {
      render(<Calendar />);

      const currentMonthLabel = screen.getAllByText(/\w+ \d{4}/)[0].textContent;
      expect(currentMonthLabel).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: /previous month/i }));

      const newMonthLabel = screen.getAllByText(/\w+ \d{4}/)[0].textContent;
      expect(newMonthLabel).not.toBe(currentMonthLabel);
    });

    it('navigates to next month without month prop', async () => {
      render(<Calendar />);

      const currentMonthLabel = screen.getAllByText(/\w+ \d{4}/)[0].textContent;
      expect(currentMonthLabel).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: /next month/i }));

      const newMonthLabel = screen.getAllByText(/\w+ \d{4}/)[0].textContent;
      expect(newMonthLabel).not.toBe(currentMonthLabel);
    });

    it('returns to today when clicking go to today without month prop', async () => {
      render(<Calendar />);

      await userEvent.click(screen.getByRole('button', { name: /previous month/i }));
      await userEvent.click(screen.getByRole('button', { name: /previous month/i }));

      const awayMonthLabel = screen.getAllByText(/\w+ \d{4}/)[0].textContent;

      await userEvent.click(screen.getByRole('button', { name: /go to today/i }));

      const todayMonthLabel = screen.getAllByText(/\w+ \d{4}/)[0].textContent;
      expect(todayMonthLabel).not.toBe(awayMonthLabel);
    });
  });
});

