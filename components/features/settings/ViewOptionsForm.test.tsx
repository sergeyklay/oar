import { render, screen } from '@testing-library/react';
import { ViewOptionsForm } from './ViewOptionsForm';

jest.mock('@/actions/settings', () => ({
  updateViewOptions: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const defaultProps = {
  initialCurrency: 'USD',
  initialLocale: 'en-US',
  initialWeekStart: 0,
};

describe('ViewOptionsForm', () => {
  describe('accessibility', () => {
    it('associates currency label with select via htmlFor', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      const label = screen.getByText('Default Currency');
      const trigger = document.getElementById('currency-select');

      expect(label).toHaveAttribute('for', 'currency-select');
      expect(trigger).toBeInTheDocument();
    });

    it('associates locale label with select via htmlFor', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      const label = screen.getByText('Default Locale');
      const trigger = document.getElementById('locale-select');

      expect(label).toHaveAttribute('for', 'locale-select');
      expect(trigger).toBeInTheDocument();
    });

    it('associates week start label with select via htmlFor', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      const label = screen.getByText('Start of Week');
      const trigger = document.getElementById('weekstart-select');

      expect(label).toHaveAttribute('for', 'weekstart-select');
      expect(trigger).toBeInTheDocument();
    });

    it('has description elements with proper ids', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      expect(document.getElementById('currency-description')).toBeInTheDocument();
      expect(document.getElementById('locale-description')).toBeInTheDocument();
      expect(document.getElementById('weekstart-description')).toBeInTheDocument();
    });
  });

  describe('initial display', () => {
    it('displays initial currency value', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      expect(screen.getByText('USD ($)')).toBeInTheDocument();
    });

    it('displays initial locale value', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      expect(screen.getByText('English (United States)')).toBeInTheDocument();
    });

    it('displays initial week start value', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      expect(screen.getByText('Sunday')).toBeInTheDocument();
    });

    it('renders with different initial values', () => {
      render(
        <ViewOptionsForm
          initialCurrency="EUR"
          initialLocale="de-DE"
          initialWeekStart={1}
        />
      );

      expect(screen.getByText('EUR (€)')).toBeInTheDocument();
      expect(screen.getByText('German (Germany)')).toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });
  });

  describe('comboboxes', () => {
    it('renders all three comboboxes', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      const comboboxes = screen.getAllByRole('combobox');

      expect(comboboxes).toHaveLength(3);
    });

    it('associates labels with comboboxes for screen readers', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      expect(screen.getByRole('combobox', { name: /default currency/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /default locale/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /start of week/i })).toBeInTheDocument();
    });
  });
});
