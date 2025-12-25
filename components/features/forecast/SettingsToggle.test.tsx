import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQueryStates, parseAsBoolean } from 'nuqs';
import { SettingsToggle } from './SettingsToggle';

jest.mock('nuqs', () => ({
  useQueryStates: jest.fn(),
  parseAsBoolean: {
    withDefault: jest.fn((defaultValue) => ({
      parse: (v: string | null) => (v === null ? defaultValue : v === 'true'),
      serialize: (v: boolean) => (v ? 'true' : 'false'),
    })),
  },
}));

describe('SettingsToggle', () => {
  const mockSetParams = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryStates as jest.Mock).mockReturnValue([
      { showAmortization: true, showEstimates: true },
      mockSetParams,
    ]);
  });

  async function renderAndOpenPopover(
    initialState = { showAmortization: true, showEstimates: true }
  ) {
    (useQueryStates as jest.Mock).mockReturnValue([initialState, mockSetParams]);

    const user = userEvent.setup();
    render(<SettingsToggle />);

    const button = screen.getByRole('button', { name: /forecast settings/i });
    await user.click(button);

    const amortizationCheckbox = screen.getByLabelText(/show amount to save/i);
    const estimatesCheckbox = screen.getByLabelText(/show estimates/i);

    return { user, amortizationCheckbox, estimatesCheckbox };
  }

  it('renders settings button with accessible label', () => {
    render(<SettingsToggle />);

    expect(screen.getByRole('button', { name: /forecast settings/i })).toBeInTheDocument();
  });

  it('calls useQueryStates with correct parsers and shallow: false', () => {
    render(<SettingsToggle />);

    expect(useQueryStates).toHaveBeenCalledWith(
      {
        showAmortization: expect.anything(),
        showEstimates: expect.anything(),
      },
      { shallow: false }
    );
    expect(parseAsBoolean.withDefault).toHaveBeenCalledWith(true);
  });

  describe('button active state', () => {
    it('shows default variant when both settings are enabled', () => {
      (useQueryStates as jest.Mock).mockReturnValue([
        { showAmortization: true, showEstimates: true },
        mockSetParams,
      ]);

      render(<SettingsToggle />);

      const button = screen.getByRole('button', { name: /forecast settings/i });
      expect(button).toHaveClass('border-input');
    });

    it('shows active variant when showAmortization is disabled', () => {
      (useQueryStates as jest.Mock).mockReturnValue([
        { showAmortization: false, showEstimates: true },
        mockSetParams,
      ]);

      render(<SettingsToggle />);

      const button = screen.getByRole('button', { name: /forecast settings/i });
      expect(button).not.toHaveClass('border-input');
    });

    it('shows active variant when showEstimates is disabled', () => {
      (useQueryStates as jest.Mock).mockReturnValue([
        { showAmortization: true, showEstimates: false },
        mockSetParams,
      ]);

      render(<SettingsToggle />);

      const button = screen.getByRole('button', { name: /forecast settings/i });
      expect(button).not.toHaveClass('border-input');
    });

    it('shows active variant when both settings are disabled', () => {
      (useQueryStates as jest.Mock).mockReturnValue([
        { showAmortization: false, showEstimates: false },
        mockSetParams,
      ]);

      render(<SettingsToggle />);

      const button = screen.getByRole('button', { name: /forecast settings/i });
      expect(button).not.toHaveClass('border-input');
    });
  });

  describe('popover interactions', () => {
    it('opens popover when button is clicked', async () => {
      await renderAndOpenPopover();

      expect(screen.getByText(/display options/i)).toBeInTheDocument();
      expect(screen.getByText(/control which columns are visible/i)).toBeInTheDocument();
    });

    it('displays both checkboxes with correct labels', async () => {
      await renderAndOpenPopover();

      expect(screen.getByLabelText(/show amount to save/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show estimates/i)).toBeInTheDocument();
    });

    it('shows checkboxes as checked when both settings are enabled', async () => {
      const { amortizationCheckbox, estimatesCheckbox } = await renderAndOpenPopover();

      expect(amortizationCheckbox).toBeChecked();
      expect(estimatesCheckbox).toBeChecked();
    });

    it('shows checkboxes as unchecked when settings are disabled', async () => {
      const { amortizationCheckbox, estimatesCheckbox } = await renderAndOpenPopover({
        showAmortization: false,
        showEstimates: false,
      });

      expect(amortizationCheckbox).not.toBeChecked();
      expect(estimatesCheckbox).not.toBeChecked();
    });
  });

  describe('independent checkbox toggling', () => {
    it('updates showAmortization when its checkbox is toggled', async () => {
      const { user, amortizationCheckbox } = await renderAndOpenPopover();

      await user.click(amortizationCheckbox);

      expect(mockSetParams).toHaveBeenCalledWith({ showAmortization: false });
    });

    it('updates showEstimates when its checkbox is toggled', async () => {
      const { user, estimatesCheckbox } = await renderAndOpenPopover();

      await user.click(estimatesCheckbox);

      expect(mockSetParams).toHaveBeenCalledWith({ showEstimates: false });
    });

    it('allows toggling showAmortization without affecting showEstimates', async () => {
      const { user, amortizationCheckbox } = await renderAndOpenPopover();

      await user.click(amortizationCheckbox);

      expect(mockSetParams).toHaveBeenCalledWith({ showAmortization: false });
      expect(mockSetParams).not.toHaveBeenCalledWith(
        expect.objectContaining({ showEstimates: expect.anything() })
      );
    });

    it('allows toggling showEstimates without affecting showAmortization', async () => {
      const { user, estimatesCheckbox } = await renderAndOpenPopover();

      await user.click(estimatesCheckbox);

      expect(mockSetParams).toHaveBeenCalledWith({ showEstimates: false });
      expect(mockSetParams).not.toHaveBeenCalledWith(
        expect.objectContaining({ showAmortization: expect.anything() })
      );
    });

    it('can toggle both checkboxes independently in sequence', async () => {
      const { user, amortizationCheckbox, estimatesCheckbox } = await renderAndOpenPopover();

      await user.click(amortizationCheckbox);
      expect(mockSetParams).toHaveBeenNthCalledWith(1, { showAmortization: false });

      await user.click(estimatesCheckbox);
      expect(mockSetParams).toHaveBeenNthCalledWith(2, { showEstimates: false });

      expect(mockSetParams).toHaveBeenCalledTimes(2);
    });
  });

  describe('URL param updates', () => {
    it('updates URL param correctly when enabling showAmortization', async () => {
      const { user, amortizationCheckbox } = await renderAndOpenPopover({
        showAmortization: false,
        showEstimates: true,
      });

      await user.click(amortizationCheckbox);

      expect(mockSetParams).toHaveBeenCalledWith({ showAmortization: true });
    });

    it('updates URL param correctly when enabling showEstimates', async () => {
      const { user, estimatesCheckbox } = await renderAndOpenPopover({
        showAmortization: true,
        showEstimates: false,
      });

      await user.click(estimatesCheckbox);

      expect(mockSetParams).toHaveBeenCalledWith({ showEstimates: true });
    });
  });
});

