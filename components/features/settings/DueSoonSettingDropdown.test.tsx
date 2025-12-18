import { render, screen } from '@testing-library/react';
import { DueSoonSettingDropdown } from './DueSoonSettingDropdown';

jest.mock('@/actions/settings', () => ({
  updateDueSoonRange: jest.fn(),
}));
jest.mock('@/lib/constants', () => ({
  RANGE_LABELS: {
    '0': 'Today',
    '1': 'Today or tomorrow',
    '3': 'In next 3 days',
    '5': 'In next 5 days',
    '7': 'In next 7 days',
    '10': 'In next 10 days',
    '14': 'In next 14 days',
    '20': 'In next 20 days',
    '30': 'In next 30 days',
  },
}));

describe('DueSoonSettingDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with current value', () => {
    render(<DueSoonSettingDropdown currentValue="7" />);

    expect(screen.getByText('In next 7 days')).toBeInTheDocument();
  });

  it('displays correct label for current value', () => {
    render(<DueSoonSettingDropdown currentValue="14" />);

    expect(screen.getByText('In next 14 days')).toBeInTheDocument();
  });

  it('displays fallback value when label not found', () => {
    render(<DueSoonSettingDropdown currentValue="unknown" />);

    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('renders select component', () => {
    render(<DueSoonSettingDropdown currentValue="7" />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

