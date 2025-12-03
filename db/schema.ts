import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

/** Bills table for tracking recurring and one-time payments. */
export const bills = sqliteTable('bills', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  /** Amount in minor units (e.g., 4999 = 49.99 PLN) */
  amount: integer('amount').notNull(),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }).notNull(),
  frequency: text('frequency', {
    enum: ['once', 'monthly', 'yearly'],
  }).notNull().default('monthly'),
  isAutoPay: integer('is_auto_pay', { mode: 'boolean' }).notNull().default(false),
  status: text('status', {
    enum: ['pending', 'paid', 'overdue'],
  }).notNull().default('pending'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Transactions table for recording payment history.
 *
 * WHY: Immutable audit trail of all payments. Enables:
 * - Historical reporting ("spent on X this year")
 * - Future forecasting accuracy validation
 * - Debugging recurrence issues
 */
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  /** Foreign key to bills table */
  billId: text('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'cascade' }),
  /** Amount paid in minor units (may differ from bill.amount for partial payments) */
  amount: integer('amount').notNull(),
  /** Date the payment was made (user-provided, defaults to today) */
  paidAt: integer('paid_at', { mode: 'timestamp_ms' }).notNull(),
  /** Optional user notes */
  notes: text('notes'),
  /** Record creation timestamp */
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Key-value settings table for user preferences. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Tags Table
 *
 * User-defined categories for bill organization.
 * Slug is URL-safe version of name for filtering.
 */
export const tags = sqliteTable('tags', {
  // Primary Key: CUID2 for distributed-friendly unique IDs
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Display name (e.g., "Business Expenses")
  name: text('name').notNull(),

  // URL-safe slug (e.g., "business-expenses")
  // WHY UNIQUE: Used in URL params for filtering
  slug: text('slug').notNull().unique(),

  // Creation timestamp
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Bills-to-Tags Junction Table
 *
 * Many-to-Many relationship between bills and tags.
 * WHY COMPOSITE PK: Prevents duplicate tag assignments.
 */
export const billsToTags = sqliteTable('bills_to_tags', {
  billId: text('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'cascade' }),

  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  // Composite primary key prevents duplicate bill-tag pairs
  primaryKey({ columns: [table.billId, table.tagId] }),
]);

// ============================================
// DRIZZLE RELATIONS (for relational queries)
// ============================================

export const billsRelations = relations(bills, ({ many }) => ({
  billsToTags: many(billsToTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  billsToTags: many(billsToTags),
}));

export const billsToTagsRelations = relations(billsToTags, ({ one }) => ({
  bill: one(bills, {
    fields: [billsToTags.billId],
    references: [bills.id],
  }),
  tag: one(tags, {
    fields: [billsToTags.tagId],
    references: [tags.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Setting = typeof settings.$inferSelect;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type BillToTag = typeof billsToTags.$inferSelect;

// Extended Bill type with tags
export interface BillWithTags extends Bill {
  tags: Tag[];
}

export type BillFrequency = 'once' | 'monthly' | 'yearly';
export type BillStatus = 'pending' | 'paid' | 'overdue';
