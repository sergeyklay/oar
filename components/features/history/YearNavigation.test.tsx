import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YearNavigation } from './YearNavigation';

const mockSetYear = jest.fn();

jest.mock('nuqs', () => ({
  useQueryState: jest.fn(() => [null, mockSetYear]),
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  getCurrentYear: jest.fn(() => '2025'),
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
}));

describe('YearNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation buttons', () => {
    render(<YearNavigation currentYear="2025" />);

    expect(screen.getByRole('button', { name: /previous year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next year/i })).toBeInTheDocument();
  });

  it('calls setYear with previous year when previous button is clicked', async () => {
    const user = userEvent.setup();
    render(<YearNavigation currentYear="2025" />);

    await user.click(screen.getByRole('button', { name: /previous year/i }));

    expect(mockSetYear).toHaveBeenCalledWith('2024');
  });

  it('calls setYear with next year when next button is clicked', async () => {
    const user = userEvent.setup();
    render(<YearNavigation currentYear="2025" />);

    await user.click(screen.getByRole('button', { name: /next year/i }));

    expect(mockSetYear).toHaveBeenCalledWith('2026');
  });

  it('handles year boundary correctly', async () => {
    const user = userEvent.setup();
    render(<YearNavigation currentYear="2024" />);

    await user.click(screen.getByRole('button', { name: /previous year/i }));

    expect(mockSetYear).toHaveBeenCalledWith('2023');
  });

  it('handles leap year correctly', async () => {
    const user = userEvent.setup();
    render(<YearNavigation currentYear="2024" />);

    await user.click(screen.getByRole('button', { name: /next year/i }));

    expect(mockSetYear).toHaveBeenCalledWith('2025');
  });
});

