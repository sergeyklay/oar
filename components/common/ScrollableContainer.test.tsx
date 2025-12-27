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

  it('applies bill-list-container class by default', () => {
    const { container } = render(
      <ScrollableContainer>
        <div>Content</div>
      </ScrollableContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bill-list-container');
  });

  it('merges additional className with bill-list-container class', () => {
    const { container } = render(
      <ScrollableContainer className="custom-class">
        <div>Content</div>
      </ScrollableContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bill-list-container');
    expect(wrapper).toHaveClass('custom-class');
  });
});

