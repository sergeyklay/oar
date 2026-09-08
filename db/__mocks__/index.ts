/**
 * Manual mock for @/db module.
 * vi.mock('@/db') without a factory resolves to this file.
 */

import { vi, type Mock } from 'vitest';

// Mock table references (used by eq(), inArray(), etc.)
export const bills = { id: 'bills.id', categoryId: 'bills.categoryId', title: 'bills.title' };
export const transactions = { id: 'transactions.id', billId: 'transactions.billId' };
export const tags = { id: 'tags.id', slug: 'tags.slug' };
export const billsToTags = { billId: 'billsToTags.billId', tagId: 'billsToTags.tagId' };
export const settings = { key: 'settings.key', sectionId: 'settings.sectionId' };
export const settingsCategories = {
  id: 'settingsCategories.id',
  slug: 'settingsCategories.slug',
  displayOrder: 'settingsCategories.displayOrder',
  name: 'settingsCategories.name',
};
export const settingsSections = {
  id: 'settingsSections.id',
  categoryId: 'settingsSections.categoryId',
  slug: 'settingsSections.slug',
  displayOrder: 'settingsSections.displayOrder',
  name: 'settingsSections.name',
};
export const billCategoryGroups = {
  id: 'billCategoryGroups.id',
  displayOrder: 'billCategoryGroups.displayOrder',
};
export const billCategories = {
  id: 'billCategories.id',
  groupId: 'billCategories.groupId',
  displayOrder: 'billCategories.displayOrder',
};

// Type for the chainable query builder
interface QueryBuilder {
  values: Mock;
  returning: Mock;
  get: Mock;
  all: Mock;
  set: Mock;
  where: Mock;
  run: Mock;
  from: Mock;
  orderBy: Mock;
  innerJoin: Mock;
  limit: Mock;
  onConflictDoUpdate: Mock;
  onConflictDoNothing: Mock;
}

// Chainable query builder mock factory
const createQueryBuilder = (): QueryBuilder => {
  const builder: QueryBuilder = {
    values: vi.fn(),
    returning: vi.fn(),
    get: vi.fn().mockReturnValue({ id: 'mock-id' }),
    all: vi.fn().mockReturnValue([]),
    set: vi.fn(),
    where: vi.fn(),
    run: vi.fn(),
    from: vi.fn(),
    orderBy: vi.fn(),
    innerJoin: vi.fn(),
    limit: vi.fn(),
    onConflictDoUpdate: vi.fn(),
    onConflictDoNothing: vi.fn(),
  };

  // Set up chainable returns
  // All methods return builder for chaining (sync pattern for better-sqlite3)
  builder.values.mockReturnValue(builder);
  builder.returning.mockReturnValue(builder);
  builder.set.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.from.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.innerJoin.mockReturnValue(builder);
  builder.limit.mockResolvedValue([]);
  builder.onConflictDoUpdate.mockReturnValue(builder);
  builder.onConflictDoNothing.mockReturnValue(builder);

  return builder;
};

// Type for the mock db
interface MockDb {
  insert: Mock;
  update: Mock;
  delete: Mock;
  select: Mock;
  transaction: Mock;
}

// Main db mock (defined before transaction to avoid circular reference)
export const db: MockDb = {
  insert: vi.fn(() => createQueryBuilder()),
  update: vi.fn(() => createQueryBuilder()),
  delete: vi.fn(() => createQueryBuilder()),
  select: vi.fn(() => createQueryBuilder()),
  transaction: vi.fn((callback: (tx: MockDb) => unknown) => callback(db)),
};

// Reset helper for tests
export const resetDbMocks = () => {
  db.insert.mockClear();
  db.update.mockClear();
  db.delete.mockClear();
  db.select.mockClear();
  db.transaction.mockClear();
};
