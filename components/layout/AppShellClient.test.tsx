import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { render } from '@testing-library/react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { AppShellClient } from './AppShellClient';

vi.mock('nuqs', () => ({
  useQueryState: vi.fn(),
  parseAsStringLiteral: vi.fn(() => vi.fn()),
}));

describe('AppShellClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children without sidebar-hidden class when sidebar is visible', () => {
    (useQueryState as Mock).mockReturnValue([null, vi.fn()]);

    const { container } = render(
      <AppShellClient>
        <div data-testid="child">Content</div>
      </AppShellClient>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('sidebar-hidden');
  });

  it('applies sidebar-hidden class when sidebar state is hidden', () => {
    (useQueryState as Mock).mockReturnValue(['hidden', vi.fn()]);

    const { container } = render(
      <AppShellClient>
        <div data-testid="child">Content</div>
      </AppShellClient>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('sidebar-hidden');
  });

  it('renders children correctly', () => {
    (useQueryState as Mock).mockReturnValue([null, vi.fn()]);

    const { getByTestId } = render(
      <AppShellClient>
        <div data-testid="child">Content</div>
      </AppShellClient>,
    );

    expect(getByTestId('child')).toBeInTheDocument();
    expect(getByTestId('child')).toHaveTextContent('Content');
  });

  it('applies custom className when provided', () => {
    (useQueryState as Mock).mockReturnValue([null, vi.fn()]);

    const { container } = render(
      <AppShellClient className="custom-class">
        <div>Content</div>
      </AppShellClient>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('combines custom className with sidebar-hidden class when both are present', () => {
    (useQueryState as Mock).mockReturnValue(['hidden', vi.fn()]);

    const { container } = render(
      <AppShellClient className="custom-class">
        <div>Content</div>
      </AppShellClient>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('sidebar-hidden');
  });

  it('calls useQueryState with sidebar param and parser', () => {
    (useQueryState as Mock).mockReturnValue([null, vi.fn()]);

    render(
      <AppShellClient>
        <div>Content</div>
      </AppShellClient>,
    );

    expect(useQueryState).toHaveBeenCalledWith('sidebar', expect.anything());
    expect(parseAsStringLiteral).toHaveBeenCalledWith(['hidden']);
  });
});
