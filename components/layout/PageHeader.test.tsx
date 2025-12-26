import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';
import type { Tag, BillCategoryGroupWithCategories } from '@/lib/types';

jest.mock('./SidebarToggle', () => ({
  SidebarToggle: () => <button data-testid="sidebar-toggle">Toggle</button>,
}));

jest.mock('@/components/features/bills/AddBillButton', () => ({
  AddBillButton: ({ currencySymbol }: { currencySymbol?: string }) => (
    <button data-testid="add-bill-button">{currencySymbol || 'Add'}</button>
  ),
}));

jest.mock('@/components/features/bills/TagFilter', () => ({
  TagFilter: ({ tags }: { tags: Tag[] }) => (
    <div data-testid="tag-filter">{tags.length} tags</div>
  ),
}));

jest.mock('@/components/features/bills/BillSearch', () => ({
  BillSearch: () => <div data-testid="bill-search">Search</div>,
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

const mockTags: Tag[] = [
  {
    id: '1',
    name: 'Utilities',
    slug: 'utilities',
    createdAt: new Date(),
  },
];

describe('PageHeader', () => {
  it('always renders SidebarToggle', () => {
    render(<PageHeader />);

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('does not render AddBillButton when showCreateBill is false', () => {
    render(<PageHeader showCreateBill={false} />);

    expect(screen.queryByTestId('add-bill-button')).not.toBeInTheDocument();
  });

  it('does not render AddBillButton when showCreateBill is true but createBillProps is missing', () => {
    render(<PageHeader showCreateBill={true} />);

    expect(screen.queryByTestId('add-bill-button')).not.toBeInTheDocument();
  });

  it('renders AddBillButton when showCreateBill is true and createBillProps is provided', () => {
    render(
      <PageHeader
        showCreateBill={true}
        createBillProps={{
          currencySymbol: '$',
          categoriesGrouped: mockCategoriesGrouped,
          defaultCategoryId: null,
        }}
      />
    );

    expect(screen.getByTestId('add-bill-button')).toBeInTheDocument();
  });

  it('passes createBillProps to AddBillButton', () => {
    render(
      <PageHeader
        showCreateBill={true}
        createBillProps={{
          currencySymbol: '€',
          categoriesGrouped: mockCategoriesGrouped,
          defaultCategoryId: null,
        }}
      />
    );

    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('does not render TagFilter when showTagFilter is false', () => {
    render(<PageHeader showTagFilter={false} />);

    expect(screen.queryByTestId('tag-filter')).not.toBeInTheDocument();
  });

  it('does not render TagFilter when showTagFilter is true but tags array is empty', () => {
    render(<PageHeader showTagFilter={true} tagFilterTags={[]} />);

    expect(screen.queryByTestId('tag-filter')).not.toBeInTheDocument();
  });

  it('renders TagFilter when showTagFilter is true and tags are provided', () => {
    render(<PageHeader showTagFilter={true} tagFilterTags={mockTags} />);

    expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    expect(screen.getByText('1 tags')).toBeInTheDocument();
  });

  it('renders all components when all props are enabled', () => {
    render(
      <PageHeader
        showCreateBill={true}
        showTagFilter={true}
        createBillProps={{
          currencySymbol: '$',
          categoriesGrouped: mockCategoriesGrouped,
          defaultCategoryId: null,
        }}
        tagFilterTags={mockTags}
      />
    );

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('add-bill-button')).toBeInTheDocument();
    expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
  });

  it('applies double offset (ml-4) to AddBillButton when showCreateBill is true', () => {
    const { container } = render(
      <PageHeader
        showCreateBill={true}
        createBillProps={{
          currencySymbol: '$',
          categoriesGrouped: mockCategoriesGrouped,
          defaultCategoryId: null,
        }}
      />
    );

    const addBillWrapper = container.querySelector('.ml-4');
    expect(addBillWrapper).toBeInTheDocument();
  });

  it('applies standard offset (ml-2) to TagFilter when both showCreateBill and showTagFilter are true', () => {
    const { container } = render(
      <PageHeader
        showCreateBill={true}
        showTagFilter={true}
        createBillProps={{
          currencySymbol: '$',
          categoriesGrouped: mockCategoriesGrouped,
          defaultCategoryId: null,
        }}
        tagFilterTags={mockTags}
      />
    );

    const tagFilterWrapper = container.querySelector('.ml-2');
    expect(tagFilterWrapper).toBeInTheDocument();
  });

  it('applies double offset (ml-4) to TagFilter when showCreateBill is false but showTagFilter is true', () => {
    const { container } = render(
      <PageHeader showTagFilter={true} tagFilterTags={mockTags} />
    );

    const tagFilterWrapper = container.querySelector('.ml-4');
    expect(tagFilterWrapper).toBeInTheDocument();
  });

  it('renders BillSearch by default when showSearch is not specified', () => {
    render(<PageHeader />);

    expect(screen.getByTestId('bill-search')).toBeInTheDocument();
  });

  it('renders BillSearch when showSearch is true', () => {
    render(<PageHeader showSearch={true} />);

    expect(screen.getByTestId('bill-search')).toBeInTheDocument();
  });

  it('does not render BillSearch when showSearch is false', () => {
    render(<PageHeader showSearch={false} />);

    expect(screen.queryByTestId('bill-search')).not.toBeInTheDocument();
  });

  it('renders BillSearch when all components are enabled', () => {
    render(
      <PageHeader
        showCreateBill={true}
        showTagFilter={true}
        showSearch={true}
        createBillProps={{
          currencySymbol: '$',
          categoriesGrouped: mockCategoriesGrouped,
          defaultCategoryId: null,
        }}
        tagFilterTags={mockTags}
      />
    );

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('add-bill-button')).toBeInTheDocument();
    expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    expect(screen.getByTestId('bill-search')).toBeInTheDocument();
  });
});

