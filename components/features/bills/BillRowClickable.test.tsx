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
});

