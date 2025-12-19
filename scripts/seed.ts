import { db } from '@/db';
import * as schema from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { faker } from '@faker-js/faker';
import { addDays, subDays, subMonths } from 'date-fns';
import { type SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { type RunResult } from 'better-sqlite3';
import { type ExtractTablesWithRelations } from 'drizzle-orm';

type SeedTransaction = SQLiteTransaction<
  'sync',
  RunResult,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Wipe all data from the database in reverse order of dependencies.
 *
 * Ensures a clean state before seeding by deleting records from all
 * application tables while respecting foreign key constraints.
 *
 * @param tx - Database transaction instance
 */
function wipeData(tx: SeedTransaction) {
  console.log('Wiping existing data...');

  // Junction tables and dependent tables first
  tx.delete(schema.billsToTags).run();
  tx.delete(schema.transactions).run();

  // Main entity tables
  tx.delete(schema.bills).run();
  tx.delete(schema.tags).run();

  // Settings hierarchy
  tx.delete(schema.settings).run();
  tx.delete(schema.settingsSections).run();
  tx.delete(schema.settingsCategories).run();

  console.log('Database wiped clean.');
}

/**
 * Seed tags for bill organization.
 *
 * Generates a set of common financial categories used to group bills.
 *
 * @param tx - Database transaction instance
 * @returns Array of inserted tag records
 */
function seedTags(tx: SeedTransaction) {
  console.log('Seeding tags...');

  const tagNames = [
    'Utilities',
    'Rent',
    'Subscriptions',
    'Insurance',
    'Personal',
    'Business',
    'Health',
    'Transport',
    'Education',
    'Leisure'
  ];

  const tags = tagNames.map(name => ({
    id: createId(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    createdAt: new Date()
  }));

  tx.insert(schema.tags).values(tags).run();

  console.log(`Seeded ${tags.length} tags.`);
  return tags;
}

import {
  DEFAULT_CATEGORIES,
  DEFAULT_SECTIONS,
  DEFAULT_SETTINGS_VALUES,
} from '@/lib/constants';

/**
 * Seed default settings hierarchy.
 *
 * Populates settings categories, sections, and default key-value pairs
 * to ensure the settings management UI is fully functional.
 *
 * @param tx - Database transaction instance
 */
function seedSettings(tx: SeedTransaction) {
  console.log('Seeding settings...');

  // 1. Insert Categories
  const categoryMap = new Map<string, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    const result = tx
      .insert(schema.settingsCategories)
      .values({
        id: createId(),
        slug: cat.slug,
        name: cat.name,
        displayOrder: cat.displayOrder,
      })
      .returning({ id: schema.settingsCategories.id })
      .get();
    categoryMap.set(cat.slug, result.id);
  }

  // 2. Insert Sections
  const sectionMap = new Map<string, string>();
  for (const section of DEFAULT_SECTIONS) {
    const categoryId = categoryMap.get(section.categorySlug);
    if (!categoryId) {
      throw new Error(`Category not found for slug: ${section.categorySlug}`);
    }

    const result = tx
      .insert(schema.settingsSections)
      .values({
        id: createId(),
        categoryId: categoryId,
        slug: section.slug,
        name: section.name,
        description: section.description,
        displayOrder: section.displayOrder,
      })
      .returning({ id: schema.settingsSections.id })
      .get();
    sectionMap.set(section.slug, result.id);
  }

  // 3. Insert Settings
  for (const setting of DEFAULT_SETTINGS_VALUES) {
    const sectionId = sectionMap.get(setting.sectionSlug);
    if (!sectionId) {
      throw new Error(`Section not found for slug: ${setting.sectionSlug}`);
    }

    tx.insert(schema.settings)
      .values({
        key: setting.key,
        value: setting.value,
        sectionId: sectionId,
      })
      .run();
  }

  console.log('Seeded settings hierarchy.');
}

/**
 * Seed bills with various statuses and frequencies.
 *
 * @param tx - Database transaction instance
 * @param tags - Array of tag records to associate with bills
 * @returns Array of inserted bill records for transaction seeding
 */
function seedBills(tx: SeedTransaction, tags: typeof schema.tags.$inferSelect[]) {
  console.log('Seeding bills...');

  const billsToInsert: (typeof schema.bills.$inferInsert)[] = [];
  const billsToTagsToInsert: (typeof schema.billsToTags.$inferInsert)[] = [];

  const now = new Date();

  // Create 20 bills
  for (let i = 0; i < 20; i++) {
    const id = createId();

    const frequencies = ['monthly', 'monthly', 'monthly', 'yearly', 'once'] as const;
    const frequency = faker.helpers.arrayElement(frequencies);

    const isVariable = faker.datatype.boolean(0.3);
    const amount = faker.number.int({ min: 1000, max: 200000 }); // $10.00 to $2000.00

    // Status distribution: 60% pending, 30% paid, 10% overdue
    const statuses = [
      'pending', 'pending', 'pending', 'pending', 'pending', 'pending',
      'paid', 'paid', 'paid',
      'overdue'
    ] as const;
    const status = faker.helpers.arrayElement(statuses);

    // Date ranges: overdue (-30 to -1 days), pending (0 to 60 days), paid (-30 to 0 days)
    let dueDate: Date;
    if (status === 'overdue') {
      dueDate = faker.date.between({ from: subDays(now, 30), to: subDays(now, 1) });
    } else if (status === 'paid') {
      dueDate = faker.date.between({ from: subDays(now, 30), to: now });
    } else {
      dueDate = faker.date.between({ from: now, to: addDays(now, 60) });
    }

    const bill: typeof schema.bills.$inferInsert = {
      id,
      title: `${faker.finance.accountName()} ${faker.helpers.arrayElement(['Bill', 'Payment', 'Expense', 'Invoice'])}`,
      amount,
      amountDue: status === 'paid' ? 0 : amount,
      dueDate,
      frequency,
      isAutoPay: faker.datatype.boolean(0.2),
      isVariable,
      status,
      notes: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
      createdAt: subDays(dueDate, 30),
      updatedAt: now
    };

    billsToInsert.push(bill);

    // Randomly assign 1-3 tags
    const selectedTags = faker.helpers.arrayElements(tags, { min: 1, max: 3 });
    selectedTags.forEach(tag => {
      billsToTagsToInsert.push({
        billId: id,
        tagId: tag.id
      });
    });
  }

  tx.insert(schema.bills).values(billsToInsert).run();
  tx.insert(schema.billsToTags).values(billsToTagsToInsert).run();

  console.log(`Seeded ${billsToInsert.length} bills.`);
  return billsToInsert;
}

/**
 * Seed historical transactions for bills.
 *
 * Generates past payment records for each bill based on its frequency
 * and status to populate the transaction history view.
 *
 * @param tx - Database transaction instance
 * @param bills - Array of bill records to generate transactions for
 */
function seedTransactions(tx: SeedTransaction, bills: (typeof schema.bills.$inferInsert)[]) {
  console.log('Seeding transactions...');

  const transactionsToInsert: (typeof schema.transactions.$inferInsert)[] = [];

  for (const bill of bills) {
    if (bill.id === undefined) continue;

    // Monthly bills get 1-5 past transactions
    // Yearly bills get 0-1 past transactions
    // One-time bills get 1 past transaction if status is 'paid'
    let count = 0;
    if (bill.frequency === 'monthly') count = faker.number.int({ min: 1, max: 5 });
    else if (bill.frequency === 'yearly') count = faker.number.int({ min: 0, max: 1 });
    else if (bill.frequency === 'once' && bill.status === 'paid') count = 1;

    for (let j = 0; j < count; j++) {
      if (bill.dueDate === undefined || bill.amount === undefined) continue;

      const paidAt = subMonths(bill.dueDate as Date, j + (bill.status === 'paid' ? 0 : 1));

      transactionsToInsert.push({
        id: createId(),
        billId: bill.id,
        amount: bill.amount,
        paidAt,
        notes: faker.datatype.boolean(0.2) ? 'Auto-payment' : null,
        createdAt: paidAt
      });
    }
  }

  if (transactionsToInsert.length > 0) {
    tx.insert(schema.transactions).values(transactionsToInsert).run();
  }

  console.log(`Seeded ${transactionsToInsert.length} transactions.`);
}

/**
 * Main execution entry point for the seeding script.
 *
 * Orchestrates the full seeding process: wiping existing data,
 * seeding tags, settings, bills, and transactions.
 *
 * @returns A promise that resolves when the seeding is complete
 */
async function main() {
  try {
    console.log('Starting database seed...');

    db.transaction((tx) => {
      wipeData(tx);
      const tags = seedTags(tx);
      seedSettings(tx);
      const bills = seedBills(tx, tags);
      seedTransactions(tx, bills);
    });

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();

