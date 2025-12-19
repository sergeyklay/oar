import { render, screen, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { RangeSettingDropdown } from './RangeSettingDropdown';

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockLabels = {
  '0': 'Today',
  '1': 'Today or tomorrow',
  '3': 'In next 3 days',
  '5': 'In next 5 days',
  '7': 'In next 7 days',
  '10': 'In next 10 days',
  '14': 'In next 14 days',
  '20': 'In next 20 days',
  '30': 'In next 30 days',
};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = jest.fn();
Element.prototype.hasPointerCapture = jest.fn();
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

describe('RangeSettingDropdown', () => {
  let mockOnUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUpdate = jest.fn();
  });

  it('renders with current value', () => {
    render(
      <RangeSettingDropdown
        currentValue="7"
        labels={mockLabels}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('In next 7 days')).toBeInTheDocument();
  });

  it('displays correct label for current value', () => {
    render(
      <RangeSettingDropdown
        currentValue="14"
        labels={mockLabels}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('In next 14 days')).toBeInTheDocument();
  });

  it('displays fallback value when label not found', () => {
    render(
      <RangeSettingDropdown
        currentValue="unknown"
        labels={mockLabels}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('renders select component', () => {
    render(
      <RangeSettingDropdown
        currentValue="7"
        labels={mockLabels}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  describe('user interactions', () => {
    it('calls onUpdate with correct range when value changes', async () => {
      mockOnUpdate.mockResolvedValue({ success: true });
      render(
        <RangeSettingDropdown
          currentValue="7"
          labels={mockLabels}
          onUpdate={mockOnUpdate}
        />
      );

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
        expect(mockOnUpdate).toHaveBeenCalledWith({ range: '14' });
      });
    });

    it('persists new value when onUpdate resolves successfully', async () => {
      mockOnUpdate.mockResolvedValue({ success: true });
      render(
        <RangeSettingDropdown
          currentValue="7"
          labels={mockLabels}
          onUpdate={mockOnUpdate}
        />
      );

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
      expect(mockOnUpdate).toHaveBeenCalledWith({ range: '3' });
    });

    it('reverts to original value and shows toast when onUpdate fails', async () => {
      mockOnUpdate.mockResolvedValue({
        success: false,
        error: 'Update failed',
      });
      render(
        <RangeSettingDropdown
          currentValue="7"
          labels={mockLabels}
          onUpdate={mockOnUpdate}
        />
      );

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
      mockOnUpdate.mockReturnValue(updatePromise);
      render(
        <RangeSettingDropdown
          currentValue="7"
          labels={mockLabels}
          onUpdate={mockOnUpdate}
        />
      );

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

