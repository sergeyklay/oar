import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { SidebarToggle } from './SidebarToggle';

vi.mock('nuqs', () => ({
  useQueryState: vi.fn(),
  parseAsStringLiteral: vi.fn(() => vi.fn()),
}));

describe('SidebarToggle', () => {
  const mockSetSidebarState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a button with menu icon', () => {
    (useQueryState as Mock).mockReturnValue([null, mockSetSidebarState]);

    render(<SidebarToggle />);

    const button = screen.getByRole('button', { name: /hide sidebar/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('shows "Show sidebar" aria-label when sidebar is hidden', () => {
    (useQueryState as Mock).mockReturnValue(['hidden', mockSetSidebarState]);

    render(<SidebarToggle />);

    const button = screen.getByRole('button', { name: /show sidebar/i });
    expect(button).toBeInTheDocument();
  });

  it('shows "Hide sidebar" aria-label when sidebar is visible', () => {
    (useQueryState as Mock).mockReturnValue([null, mockSetSidebarState]);

    render(<SidebarToggle />);

    const button = screen.getByRole('button', { name: /hide sidebar/i });
    expect(button).toBeInTheDocument();
  });

  it('toggles from visible to hidden when clicked', async () => {
    (useQueryState as Mock).mockReturnValue([null, mockSetSidebarState]);
    const user = userEvent.setup();

    render(<SidebarToggle />);

    const button = screen.getByRole('button', { name: /hide sidebar/i });
    await user.click(button);

    expect(mockSetSidebarState).toHaveBeenCalledWith('hidden');
  });

  it('toggles from hidden to visible when clicked', async () => {
    (useQueryState as Mock).mockReturnValue(['hidden', mockSetSidebarState]);
    const user = userEvent.setup();

    render(<SidebarToggle />);

    const button = screen.getByRole('button', { name: /show sidebar/i });
    await user.click(button);

    expect(mockSetSidebarState).toHaveBeenCalledWith(null);
  });

  it('applies custom className when provided', () => {
    (useQueryState as Mock).mockReturnValue([null, mockSetSidebarState]);

    render(<SidebarToggle className="custom-class" />);

    const button = screen.getByRole('button', { name: /hide sidebar/i });
    expect(button).toHaveClass('custom-class');
  });

  it('calls useQueryState with sidebar param and parser', () => {
    (useQueryState as Mock).mockReturnValue([null, mockSetSidebarState]);

    render(<SidebarToggle />);

    expect(useQueryState).toHaveBeenCalledWith('sidebar', expect.anything());
    expect(parseAsStringLiteral).toHaveBeenCalledWith(['hidden']);
  });
});
