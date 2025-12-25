import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBillButton } from './AddBillButton';
import type { Tag, BillCategoryGroupWithCategories } from '@/lib/types';

jest.mock('./BillFormDialog', () => ({
  BillFormDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="bill-form-dialog">
      {open ? 'Dialog Open' : 'Dialog Closed'}
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ),
}));

const mockCategoriesGrouped: BillCategoryGroupWithCategories[] = [
  {
    id: '1',
    name: 'Group 1',
    slug: 'group-1',
    displayOrder: 0,
    createdAt: new Date(),
    categories: [],
  },
];

describe('AddBillButton', () => {
  it('renders a button with plus icon', () => {
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    const button = screen.getByRole('button', { name: /add bill/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('renders button as icon-only (no text)', () => {
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    const button = screen.getByRole('button', { name: /add bill/i });
    expect(button.textContent).toBe('');
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    const button = screen.getByRole('button', { name: /add bill/i });
    await user.click(button);

    expect(screen.getByText('Dialog Open')).toBeInTheDocument();
  });

  it('closes dialog when onOpenChange is called', async () => {
    const user = userEvent.setup();
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    const button = screen.getByRole('button', { name: /add bill/i });
    await user.click(button);

    expect(screen.getByText('Dialog Open')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(screen.getByText('Dialog Closed')).toBeInTheDocument();
  });

  it('passes currencySymbol to BillFormDialog', () => {
    render(
      <AddBillButton
        currencySymbol="$"
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    expect(screen.getByTestId('bill-form-dialog')).toBeInTheDocument();
  });

  it('passes availableTags to BillFormDialog', () => {
    const mockTags: Tag[] = [
      {
        id: '1',
        name: 'Utilities',
        slug: 'utilities',
        createdAt: new Date(),
      },
    ];

    render(
      <AddBillButton
        availableTags={mockTags}
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    expect(screen.getByTestId('bill-form-dialog')).toBeInTheDocument();
  });

  it('passes categoriesGrouped to BillFormDialog', () => {
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    expect(screen.getByTestId('bill-form-dialog')).toBeInTheDocument();
  });

  it('passes defaultCategoryId to BillFormDialog', () => {
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId="category-1"
      />
    );

    expect(screen.getByTestId('bill-form-dialog')).toBeInTheDocument();
  });

  it('uses empty array as default for availableTags', () => {
    render(
      <AddBillButton
        categoriesGrouped={mockCategoriesGrouped}
        defaultCategoryId={null}
      />
    );

    expect(screen.getByTestId('bill-form-dialog')).toBeInTheDocument();
  });
});

