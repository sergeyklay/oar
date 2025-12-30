import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutoLogAutoPayCheckbox } from './AutoLogAutoPayCheckbox';
import { updateAutoLogAutoPay } from '@/actions/settings';
import { toast } from 'sonner';

jest.mock('@/actions/settings', () => ({
  updateAutoLogAutoPay: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AutoLogAutoPayCheckbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and description', () => {
    render(<AutoLogAutoPayCheckbox checked={true} />);

    expect(screen.getByText('Automatically log automatic bills')).toBeInTheDocument();
    expect(
      screen.getByText(
        'If an automatic bill has an amount due set, Oar will automatically log it on the due date'
      )
    ).toBeInTheDocument();
  });

  it('renders switch as checked when checked prop is true', () => {
    render(<AutoLogAutoPayCheckbox checked={true} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });

  it('renders switch as unchecked when checked prop is false', () => {
    render(<AutoLogAutoPayCheckbox checked={false} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('calls updateAutoLogAutoPay when toggled to enabled', async () => {
    const user = userEvent.setup();
    (updateAutoLogAutoPay as jest.Mock).mockResolvedValue({ success: true });

    render(<AutoLogAutoPayCheckbox checked={false} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    await user.click(switchElement);

    await waitFor(() => {
      expect(updateAutoLogAutoPay).toHaveBeenCalledWith({ enabled: true });
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('calls updateAutoLogAutoPay when toggled to disabled', async () => {
    const user = userEvent.setup();
    (updateAutoLogAutoPay as jest.Mock).mockResolvedValue({ success: true });

    render(<AutoLogAutoPayCheckbox checked={true} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    await user.click(switchElement);

    await waitFor(() => {
      expect(updateAutoLogAutoPay).toHaveBeenCalledWith({ enabled: false });
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('shows error toast and reverts state when update fails', async () => {
    const user = userEvent.setup();
    (updateAutoLogAutoPay as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    render(<AutoLogAutoPayCheckbox checked={true} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    await user.click(switchElement);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update failed');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('shows loading spinner while updating', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: { success: boolean }) => void;
    const updatePromise = new Promise<{ success: boolean }>((resolve) => {
      resolveUpdate = resolve;
    });
    (updateAutoLogAutoPay as jest.Mock).mockReturnValue(updatePromise);

    render(<AutoLogAutoPayCheckbox checked={false} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    await user.click(switchElement);

    await waitFor(() => {
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    resolveUpdate!({ success: true });
    await waitFor(() => {
      expect(updateAutoLogAutoPay).toHaveBeenCalled();
    });
  });

  it('disables switch while update is pending', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: { success: boolean }) => void;
    const updatePromise = new Promise<{ success: boolean }>((resolve) => {
      resolveUpdate = resolve;
    });
    (updateAutoLogAutoPay as jest.Mock).mockReturnValue(updatePromise);

    render(<AutoLogAutoPayCheckbox checked={false} />);

    const switchElement = document.getElementById('autoLogAutoPay') as HTMLButtonElement;
    await user.click(switchElement);

    await waitFor(() => {
      expect(switchElement).toBeDisabled();
    });

    resolveUpdate!({ success: true });
    await waitFor(() => {
      expect(updateAutoLogAutoPay).toHaveBeenCalled();
    });
  });
});

