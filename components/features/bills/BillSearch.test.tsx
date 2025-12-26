import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillSearch } from './BillSearch';
import { searchBills } from '@/actions/bills';
import type { BillSearchResult } from '@/actions/bills';
import { toast } from 'sonner';

jest.mock('@/actions/bills', () => ({
  searchBills: jest.fn(),
}));

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('./CategoryIcon', () => ({
  CategoryIcon: ({ icon }: { icon: string }) => <div data-testid="category-icon">{icon}</div>,
}));

const mockBills: BillSearchResult[] = [
  {
    id: 'bill-1',
    title: 'Electric Bill',
    isArchived: false,
    categoryIcon: 'house',
  },
  {
    id: 'bill-2',
    title: 'Water Bill',
    isArchived: true,
    categoryIcon: 'droplet',
  },
];

describe('BillSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders search input with placeholder', () => {
      render(<BillSearch />);

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      const { container } = render(<BillSearch />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('lucide-search');
    });

    it('applies custom className when provided', () => {
      const { container } = render(<BillSearch className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('search input behavior', () => {
    it('does not execute search when input has fewer than 3 characters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'el');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      expect(searchBills).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /electric bill/i })).not.toBeInTheDocument();
    });

    it('executes search after typing 3 characters and debounce delay', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'ele');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(searchBills).toHaveBeenCalledWith({ query: 'ele' });
    });

    it('debounces search input to prevent excessive API calls', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'e');
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      await user.type(input, 'l');
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      await user.type(input, 'e');
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      expect(searchBills).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(searchBills).toHaveBeenCalledTimes(1);
      expect(searchBills).toHaveBeenCalledWith({ query: 'ele' });
    });

    it('clears results when input becomes less than 3 characters', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByText('Electric Bill');

      await user.clear(input);
      await user.type(input, 'el');

      expect(screen.queryByText('Electric Bill')).not.toBeInTheDocument();
      expect(screen.queryByText('Water Bill')).not.toBeInTheDocument();
    });
  });

  describe('search results display', () => {
    it('displays dropdown with matching results', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      expect(await screen.findByText('Electric Bill')).toBeInTheDocument();
      expect(await screen.findByText('Water Bill')).toBeInTheDocument();
    });

    it('displays category icon for each result', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'bill');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      const icons = await screen.findAllByTestId('category-icon');
      expect(icons).toHaveLength(2);
      expect(icons[0]).toHaveTextContent('house');
      expect(icons[1]).toHaveTextContent('droplet');
    });

    it('does not display dropdown when no results found', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'nonexistent');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByPlaceholderText('Search');

      expect(screen.queryByRole('button', { name: /bill/i })).not.toBeInTheDocument();
    });

    it('displays results as clickable buttons', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockBills[0]],
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      const resultButton = await screen.findByRole('button', { name: /electric bill/i });
      expect(resultButton).toBeInTheDocument();
      expect(resultButton).toHaveAttribute('type', 'button');
    });
  });

  describe('navigation', () => {
    it('navigates to overview page when non-archived bill is selected', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockBills[0]],
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      const resultButton = await screen.findByRole('button', { name: /electric bill/i });
      await user.click(resultButton);

      expect(mockPush).toHaveBeenCalledWith('/?selectedBill=bill-1');
    });

    it('navigates to archive page when archived bill is selected', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockBills[1]],
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'water');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      const resultButton = await screen.findByRole('button', { name: /water bill/i });
      await user.click(resultButton);

      expect(mockPush).toHaveBeenCalledWith('/archive?selectedBill=bill-2');
    });

    it('clears input and closes dropdown after selecting result', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockBills[0]],
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
      await user.type(input, 'electric');

      jest.advanceTimersByTime(400);

      const resultButton = await screen.findByRole('button', { name: /electric bill/i });
      await user.click(resultButton);

      expect(input.value).toBe('');
      expect(screen.queryByText('Electric Bill')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('closes dropdown when Escape key is pressed', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByText('Electric Bill');

      await user.keyboard('{Escape}');

      expect(screen.queryByText('Electric Bill')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside component', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(
        <div>
          <div data-testid="outside">Outside</div>
          <BillSearch />
        </div>
      );

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByText('Electric Bill');

      const outside = screen.getByTestId('outside');
      await user.click(outside);

      expect(screen.queryByText('Electric Bill')).not.toBeInTheDocument();
    });

    it('keeps dropdown open when clicking inside component', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBills,
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      const resultButton = await screen.findByRole('button', { name: /electric bill/i });
      await user.click(resultButton);

      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('displays error toast when search fails with error message', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Search failed',
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByPlaceholderText('Search');

      expect(toast.error).toHaveBeenCalledWith('Search failed');
      expect(screen.queryByRole('button', { name: /bill/i })).not.toBeInTheDocument();
    });

    it('displays error toast when search throws exception', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByPlaceholderText('Search');

      expect(toast.error).toHaveBeenCalledWith('Failed to search bills');
      expect(screen.queryByRole('button', { name: /bill/i })).not.toBeInTheDocument();
    });

    it('closes dropdown when search fails', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Search failed',
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      await screen.findByPlaceholderText('Search');

      expect(screen.queryByText('Electric Bill')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible search input', () => {
      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders results as accessible buttons', async () => {
      const user = userEvent.setup({ delay: null });
      (searchBills as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockBills[0]],
      });

      render(<BillSearch />);

      const input = screen.getByPlaceholderText('Search');
      await user.type(input, 'electric');

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      const resultButton = await screen.findByRole('button', { name: /electric bill/i });
      expect(resultButton).toBeInTheDocument();
    });
  });
});
