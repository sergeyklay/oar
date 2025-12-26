import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';
import type { Tag, BillCategoryGroupWithCategories } from '@/lib/types';

jest.mock('./SidebarToggle', () => ({
  SidebarToggle: () => (
    <button aria-label="Hide sidebar" type="button">
      SidebarToggle
    </button>
  ),
}));

jest.mock('@/components/features/bills/AddBillButton', () => ({
  AddBillButton: ({
    currencySymbol,
    availableTags,
    categoriesGrouped,
    defaultCategoryId,
  }: {
    currencySymbol?: string;
    availableTags?: Tag[];
    categoriesGrouped: BillCategoryGroupWithCategories[];
    defaultCategoryId: string | null;
  }) => (
    <button
      type="button"
      aria-label="Add Bill"
      data-currency-symbol={currencySymbol}
      data-available-tags={JSON.stringify(availableTags)}
      data-categories-grouped={JSON.stringify(categoriesGrouped)}
      data-default-category-id={defaultCategoryId}
    >
      AddBillButton
    </button>
  ),
}));

jest.mock('@/components/features/bills/TagFilter', () => ({
  TagFilter: ({ tags }: { tags: Tag[] }) => (
    <button type="button" aria-label="Filter bills" data-tags={JSON.stringify(tags)}>
      TagFilter
    </button>
  ),
}));

jest.mock('@/components/features/bills/BillSearch', () => ({
  BillSearch: () => (
    <input type="text" placeholder="Search" aria-label="Search bills" />
  ),
}));

