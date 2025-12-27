import { render, screen } from '@testing-library/react';
import { MainContent } from './MainContent';

jest.mock('@/components/common/ScrollableContainer', () => ({
  ScrollableContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scrollable-container">{children}</div>
  ),
}));

describe('MainContent', () => {
  it('renders header content', () => {
    render(
      <MainContent header={<h1>Page Header</h1>}>
        <div>Content</div>
      </MainContent>
    );

    expect(screen.getByRole('heading', { name: 'Page Header' })).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <MainContent header={<div>Header</div>}>
        <div>Main Content</div>
      </MainContent>
    );

    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('wraps children in ScrollableContainer', () => {
    render(
      <MainContent header={<div>Header</div>}>
        <div>Content</div>
      </MainContent>
    );

    expect(screen.getByTestId('scrollable-container')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders header and children together', () => {
    render(
      <MainContent
        header={<nav>Navigation</nav>}
      >
        <div>First</div>
        <div>Second</div>
      </MainContent>
    );

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

