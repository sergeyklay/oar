import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingCheckbox } from './SettingCheckbox';

describe('SettingCheckbox', () => {
  const defaultProps = {
    id: 'test-checkbox',
    label: 'Test Setting',
    checked: false,
    onCheckedChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label and switch', () => {
    render(<SettingCheckbox {...defaultProps} />);

    expect(screen.getByText('Test Setting')).toBeInTheDocument();
    const switchElement = document.getElementById('test-checkbox');
    expect(switchElement).toBeInTheDocument();
  });

  it('associates label with switch via htmlFor', () => {
    render(<SettingCheckbox {...defaultProps} />);

    const label = screen.getByText('Test Setting');
    expect(label).toHaveAttribute('for', 'test-checkbox');
  });

  it('renders switch as checked when checked prop is true', () => {
    render(<SettingCheckbox {...defaultProps} checked={true} />);

    const switchElement = document.getElementById('test-checkbox') as HTMLButtonElement;
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });

  it('renders switch as unchecked when checked prop is false', () => {
    render(<SettingCheckbox {...defaultProps} checked={false} />);

    const switchElement = document.getElementById('test-checkbox') as HTMLButtonElement;
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('renders description when provided', () => {
    render(
      <SettingCheckbox
        {...defaultProps}
        description="This is a test description"
      />
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<SettingCheckbox {...defaultProps} />);

    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('calls onCheckedChange when switch is toggled', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    render(<SettingCheckbox {...defaultProps} onCheckedChange={mockOnChange} />);

    const switchElement = document.getElementById('test-checkbox') as HTMLButtonElement;
    await user.click(switchElement);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('disables switch when disabled prop is true', () => {
    render(<SettingCheckbox {...defaultProps} disabled={true} />);

    const switchElement = document.getElementById('test-checkbox') as HTMLButtonElement;
    expect(switchElement).toBeDisabled();
  });

  it('disables switch when isLoading is true', () => {
    render(<SettingCheckbox {...defaultProps} isLoading={true} />);

    const switchElement = document.getElementById('test-checkbox') as HTMLButtonElement;
    expect(switchElement).toBeDisabled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<SettingCheckbox {...defaultProps} isLoading={true} />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('does not show loading spinner when isLoading is false', () => {
    render(<SettingCheckbox {...defaultProps} isLoading={false} />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).not.toBeInTheDocument();
  });
});