describe('PageHeader', () => {
  const createMockCategoryGroup = (
    id: string,
    name: string,
    categoryId: string = 'cat-1'
  ): BillCategoryGroupWithCategories => ({
    id,
    name,
    slug: id,
    displayOrder: 1,
    createdAt: new Date(),
    categories: [
      {
        id: categoryId,
        name: 'Category 1',
        slug: 'category-1',
        icon: 'icon-1',
        groupId: id,
        displayOrder: 1,
        createdAt: new Date(),
      },
    ],
  });

  const createMockTag = (id: string, name: string): Tag => ({
    id,
    name,
    slug: id,
    createdAt: new Date(),
  });

  const defaultCategoriesGrouped: BillCategoryGroupWithCategories[] = [
    createMockCategoryGroup('group-1', 'Group 1'),
  ];

  const defaultTags: Tag[] = [
    createMockTag('tag-1', 'Tag 1'),
    createMockTag('tag-2', 'Tag 2'),
  ];

  describe('component rendering', () => {
    it('renders SidebarToggle always', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.getByRole('button', { name: /hide sidebar/i })).toBeInTheDocument();
    });

    it('renders BillSearch always', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Search bills')).toBeInTheDocument();
    });

    it('renders all components when all props are provided', () => {
      render(
        <PageHeader
          currencySymbol="$"
          categoriesGrouped={defaultCategoriesGrouped}
          availableTags={defaultTags}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.getByRole('button', { name: /hide sidebar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add bill/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter bills/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  describe('AddBillButton rendering', () => {
    it('renders AddBillButton when categoriesGrouped is provided', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.getByRole('button', { name: /add bill/i })).toBeInTheDocument();
    });

    it('renders AddBillButton when categoriesGrouped is empty array', () => {
      render(<PageHeader categoriesGrouped={[]} defaultCategoryId={null} />);

      expect(screen.getByRole('button', { name: /add bill/i })).toBeInTheDocument();
    });

    it('does not render AddBillButton when categoriesGrouped is undefined', () => {
      render(
        <PageHeader
          categoriesGrouped={undefined as unknown as BillCategoryGroupWithCategories[]}
          defaultCategoryId={null}
        />
      );

      expect(screen.queryByRole('button', { name: /add bill/i })).not.toBeInTheDocument();
    });
  });

  describe('TagFilter rendering', () => {
    it('renders TagFilter when availableTags has items', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          availableTags={defaultTags}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.getByRole('button', { name: /filter bills/i })).toBeInTheDocument();
    });

    it('does not render TagFilter when availableTags is empty array', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          availableTags={[]}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.queryByRole('button', { name: /filter bills/i })).not.toBeInTheDocument();
    });

    it('does not render TagFilter when availableTags is undefined', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId="cat-1"
        />
      );

      expect(screen.queryByRole('button', { name: /filter bills/i })).not.toBeInTheDocument();
    });
  });

  describe('prop passing', () => {
    it('passes all props to AddBillButton correctly', () => {
      const currencySymbol = '$';
      const categoriesGrouped = defaultCategoriesGrouped;
      const availableTags = defaultTags;
      const defaultCategoryId = 'cat-1';

      render(
        <PageHeader
          currencySymbol={currencySymbol}
          categoriesGrouped={categoriesGrouped}
          availableTags={availableTags}
          defaultCategoryId={defaultCategoryId}
        />
      );

      const addBillButton = screen.getByRole('button', { name: /add bill/i });
      expect(addBillButton).toHaveAttribute('data-currency-symbol', currencySymbol);
      expect(addBillButton).toHaveAttribute('data-default-category-id', defaultCategoryId);

      const categoriesAttr = addBillButton.getAttribute('data-categories-grouped');
      expect(categoriesAttr).toBeTruthy();
      const parsedCategories = JSON.parse(categoriesAttr || '[]');
      expect(parsedCategories).toHaveLength(categoriesGrouped.length);
      expect(parsedCategories[0].id).toBe(categoriesGrouped[0].id);
      expect(parsedCategories[0].name).toBe(categoriesGrouped[0].name);

      const tagsAttr = addBillButton.getAttribute('data-available-tags');
      expect(tagsAttr).toBeTruthy();
      const parsedTags = JSON.parse(tagsAttr || '[]');
      expect(parsedTags).toHaveLength(availableTags.length);
      expect(parsedTags[0].id).toBe(availableTags[0].id);
    });

    it('passes availableTags to TagFilter correctly', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          availableTags={defaultTags}
          defaultCategoryId="cat-1"
        />
      );

      const tagFilter = screen.getByRole('button', { name: /filter bills/i });
      const tagsAttr = tagFilter.getAttribute('data-tags');
      expect(tagsAttr).toBeTruthy();

      const parsedTags = JSON.parse(tagsAttr || '[]');
      expect(parsedTags).toHaveLength(2);
      expect(parsedTags[0]).toMatchObject({ id: 'tag-1', name: 'Tag 1' });
      expect(parsedTags[1]).toMatchObject({ id: 'tag-2', name: 'Tag 2' });
    });

    it('passes undefined currencySymbol when not provided', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId="cat-1"
        />
      );

      const addBillButton = screen.getByRole('button', { name: /add bill/i });
      expect(addBillButton.getAttribute('data-currency-symbol')).toBeNull();
    });
  });

  describe('layout structure', () => {
    it('renders header with correct flex layout classes', () => {
      const { container } = render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId="cat-1"
        />
      );

      const headerWrapper = container.firstChild as HTMLElement;
      expect(headerWrapper).toHaveClass('flex', 'items-center', 'w-full');
    });

    it('applies correct spacing when all components are present', () => {
      const { container } = render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          availableTags={defaultTags}
          defaultCategoryId="cat-1"
        />
      );

      const addBillWrapper = container.querySelector('.ml-4');
      expect(addBillWrapper).toBeInTheDocument();
      expect(
        addBillWrapper?.querySelector('button[aria-label="Add Bill"]')
      ).toBeInTheDocument();

      const tagFilterWrapper = container.querySelector('.ml-2');
      expect(tagFilterWrapper).toBeInTheDocument();
      expect(
        tagFilterWrapper?.querySelector('button[aria-label="Filter bills"]')
      ).toBeInTheDocument();

      const billSearchWrapper = container.querySelector('.ml-auto');
      expect(billSearchWrapper).toBeInTheDocument();
      expect(billSearchWrapper?.querySelector('input[placeholder="Search"]')).toBeInTheDocument();
    });

    it('applies ml-4 spacing to TagFilter when AddBillButton is absent', () => {
      const { container } = render(
        <PageHeader
          categoriesGrouped={undefined as unknown as BillCategoryGroupWithCategories[]}
          availableTags={defaultTags}
          defaultCategoryId={null}
        />
      );

      const tagFilterWrappers = container.querySelectorAll('.ml-4');
      const tagFilterWrapper = Array.from(tagFilterWrappers).find((el) =>
        el.querySelector('button[aria-label="Filter bills"]')
      );
      expect(tagFilterWrapper).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('renders minimal header with only required components', () => {
      render(<PageHeader categoriesGrouped={[]} defaultCategoryId={null} />);

      expect(screen.getByRole('button', { name: /hide sidebar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add bill/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /filter bills/i })).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('handles null defaultCategoryId correctly', () => {
      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          defaultCategoryId={null}
        />
      );

      const addBillButton = screen.getByRole('button', { name: /add bill/i });
      expect(addBillButton.getAttribute('data-default-category-id')).toBeNull();
    });

    it('handles multiple category groups correctly', () => {
      const multipleGroups: BillCategoryGroupWithCategories[] = [
        createMockCategoryGroup('group-1', 'Group 1', 'cat-1'),
        createMockCategoryGroup('group-2', 'Group 2', 'cat-2'),
      ];

      render(
        <PageHeader
          categoriesGrouped={multipleGroups}
          defaultCategoryId="cat-1"
        />
      );

      const addBillButton = screen.getByRole('button', { name: /add bill/i });
      const categoriesAttr = addBillButton.getAttribute('data-categories-grouped');
      const parsedCategories = JSON.parse(categoriesAttr || '[]');
      expect(parsedCategories).toHaveLength(2);
    });

    it('handles large number of tags correctly', () => {
      const manyTags: Tag[] = Array.from({ length: 50 }, (_, i) =>
        createMockTag(`tag-${i}`, `Tag ${i}`)
      );

      render(
        <PageHeader
          categoriesGrouped={defaultCategoriesGrouped}
          availableTags={manyTags}
          defaultCategoryId="cat-1"
        />
      );

      const tagFilter = screen.getByRole('button', { name: /filter bills/i });
      const tagsAttr = tagFilter.getAttribute('data-tags');
      const parsedTags = JSON.parse(tagsAttr || '[]');
      expect(parsedTags).toHaveLength(50);
    });
  });
});
