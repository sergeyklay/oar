/**
 * Manual mock for @/db module.
 * Jest auto-discovers this when jest.mock('@/db') is called.
 */

// Mock table references (used by eq(), inArray(), etc.)
export const bills = { id: 'bills.id' };
export const transactions = { id: 'transactions.id', billId: 'transactions.billId' };
export const tags = { id: 'tags.id', slug: 'tags.slug' };
export const billsToTags = { billId: 'billsToTags.billId', tagId: 'billsToTags.tagId' };

// Chainable query builder mock factory
const createQueryBuilder = () => {
  const builder: Record<string, jest.Mock> = {};

  builder.values = jest.fn().mockReturnValue(builder);
  builder.returning = jest.fn().mockReturnValue(builder);
  builder.get = jest.fn().mockReturnValue({ id: 'mock-id' });
  builder.all = jest.fn().mockReturnValue([]);
  builder.set = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.run = jest.fn();
  builder.from = jest.fn().mockReturnValue(builder);
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.innerJoin = jest.fn().mockReturnValue(builder);

  return builder;
};

// Transaction mock - executes callback synchronously
const transactionMock = jest.fn((callback: (tx: typeof db) => unknown) => {
  return callback(db);
});

// Main db mock
export const db = {
  insert: jest.fn(() => createQueryBuilder()),
  update: jest.fn(() => createQueryBuilder()),
  delete: jest.fn(() => createQueryBuilder()),
  select: jest.fn(() => createQueryBuilder()),
  transaction: transactionMock,
};

// Reset helper for tests
export const resetDbMocks = () => {
  db.insert.mockClear();
  db.update.mockClear();
  db.delete.mockClear();
  db.select.mockClear();
  db.transaction.mockClear();
};
