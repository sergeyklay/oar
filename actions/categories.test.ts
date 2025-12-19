import { getCategoriesGrouped, getAllCategoriesGrouped, getDefaultCategoryId } from './categories';
import { db, resetDbMocks, billCategoryGroups, billCategories } from '@/db';
import type { BillCategoryGroup, BillCategory } from '@/db/schema';

jest.mock('@/db');

const mockGroups: BillCategoryGroup[] = [
  { id: 'group-1', name: 'Housing', slug: 'housing', displayOrder: 1, createdAt: new Date() },
  { id: 'group-2', name: 'Utilities', slug: 'utilities', displayOrder: 2, createdAt: new Date() },
];

const mockSystemGroup: BillCategoryGroup = {
  id: 'group-system',
  name: 'System',
  slug: 'system',
  displayOrder: 999,
  createdAt: new Date(),
};

const mockCategories: BillCategory[] = [
  { id: 'cat-1', groupId: 'group-1', name: 'Rent', slug: 'rent', displayOrder: 1, createdAt: new Date() },
  { id: 'cat-2', groupId: 'group-1', name: 'Mortgage', slug: 'mortgage', displayOrder: 2, createdAt: new Date() },
  { id: 'cat-3', groupId: 'group-2', name: 'Electric', slug: 'electric', displayOrder: 1, createdAt: new Date() },
];

const mockUncategorized: BillCategory = {
  id: 'cat-uncategorized',
  groupId: 'group-system',
  name: 'Uncategorized',
  slug: 'uncategorized',
  displayOrder: 1,
  createdAt: new Date(),
};

const createSelectMock = (groupsResult: BillCategoryGroup[], categoriesResult: BillCategory[]) => {
  const createBuilder = (result: unknown[]) => {
    const resultPromise = Promise.resolve(result);
    return {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(result),
        then: resultPromise.then.bind(resultPromise),
        catch: resultPromise.catch.bind(resultPromise),
      }),
    };
  };

  (db.select as jest.Mock).mockImplementation(() => ({
    from: jest.fn((table: unknown) => {
      if (table === billCategoryGroups) {
        return createBuilder(groupsResult);
      }
      if (table === billCategories) {
        return createBuilder(categoriesResult);
      }
      return createBuilder([]);
    }),
  }));
};

describe('getCategoriesGrouped', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('excludes System group from results', async () => {
    createSelectMock(mockGroups, mockCategories);

    const result = await getCategoriesGrouped();

    expect(result).toHaveLength(2);
    expect(result.some((g) => g.slug === 'system')).toBe(false);
  });

  it('nests categories under their parent groups', async () => {
    createSelectMock(mockGroups, mockCategories);

    const result = await getCategoriesGrouped();

    const housingGroup = result.find((g) => g.slug === 'housing');
    expect(housingGroup?.categories).toHaveLength(2);
    expect(housingGroup?.categories[0].slug).toBe('rent');
    expect(housingGroup?.categories[1].slug).toBe('mortgage');

    const utilitiesGroup = result.find((g) => g.slug === 'utilities');
    expect(utilitiesGroup?.categories).toHaveLength(1);
    expect(utilitiesGroup?.categories[0].slug).toBe('electric');
  });

  it('returns empty array when no groups exist', async () => {
    createSelectMock([], []);

    const result = await getCategoriesGrouped();

    expect(result).toHaveLength(0);
  });
});

describe('getAllCategoriesGrouped', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('includes System group in results', async () => {
    const allGroups = [...mockGroups, mockSystemGroup];
    const allCategories = [...mockCategories, mockUncategorized];
    createSelectMock(allGroups, allCategories);

    const result = await getAllCategoriesGrouped();

    expect(result).toHaveLength(3);
    expect(result.some((g) => g.slug === 'system')).toBe(true);
  });

  it('nests Uncategorized category under System group', async () => {
    const allGroups = [...mockGroups, mockSystemGroup];
    const allCategories = [...mockCategories, mockUncategorized];
    createSelectMock(allGroups, allCategories);

    const result = await getAllCategoriesGrouped();

    const systemGroup = result.find((g) => g.slug === 'system');
    expect(systemGroup?.categories).toHaveLength(1);
    expect(systemGroup?.categories[0].slug).toBe('uncategorized');
  });
});

describe('getDefaultCategoryId', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('returns first category ID from first group', async () => {
    createSelectMock([mockGroups[0]], [mockCategories[0]]);

    const result = await getDefaultCategoryId();

    expect(result).toBe('cat-1');
  });

  it('returns null when no groups exist', async () => {
    createSelectMock([], []);

    const result = await getDefaultCategoryId();

    expect(result).toBeNull();
  });

  it('returns null when no categories exist', async () => {
    createSelectMock([mockGroups[0]], []);

    const result = await getDefaultCategoryId();

    expect(result).toBeNull();
  });

  it('returns category from first group even when later group has lower displayOrder category', async () => {
    const firstGroup: BillCategoryGroup = {
      id: 'group-first',
      name: 'First Group',
      slug: 'first-group',
      displayOrder: 1,
      createdAt: new Date(),
    };
    const secondGroup: BillCategoryGroup = {
      id: 'group-second',
      name: 'Second Group',
      slug: 'second-group',
      displayOrder: 2,
      createdAt: new Date(),
    };
    const firstGroupCategory: BillCategory = {
      id: 'cat-first-group',
      groupId: 'group-first',
      name: 'First Group Cat',
      slug: 'first-group-cat',
      displayOrder: 5,
      createdAt: new Date(),
    };
    const secondGroupCategoryLowerOrder: BillCategory = {
      id: 'cat-second-group',
      groupId: 'group-second',
      name: 'Second Group Cat',
      slug: 'second-group-cat',
      displayOrder: 1,
      createdAt: new Date(),
    };

    let capturedGroupId: string | null = null;
    const createFilteredBuilder = (groups: BillCategoryGroup[], categories: BillCategory[]) => {
      const createGroupBuilder = () => {
        const result = [groups[0]];
        const resultPromise = Promise.resolve(result);
        return {
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(result),
            then: resultPromise.then.bind(resultPromise),
            catch: resultPromise.catch.bind(resultPromise),
          }),
        };
      };

      const createCategoryBuilder = () => {
        return {
          where: jest.fn().mockImplementation(() => {
            const filteredCats = categories.filter((c) => c.groupId === capturedGroupId);
            const resultPromise = Promise.resolve(filteredCats);
            return {
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(filteredCats.slice(0, 1)),
                then: resultPromise.then.bind(resultPromise),
                catch: resultPromise.catch.bind(resultPromise),
              }),
            };
          }),
        };
      };

      (db.select as jest.Mock).mockImplementation(() => ({
        from: jest.fn((table: unknown) => {
          if (table === billCategoryGroups) {
            capturedGroupId = groups[0]?.id ?? null;
            return createGroupBuilder();
          }
          if (table === billCategories) {
            return createCategoryBuilder();
          }
          return { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis() };
        }),
      }));
    };

    createFilteredBuilder(
      [firstGroup, secondGroup],
      [firstGroupCategory, secondGroupCategoryLowerOrder]
    );

    const result = await getDefaultCategoryId();

    expect(result).toBe('cat-first-group');
  });
});

