import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

/** Bills table for tracking recurring and one-time payments. */
export const bills = sqliteTable('bills', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  /** Amount in minor units (e.g., 4999 = 49.99 PLN). This is the base recurring amount. */
  amount: integer('amount').notNull(),
  /**
   * Current cycle's remaining amount due in minor units.
   *
   * Tracks partial payments within a billing cycle:
   * - Initialized to `amount` when bill is created
   * - Reduced when partial payment logged (updateDueDate=false)
   * - Reset to `amount` when billing cycle advances (updateDueDate=true)
   * - For one-time bills, reduces to 0 when fully paid
   *
   * Note: Default 0 is for migration only; service layer always sets this explicitly.
   */
  amountDue: integer('amount_due').notNull().default(0),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }).notNull(),
  frequency: text('frequency', {
    enum: ['once', 'monthly', 'yearly'],
  }).notNull().default('monthly'),
  isAutoPay: integer('is_auto_pay', { mode: 'boolean' }).notNull().default(false),
  /** Distinguishes fixed amounts (Rent) from variable estimates (Electric) */
  isVariable: integer('is_variable', { mode: 'boolean' }).notNull().default(false),
  status: text('status', {
    enum: ['pending', 'paid', 'overdue'],
  }).notNull().default('pending'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  /** Optional user notes for bill context (account numbers, reminders, etc.) */
  notes: text('notes'),
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

/**
 * Settings Categories Table
 *
 * Top-level organization for settings (e.g., General, Notification, Logging).
 * Categories are displayed as major sections on the Settings page.
 */
export const settingsCategories = sqliteTable('settings_categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  /** URL-safe identifier (e.g., "general", "notification", "logging") */
  slug: text('slug').notNull().unique(),
  /** Display name (e.g., "General", "Notification", "Logging") */
  name: text('name').notNull(),
  /** Display order (lower numbers appear first) */
  displayOrder: integer('display_order').notNull().default(0),
  /** Creation timestamp */
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Settings Sections Table
 *
 * Sub-organization within categories (e.g., General → View Options, Behavior Options).
 * Sections group related settings together.
 */
export const settingsSections = sqliteTable('settings_sections', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  /** Foreign key to settings_categories */
  categoryId: text('category_id')
    .notNull()
    .references(() => settingsCategories.id, { onDelete: 'cascade' }),
  /** URL-safe identifier (e.g., "view-options", "behavior-options") */
  slug: text('slug').notNull(),
  /** Display name (e.g., "View Options", "Behavior Options") */
  name: text('name').notNull(),
  /** Optional description for the section */
  description: text('description'),
  /** Display order within category (lower numbers appear first) */
  displayOrder: integer('display_order').notNull().default(0),
  /** Creation timestamp */
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  // Composite unique constraint: slug must be unique within each category
  uniqueIndex('category_slug_unique').on(table.categoryId, table.slug),
]);

/** Key-value settings table for user preferences. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  /** Optional foreign key to settings_sections for organization */
  sectionId: text('section_id').references(() => settingsSections.id, { onDelete: 'set null' }),
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

export const settingsCategoriesRelations = relations(settingsCategories, ({ many }) => ({
  sections: many(settingsSections),
}));

export const settingsSectionsRelations = relations(settingsSections, ({ one, many }) => ({
  category: one(settingsCategories, {
    fields: [settingsSections.categoryId],
    references: [settingsCategories.id],
  }),
  settings: many(settings),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  section: one(settingsSections, {
    fields: [settings.sectionId],
    references: [settingsSections.id],
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

export type SettingsCategory = typeof settingsCategories.$inferSelect;
export type NewSettingsCategory = typeof settingsCategories.$inferInsert;
export type SettingsSection = typeof settingsSections.$inferSelect;
export type NewSettingsSection = typeof settingsSections.$inferInsert;

/**
 * Structured representation of settings hierarchy
 */
export interface StructuredSettings {
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    displayOrder: number;
    sections: Array<{
      id: string;
      slug: string;
      name: string;
      description: string | null;
      displayOrder: number;
      settingsCount: number;
    }>;
  }>;
}
