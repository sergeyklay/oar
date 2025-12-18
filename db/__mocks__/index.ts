/**
 * Manual mock for @/db module.
 * Jest auto-discovers this when jest.mock('@/db') is called.
 */

// Mock table references (used by eq(), inArray(), etc.)
export const bills = { id: 'bills.id' };
export const transactions = { id: 'transactions.id', billId: 'transactions.billId' };
export const tags = { id: 'tags.id', slug: 'tags.slug' };
export const billsToTags = { billId: 'billsToTags.billId', tagId: 'billsToTags.tagId' };
export const settings = { key: 'settings.key', sectionId: 'settings.sectionId' };
export const settingsCategories = { id: 'settingsCategories.id', slug: 'settingsCategories.slug', displayOrder: 'settingsCategories.displayOrder', name: 'settingsCategories.name' };
export const settingsSections = { id: 'settingsSections.id', categoryId: 'settingsSections.categoryId', slug: 'settingsSections.slug', displayOrder: 'settingsSections.displayOrder', name: 'settingsSections.name' };

// Type for the chainable query builder
interface QueryBuilder {
  values: jest.Mock;
  returning: jest.Mock;
  get: jest.Mock;
  all: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  run: jest.Mock;
  from: jest.Mock;
  orderBy: jest.Mock;
  innerJoin: jest.Mock;
}

// Chainable query builder mock factory
const createQueryBuilder = (): QueryBuilder => {
  const builder: QueryBuilder = {
    values: jest.fn(),
    returning: jest.fn(),
    get: jest.fn().mockReturnValue({ id: 'mock-id' }),
    all: jest.fn().mockReturnValue([]),
    set: jest.fn(),
    where: jest.fn(),
    run: jest.fn(),
    from: jest.fn(),
    orderBy: jest.fn(),
    innerJoin: jest.fn(),
  };

  // Set up chainable returns
  builder.values.mockReturnValue(builder);
  builder.returning.mockReturnValue(builder);
  builder.set.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.from.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.innerJoin.mockReturnValue(builder);

  return builder;
};

// Type for the mock db
interface MockDb {
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  select: jest.Mock;
  transaction: jest.Mock;
}

// Main db mock (defined before transaction to avoid circular reference)
export const db: MockDb = {
  insert: jest.fn(() => createQueryBuilder()),
  update: jest.fn(() => createQueryBuilder()),
  delete: jest.fn(() => createQueryBuilder()),
  select: jest.fn(() => createQueryBuilder()),
  transaction: jest.fn((callback: (tx: MockDb) => unknown) => callback(db)),
};

// Reset helper for tests
export const resetDbMocks = () => {
  db.insert.mockClear();
  db.update.mockClear();
  db.delete.mockClear();
  db.select.mockClear();
  db.transaction.mockClear();
};
