import { render } from '@testing-library/react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { AppShellClient } from './AppShellClient';

jest.mock('nuqs', () => ({
  useQueryState: jest.fn(),
  parseAsStringLiteral: jest.fn(() => jest.fn()),
}));

describe('AppShellClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children without sidebar-hidden class when sidebar is visible', () => {
    (useQueryState as jest.Mock).mockReturnValue([null, jest.fn()]);

    const { container } = render(
      <AppShellClient>
        <div data-testid="child">Content</div>
      </AppShellClient>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('sidebar-hidden');
  });

  it('applies sidebar-hidden class when sidebar state is hidden', () => {
    (useQueryState as jest.Mock).mockReturnValue(['hidden', jest.fn()]);

    const { container } = render(
      <AppShellClient>
        <div data-testid="child">Content</div>
      </AppShellClient>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('sidebar-hidden');
  });

  it('renders children correctly', () => {
    (useQueryState as jest.Mock).mockReturnValue([null, jest.fn()]);

    const { getByTestId } = render(
      <AppShellClient>
        <div data-testid="child">Content</div>
      </AppShellClient>
    );

    expect(getByTestId('child')).toBeInTheDocument();
    expect(getByTestId('child')).toHaveTextContent('Content');
  });

  it('applies custom className when provided', () => {
    (useQueryState as jest.Mock).mockReturnValue([null, jest.fn()]);

    const { container } = render(
      <AppShellClient className="custom-class">
        <div>Content</div>
      </AppShellClient>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('combines custom className with sidebar-hidden class when both are present', () => {
    (useQueryState as jest.Mock).mockReturnValue(['hidden', jest.fn()]);

    const { container } = render(
      <AppShellClient className="custom-class">
        <div>Content</div>
      </AppShellClient>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('sidebar-hidden');
  });

  it('calls useQueryState with sidebar param and parser', () => {
    (useQueryState as jest.Mock).mockReturnValue([null, jest.fn()]);

    render(
      <AppShellClient>
        <div>Content</div>
      </AppShellClient>
    );

    expect(useQueryState).toHaveBeenCalledWith('sidebar', expect.anything());
    expect(parseAsStringLiteral).toHaveBeenCalledWith(['hidden']);
  });
});

