import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

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

export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Setting = typeof settings.$inferSelect;

export type BillFrequency = 'once' | 'monthly' | 'yearly';
export type BillStatus = 'pending' | 'paid' | 'overdue';
