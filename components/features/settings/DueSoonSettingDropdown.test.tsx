import { render, screen, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { DueSoonSettingDropdown } from './DueSoonSettingDropdown';
import { updateDueSoonRange } from '@/actions/settings';

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));
jest.mock('@/actions/settings', () => ({
  updateDueSoonRange: jest.fn(),
}));
jest.mock('@/lib/constants', () => ({
  RANGE_LABELS: {
    '0': 'Today',
    '1': 'Today or tomorrow',
    '3': 'In next 3 days',
    '5': 'In next 5 days',
    '7': 'In next 7 days',
    '10': 'In next 10 days',
    '14': 'In next 14 days',
    '20': 'In next 20 days',
    '30': 'In next 30 days',
  },
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = jest.fn();
Element.prototype.hasPointerCapture = jest.fn();
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

describe('DueSoonSettingDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateDueSoonRange as jest.Mock).mockReset();
  });

  it('renders with current value', () => {
    render(<DueSoonSettingDropdown currentValue="7" />);

    expect(screen.getByText('In next 7 days')).toBeInTheDocument();
  });

  it('displays correct label for current value', () => {
    render(<DueSoonSettingDropdown currentValue="14" />);

    expect(screen.getByText('In next 14 days')).toBeInTheDocument();
  });

  it('displays fallback value when label not found', () => {
    render(<DueSoonSettingDropdown currentValue="unknown" />);

    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('renders select component', () => {
    render(<DueSoonSettingDropdown currentValue="7" />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  describe('user interactions', () => {
    it('calls updateDueSoonRange with correct range when value changes', async () => {
      (updateDueSoonRange as jest.Mock).mockResolvedValue({ success: true });
      render(<DueSoonSettingDropdown currentValue="7" />);

      const select = screen.getByRole('combobox');
      await act(async () => {
        select.focus();
        select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByRole('option', { name: 'In next 14 days' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(updateDueSoonRange).toHaveBeenCalledWith({ range: '14' });
      });
    });

    it('persists new value when updateDueSoonRange resolves successfully', async () => {
      (updateDueSoonRange as jest.Mock).mockResolvedValue({ success: true });
      render(<DueSoonSettingDropdown currentValue="7" />);

      const select = screen.getByRole('combobox');
      await act(async () => {
        select.focus();
        select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByRole('option', { name: 'In next 3 days' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(screen.getByText('In next 3 days')).toBeInTheDocument();
      });
      expect(updateDueSoonRange).toHaveBeenCalledWith({ range: '3' });
    });

    it('reverts to original value and shows toast when updateDueSoonRange fails', async () => {
      (updateDueSoonRange as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Update failed',
      });
      render(<DueSoonSettingDropdown currentValue="7" />);

      const select = screen.getByRole('combobox');
      await act(async () => {
        select.focus();
        select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByRole('option', { name: 'In next 14 days' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(screen.getByText('In next 7 days')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Failed to update setting', {
          description: 'Update failed',
        });
      });
    });

    it('shows loading spinner and disables select during pending update', async () => {
      let resolveUpdate: (value: { success: boolean }) => void;
      const updatePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });
      (updateDueSoonRange as jest.Mock).mockReturnValue(updatePromise);
      render(<DueSoonSettingDropdown currentValue="7" />);

      const select = screen.getByRole('combobox');
      await act(async () => {
        select.focus();
        select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByRole('option', { name: 'In next 14 days' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeDisabled();
      });

      await act(async () => {
        resolveUpdate!({ success: true });
      });

      await waitFor(() => {
        expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });
    });
  });
});
