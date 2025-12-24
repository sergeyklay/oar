import { render, screen, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { BillEndActionDropdown } from './BillEndActionDropdown';

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

Element.prototype.scrollIntoView = jest.fn();
Element.prototype.hasPointerCapture = jest.fn();
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

describe('BillEndActionDropdown', () => {
  let mockOnUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUpdate = jest.fn();
  });

  it('renders with current value mark_as_paid', () => {
    render(
      <BillEndActionDropdown
        currentValue="mark_as_paid"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Mark as Never Due')).toBeInTheDocument();
  });

  it('renders with current value archive', () => {
    render(
      <BillEndActionDropdown
        currentValue="archive"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Move to the Archive')).toBeInTheDocument();
  });

  it('renders select component', () => {
    render(
      <BillEndActionDropdown
        currentValue="mark_as_paid"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  describe('user interactions', () => {
    it('calls onUpdate with correct value when changed to archive', async () => {
      mockOnUpdate.mockResolvedValue({ success: true });
      render(
        <BillEndActionDropdown
          currentValue="mark_as_paid"
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

      const option = screen.getByRole('option', { name: 'Move to the Archive' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('archive');
      });
    });

    it('calls onUpdate with correct value when changed to mark_as_paid', async () => {
      mockOnUpdate.mockResolvedValue({ success: true });
      render(
        <BillEndActionDropdown
          currentValue="archive"
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

      const option = screen.getByRole('option', { name: 'Mark as Never Due' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('mark_as_paid');
      });
    });

    it('persists new value when onUpdate resolves successfully', async () => {
      mockOnUpdate.mockResolvedValue({ success: true });
      render(
        <BillEndActionDropdown
          currentValue="mark_as_paid"
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

      const option = screen.getByRole('option', { name: 'Move to the Archive' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Move to the Archive')).toBeInTheDocument();
        expect(toast.success).toHaveBeenCalledWith('Setting updated');
      });
    });

    it('reverts to original value and shows toast when onUpdate fails', async () => {
      mockOnUpdate.mockResolvedValue({
        success: false,
        error: 'Update failed',
      });
      render(
        <BillEndActionDropdown
          currentValue="mark_as_paid"
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

      const option = screen.getByRole('option', { name: 'Move to the Archive' });
      await act(async () => {
        option.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Mark as Never Due')).toBeInTheDocument();
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
        <BillEndActionDropdown
          currentValue="mark_as_paid"
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

      const option = screen.getByRole('option', { name: 'Move to the Archive' });
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

