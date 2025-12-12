import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloseDetailButton } from './CloseDetailButton';

const mockSetSelectedBill = jest.fn();

jest.mock('nuqs', () => ({
  useQueryState: () => [null, mockSetSelectedBill],
  parseAsString: {
    withOptions: () => ({}),
  },
}));

describe('CloseDetailButton', () => {
  beforeEach(() => {
    mockSetSelectedBill.mockClear();
  });

  it('renders a button with accessible label', () => {
    render(<CloseDetailButton />);

    expect(screen.getByRole('button', { name: /close bill detail/i })).toBeInTheDocument();
  });

  it('calls setSelectedBill with null when clicked', async () => {
    const user = userEvent.setup();
    render(<CloseDetailButton />);

    await user.click(screen.getByRole('button', { name: /close bill detail/i }));

    expect(mockSetSelectedBill).toHaveBeenCalledWith(null);
  });

  it('calls setSelectedBill exactly once per click', async () => {
    const user = userEvent.setup();
    render(<CloseDetailButton />);

    const closeButton = screen.getByRole('button', { name: /close bill detail/i });
    await user.click(closeButton);
    await user.click(closeButton);

    expect(mockSetSelectedBill).toHaveBeenCalledTimes(2);
  });
});

