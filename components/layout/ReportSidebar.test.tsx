import { render, screen } from '@testing-library/react';
import { ReportSidebar } from './ReportSidebar';

jest.mock('@/components/common/ScrollableContainer', () => ({
  ScrollableContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scrollable-container">{children}</div>
  ),
}));

describe('ReportSidebar', () => {
  it('renders children', () => {
    render(
      <ReportSidebar>
        <div>Test Content</div>
      </ReportSidebar>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('wraps children in ScrollableContainer', () => {
    render(
      <ReportSidebar>
        <div>Content</div>
      </ReportSidebar>
    );

    expect(screen.getByTestId('scrollable-container')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ReportSidebar>
        <div>First</div>
        <div>Second</div>
      </ReportSidebar>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

