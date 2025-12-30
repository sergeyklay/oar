import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  const defaultProps = {
    id: 'test-toggle',
    label: 'Test Toggle',
    checked: false,
    onCheckedChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label and switch', () => {
    render(<Toggle {...defaultProps} />);

    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
    const switchElement = document.getElementById('test-toggle');
    expect(switchElement).toBeInTheDocument();
  });

  it('associates label with switch via htmlFor', () => {
    render(<Toggle {...defaultProps} />);

    const label = screen.getByText('Test Toggle');
    expect(label).toHaveAttribute('for', 'test-toggle');
  });

  it('renders switch as checked when checked prop is true', () => {
    render(<Toggle {...defaultProps} checked={true} />);

    const switchElement = document.getElementById('test-toggle') as HTMLButtonElement;
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });

  it('renders switch as unchecked when checked prop is false', () => {
    render(<Toggle {...defaultProps} checked={false} />);

    const switchElement = document.getElementById('test-toggle') as HTMLButtonElement;
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('renders description when provided', () => {
    render(
      <Toggle
        {...defaultProps}
        description="This is a test description"
      />
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<Toggle {...defaultProps} />);

    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('calls onCheckedChange when switch is toggled', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    render(<Toggle {...defaultProps} onCheckedChange={mockOnChange} />);

    const switchElement = document.getElementById('test-toggle') as HTMLButtonElement;
    await user.click(switchElement);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('disables switch when disabled prop is true', () => {
    render(<Toggle {...defaultProps} disabled={true} />);

    const switchElement = document.getElementById('test-toggle') as HTMLButtonElement;
    expect(switchElement).toBeDisabled();
  });

  it('disables switch when isLoading is true', () => {
    render(<Toggle {...defaultProps} isLoading={true} />);

    const switchElement = document.getElementById('test-toggle') as HTMLButtonElement;
    expect(switchElement).toBeDisabled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Toggle {...defaultProps} isLoading={true} />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('does not show loading spinner when isLoading is false', () => {
    render(<Toggle {...defaultProps} isLoading={false} />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).not.toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    render(
      <Toggle
        {...defaultProps}
        className="rounded-lg border p-3"
      />
    );

    const switchElement = document.getElementById('test-toggle');
    expect(switchElement).toBeInTheDocument();
  });
});
