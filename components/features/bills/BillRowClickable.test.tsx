import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillRowClickable } from './BillRowClickable';

const mockSetSelectedBill = jest.fn();

jest.mock('nuqs', () => ({
  useQueryState: () => [null, mockSetSelectedBill],
  parseAsString: {
    withOptions: () => ({}),
  },
}));

describe('BillRowClickable', () => {
  beforeEach(() => {
    mockSetSelectedBill.mockClear();
    // Clean up any dialogs from previous tests
    document.body.innerHTML = '';
  });

  const renderClickable = (isSelected = false) => {
    return render(
      <table>
        <tbody>
          <BillRowClickable billId="bill-1" isSelected={isSelected}>
            <td>Test Content</td>
          </BillRowClickable>
        </tbody>
      </table>
    );
  };

  describe('click behavior', () => {
    it('calls setSelectedBill with billId when not selected', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      await user.click(screen.getByRole('button'));

      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });

    it('calls setSelectedBill with null when already selected (toggle off)', async () => {
      const user = userEvent.setup();
      renderClickable(true);

      await user.click(screen.getByRole('button'));

      expect(mockSetSelectedBill).toHaveBeenCalledWith(null);
    });
  });

  describe('keyboard accessibility', () => {
    it('triggers selection on Enter key', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      screen.getByRole('button').focus();
      await user.keyboard('{Enter}');

      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });

    it('triggers selection on Space key', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });
  });

  describe('selection state', () => {
    it('sets data-selected to true when selected', () => {
      renderClickable(true);

      expect(screen.getByRole('button')).toHaveAttribute('data-selected', 'true');
    });

    it('sets data-selected to false when not selected', () => {
      renderClickable(false);

      expect(screen.getByRole('button')).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('children rendering', () => {
    it('renders children inside the row', () => {
      renderClickable(false);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('dialog detection (regression: tag selection sidebar switching)', () => {
    it('does not call setSelectedBill when an open dialog exists', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      // Simulate an open dialog in the DOM (like Edit Bill dialog)
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('data-state', 'open');
      document.body.appendChild(dialog);

      await user.click(screen.getByRole('button'));

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('does not trigger selection on Enter key when dialog is open', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      // Simulate an open dialog
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('data-state', 'open');
      document.body.appendChild(dialog);

      screen.getByRole('button').focus();
      await user.keyboard('{Enter}');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('does not trigger selection on Space key when dialog is open', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      // Simulate an open dialog
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('data-state', 'open');
      document.body.appendChild(dialog);

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('resumes normal selection after dialog is closed', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      // Simulate an open dialog
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('data-state', 'open');
      document.body.appendChild(dialog);

      await user.click(screen.getByRole('button'));
      expect(mockSetSelectedBill).not.toHaveBeenCalled();

      // Close the dialog (change state or remove)
      dialog.setAttribute('data-state', 'closed');

      await user.click(screen.getByRole('button'));
      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });

    it('does not call setSelectedBill when click target is inside a dialog', async () => {
      const { container } = renderClickable(false);

      // Simulate a dialog with content inside
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      const buttonInsideDialog = document.createElement('button');
      buttonInsideDialog.textContent = 'Button inside dialog';
      dialog.appendChild(buttonInsideDialog);
      document.body.appendChild(dialog);

      // Simulate clicking the button inside the dialog
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: buttonInsideDialog });

      // Get the row element directly from the container
      const row = container.querySelector('tr.bill-row-clickable');
      if (row) {
        row.dispatchEvent(clickEvent);
      }

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('does not call setSelectedBill when click target is inside a popover (uses role="dialog")', async () => {
      const { container } = renderClickable(false);

      // Simulate a Radix Popover (which uses role="dialog" for accessibility)
      const popover = document.createElement('div');
      popover.setAttribute('role', 'dialog');
      const popoverContent = document.createElement('div');
      popoverContent.textContent = 'Popover content';
      popover.appendChild(popoverContent);
      document.body.appendChild(popover);

      // Simulate clicking content inside the popover
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: popoverContent });

      const row = container.querySelector('tr.bill-row-clickable');
      if (row) {
        row.dispatchEvent(clickEvent);
      }

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });
  });
});
