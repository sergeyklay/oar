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

      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('data-state', 'open');
      document.body.appendChild(dialog);

      await user.click(screen.getByRole('button'));
      expect(mockSetSelectedBill).not.toHaveBeenCalled();

      dialog.setAttribute('data-state', 'closed');

      await user.click(screen.getByRole('button'));
      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });

    it('does not call setSelectedBill when click target is inside a dialog', async () => {
      const { container } = renderClickable(false);

      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      const buttonInsideDialog = document.createElement('button');
      buttonInsideDialog.textContent = 'Button inside dialog';
      dialog.appendChild(buttonInsideDialog);
      document.body.appendChild(dialog);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: buttonInsideDialog });

      const row = container.querySelector('tr.bill-row-clickable');
      if (row) {
        row.dispatchEvent(clickEvent);
      }

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });
  });

  describe('popover detection (regression: tag selection sidebar switching)', () => {
    it('does not call setSelectedBill when popover is open (click)', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      const popoverWrapper = document.createElement('div');
      popoverWrapper.setAttribute('data-radix-popper-content-wrapper', '');
      document.body.appendChild(popoverWrapper);

      await user.click(screen.getByRole('button'));

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('does not call setSelectedBill when popover is open (Enter key)', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      const popoverWrapper = document.createElement('div');
      popoverWrapper.setAttribute('data-radix-popper-content-wrapper', '');
      document.body.appendChild(popoverWrapper);

      screen.getByRole('button').focus();
      await user.keyboard('{Enter}');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('does not call setSelectedBill when popover is open (Space key)', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      const popoverWrapper = document.createElement('div');
      popoverWrapper.setAttribute('data-radix-popper-content-wrapper', '');
      document.body.appendChild(popoverWrapper);

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('does not call setSelectedBill when click target is inside popover content', async () => {
      const { container } = renderClickable(false);

      const popoverContent = document.createElement('div');
      popoverContent.setAttribute('data-radix-popover-content', '');
      const buttonInsidePopover = document.createElement('button');
      buttonInsidePopover.textContent = 'Select Tag';
      popoverContent.appendChild(buttonInsidePopover);
      document.body.appendChild(popoverContent);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: buttonInsidePopover });

      const row = container.querySelector('tr.bill-row-clickable');
      if (row) {
        row.dispatchEvent(clickEvent);
      }

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('resumes selection after popover is closed', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      const popoverWrapper = document.createElement('div');
      popoverWrapper.setAttribute('data-radix-popper-content-wrapper', '');
      document.body.appendChild(popoverWrapper);

      await user.click(screen.getByRole('button'));
      expect(mockSetSelectedBill).not.toHaveBeenCalled();

      popoverWrapper.remove();

      await user.click(screen.getByRole('button'));
      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });
  });

  describe('editable element detection (regression: space key in notes textarea)', () => {
    it('does not trigger selection on Space key when textarea is focused', async () => {
      const user = userEvent.setup();
      const { container } = renderClickable(false);

      const textarea = document.createElement('textarea');
      textarea.value = 'test';
      container.querySelector('tr')?.appendChild(textarea);
      textarea.focus();

      await user.keyboard(' ');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
      expect(textarea.value).toBe('test ');
    });

    it('does not trigger selection on Space key when input is focused', async () => {
      const user = userEvent.setup();
      const { container } = renderClickable(false);

      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'test';
      container.querySelector('tr')?.appendChild(input);
      input.focus();

      await user.keyboard(' ');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
      expect(input.value).toBe('test ');
    });

    it('does not trigger selection on Enter key when textarea is focused', async () => {
      const user = userEvent.setup();
      const { container } = renderClickable(false);

      const textarea = document.createElement('textarea');
      textarea.value = 'test';
      container.querySelector('tr')?.appendChild(textarea);
      textarea.focus();

      await user.keyboard('{Enter}');

      expect(mockSetSelectedBill).not.toHaveBeenCalled();
    });

    it('still triggers selection on Space key when row itself is focused (not editable element)', async () => {
      const user = userEvent.setup();
      renderClickable(false);

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(mockSetSelectedBill).toHaveBeenCalledWith('bill-1');
    });
  });
});
