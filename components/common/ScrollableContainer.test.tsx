import { render, screen } from '@testing-library/react';
import { ScrollableContainer } from './ScrollableContainer';

describe('ScrollableContainer', () => {
  it('renders children', () => {
    render(
      <ScrollableContainer>
        <div>Test Content</div>
      </ScrollableContainer>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ScrollableContainer>
        <div>First</div>
        <div>Second</div>
      </ScrollableContainer>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders children when className prop is provided', () => {
    render(
      <ScrollableContainer className="custom-class">
        <div>Content</div>
      </ScrollableContainer>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

