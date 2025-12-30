import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewOptionsForm } from './ViewOptionsForm';
import { updateViewOptions } from '@/actions/settings';

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
  initialIncludeAutoPayInDueSoon: true,
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
      expect(
        screen.getByText('Show automatic bills in Due Soon and Due This Month views')
      ).toBeInTheDocument();
    });

    it('associates include auto pay label with switch via htmlFor', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      const label = screen.getByText('Include automatic bills in bills due soon');
      const switchElement = document.getElementById('include-autopay-toggle');

      expect(label).toHaveAttribute('for', 'include-autopay-toggle');
      expect(switchElement).toBeInTheDocument();
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
          initialIncludeAutoPayInDueSoon={true}
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

  describe('include auto pay toggle', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('displays initial include auto pay value as checked when true', () => {
      render(<ViewOptionsForm {...defaultProps} />);

      const switchElement = document.getElementById('include-autopay-toggle') as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('displays initial include auto pay value as unchecked when false', () => {
      render(
        <ViewOptionsForm
          {...defaultProps}
          initialIncludeAutoPayInDueSoon={false}
        />
      );

      const switchElement = document.getElementById('include-autopay-toggle') as HTMLButtonElement;
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('toggles include auto pay setting when switch is clicked', async () => {
      const user = userEvent.setup();
      (updateViewOptions as jest.Mock).mockResolvedValue({ success: true });

      render(<ViewOptionsForm {...defaultProps} />);

      const switchElement = document.getElementById('include-autopay-toggle') as HTMLButtonElement;
      await user.click(switchElement);

      await waitFor(() => {
        expect(updateViewOptions).toHaveBeenCalledWith({
          currency: 'USD',
          locale: 'en-US',
          weekStart: 0,
          includeAutoPayInDueSoon: false,
        });
      });
    });

    it('toggles from false to true when switch is clicked', async () => {
      const user = userEvent.setup();
      (updateViewOptions as jest.Mock).mockResolvedValue({ success: true });

      render(
        <ViewOptionsForm
          {...defaultProps}
          initialIncludeAutoPayInDueSoon={false}
        />
      );

      const switchElement = document.getElementById('include-autopay-toggle') as HTMLButtonElement;
      await user.click(switchElement);

      await waitFor(() => {
        expect(updateViewOptions).toHaveBeenCalledWith({
          currency: 'USD',
          locale: 'en-US',
          weekStart: 0,
          includeAutoPayInDueSoon: true,
        });
      });
    });

    it('shows loading indicator while updating include auto pay setting', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: { success: boolean }) => void;
      const updatePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });
      (updateViewOptions as jest.Mock).mockReturnValue(updatePromise);

      render(<ViewOptionsForm {...defaultProps} />);

      const switchElement = document.getElementById('include-autopay-toggle') as HTMLButtonElement;
      await user.click(switchElement);

      await waitFor(() => {
        const loader = document.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
      });

      resolveUpdate!({ success: true });
      await waitFor(() => {
        expect(updateViewOptions).toHaveBeenCalled();
      });
    });

    it('disables switch while update is pending', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: { success: boolean }) => void;
      const updatePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });
      (updateViewOptions as jest.Mock).mockReturnValue(updatePromise);

      render(<ViewOptionsForm {...defaultProps} />);

      const switchElement = document.getElementById('include-autopay-toggle') as HTMLButtonElement;
      await user.click(switchElement);

      await waitFor(() => {
        expect(switchElement).toBeDisabled();
      });

      resolveUpdate!({ success: true });
      await waitFor(() => {
        expect(updateViewOptions).toHaveBeenCalled();
      });
    });
  });
});
