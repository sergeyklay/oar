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
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
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
export type Setting = typeof settings.$inferSelect;

export type BillFrequency = 'once' | 'monthly' | 'yearly';
export type BillStatus = 'pending' | 'paid' | 'overdue';
