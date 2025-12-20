import { db } from '@/db';
import * as schema from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { faker } from '@faker-js/faker';
import { addDays, subDays, subMonths } from 'date-fns';
import { type SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { type RunResult } from 'better-sqlite3';
import { type ExtractTablesWithRelations, lt, eq } from 'drizzle-orm';
import { SettingsService } from '@/lib/services/SettingsService';
import type { BillStatus } from '@/lib/types';

type SeedTransaction = SQLiteTransaction<
  'sync',
  RunResult,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Predefined bill category seed data with icons.
 *
 * Categories are organized into groups for semantic structure.
 * Each category has a unique Lucide icon for visual identification.
 */
const CATEGORY_SEED_DATA = [
  {
    group: { name: 'Housing & Essential Services', slug: 'housing-essential-services', displayOrder: 1 },
    categories: [
      { name: 'Home, Mortgage & Rent', slug: 'home-mortgage-rent', icon: 'house', displayOrder: 1 },
      { name: 'Credit Cards', slug: 'credit-cards', icon: 'credit-card', displayOrder: 2 },
      { name: 'Cellphone & Mobile Service', slug: 'cellphone-mobile-service', icon: 'smartphone', displayOrder: 3 },
      { name: 'Auto & Car', slug: 'auto-car', icon: 'car', displayOrder: 4 },
      { name: 'Insurance', slug: 'insurance', icon: 'shield', displayOrder: 5 },
    ],
  },
  {
    group: { name: 'Utilities', slug: 'utilities', displayOrder: 2 },
    categories: [
      { name: 'Electric & Utilities', slug: 'electric-utilities', icon: 'zap', displayOrder: 1 },
      { name: 'Gas', slug: 'gas', icon: 'flame', displayOrder: 2 },
      { name: 'Internet & Broadband', slug: 'internet-broadband', icon: 'wifi', displayOrder: 3 },
      { name: 'Phone & Business Communication', slug: 'phone-business-communication', icon: 'phone', displayOrder: 4 },
      { name: 'Trash', slug: 'trash', icon: 'trash-2', displayOrder: 5 },
      { name: 'Water', slug: 'water', icon: 'droplet', displayOrder: 6 },
    ],
  },
  {
    group: { name: 'Transportation & Travel', slug: 'transportation-travel', displayOrder: 3 },
    categories: [
      { name: 'Boat & Marine', slug: 'boat-marine', icon: 'ship', displayOrder: 1 },
      { name: 'Motorcycle', slug: 'motorcycle', icon: 'bike', displayOrder: 2 },
      { name: 'Maintenance & Repairs', slug: 'maintenance-repairs', icon: 'wrench', displayOrder: 3 },
      { name: 'Travel', slug: 'travel', icon: 'plane', displayOrder: 4 },
    ],
  },
  {
    group: { name: 'Digital Services & Subscriptions', slug: 'digital-services-subscriptions', displayOrder: 4 },
    categories: [
      { name: 'Video Streaming & Television', slug: 'video-streaming-television', icon: 'tv', displayOrder: 1 },
      { name: 'Apps', slug: 'apps', icon: 'app-window', displayOrder: 2 },
      { name: 'Cloud Services', slug: 'cloud-services', icon: 'cloud', displayOrder: 3 },
      { name: 'Music Subscriptions', slug: 'music-subscriptions', icon: 'music', displayOrder: 4 },
      { name: 'Subscriptions', slug: 'subscriptions', icon: 'repeat', displayOrder: 5 },
    ],
  },
  {
    group: { name: 'Home Maintenance & Household', slug: 'home-maintenance-household', displayOrder: 5 },
    categories: [
      { name: 'Cleaning', slug: 'cleaning', icon: 'sparkles', displayOrder: 1 },
      { name: 'Food', slug: 'food', icon: 'utensils', displayOrder: 2 },
      { name: 'Lawn & Garden', slug: 'lawn-garden', icon: 'tree-deciduous', displayOrder: 3 },
      { name: 'Alarm & Reminder Services', slug: 'alarm-reminder-services', icon: 'bell', displayOrder: 4 },
    ],
  },
  {
    group: { name: 'Goods & Shopping', slug: 'goods-shopping', displayOrder: 6 },
    categories: [
      { name: 'Appliances', slug: 'appliances', icon: 'refrigerator', displayOrder: 1 },
      { name: 'Television, Audio & Computer Equipment', slug: 'television-audio-computer', icon: 'monitor', displayOrder: 2 },
      { name: 'Furniture', slug: 'furniture', icon: 'armchair', displayOrder: 3 },
      { name: 'Gaming', slug: 'gaming', icon: 'gamepad-2', displayOrder: 4 },
      { name: 'Jewelry', slug: 'jewelry', icon: 'gem', displayOrder: 5 },
      { name: 'Watches & Smartwatches', slug: 'watches-smartwatches', icon: 'watch', displayOrder: 6 },
      { name: 'Shopping & Purchases', slug: 'shopping-purchases', icon: 'shopping-bag', displayOrder: 7 },
      { name: 'Childcare', slug: 'childcare', icon: 'baby', displayOrder: 8 },
      { name: 'Community & Organizations', slug: 'community-organizations', icon: 'users', displayOrder: 9 },
      { name: 'Concerts, Tickets & Events', slug: 'concerts-tickets-events', icon: 'ticket', displayOrder: 10 },
      { name: 'Dental', slug: 'dental', icon: 'smile', displayOrder: 11 },
      { name: 'Gifts & Donations', slug: 'gifts-donations', icon: 'gift', displayOrder: 12 },
      { name: 'Gym', slug: 'gym', icon: 'dumbbell', displayOrder: 13 },
      { name: 'Health, Hospital & Medicine', slug: 'health-hospital-medicine', icon: 'heart-pulse', displayOrder: 14 },
      { name: 'Legal', slug: 'legal', icon: 'scale', displayOrder: 15 },
      { name: 'Personal Care', slug: 'personal-care', icon: 'user', displayOrder: 16 },
      { name: 'Pet', slug: 'pet', icon: 'paw-print', displayOrder: 17 },
      { name: 'School & Student Loans', slug: 'school-student-loans', icon: 'graduation-cap', displayOrder: 18 },
      { name: 'Sports', slug: 'sports', icon: 'trophy', displayOrder: 19 },
    ],
  },
  {
    group: { name: 'Financial Management & Business', slug: 'financial-management-business', displayOrder: 7 },
    categories: [
      { name: 'Business', slug: 'business', icon: 'briefcase', displayOrder: 1 },
      { name: 'Storage & Security', slug: 'storage-security', icon: 'lock', displayOrder: 2 },
      { name: 'Loans', slug: 'loans', icon: 'banknote', displayOrder: 3 },
      { name: 'Mail', slug: 'mail', icon: 'mail', displayOrder: 4 },
      { name: 'Savings', slug: 'savings', icon: 'piggy-bank', displayOrder: 5 },
      { name: 'Taxes & General', slug: 'taxes-general', icon: 'receipt', displayOrder: 6 },
    ],
  },
  {
    group: { name: 'System', slug: 'system', displayOrder: 999 },
    categories: [
      { name: 'Uncategorized', slug: 'uncategorized', icon: 'circle-dashed', displayOrder: 1 },
    ],
  },
];

/**
 * Seed bill categories into the database.
 *
 * This function is idempotent: it skips seeding if categories already exist.
 * Categories are required for bill creation and are predefined by the system.
 *
 * @returns True if categories were seeded, false if they already existed
 */
function seedCategories(): boolean {
  const existingCount = db
    .select()
    .from(schema.billCategoryGroups)
    .all()
    .length;

  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing category groups. Skipping category seed.`);
    return false;
  }

  console.log('Seeding bill categories...');

  const now = new Date();
  let totalCategories = 0;

  db.transaction((tx) => {
    for (const { group, categories } of CATEGORY_SEED_DATA) {
      const groupId = createId();

      tx.insert(schema.billCategoryGroups).values({
        id: groupId,
        name: group.name,
        slug: group.slug,
        displayOrder: group.displayOrder,
        createdAt: now,
      }).run();

      for (const category of categories) {
        tx.insert(schema.billCategories).values({
          id: createId(),
          groupId,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          displayOrder: category.displayOrder,
          createdAt: now,
        }).run();
        totalCategories++;
      }
    }
  });

  console.log(`Seeded ${totalCategories} categories across ${CATEGORY_SEED_DATA.length} groups.`);
  return true;
}

/**
 * Wipe all application data from the database.
 *
 * Deletes records from all application tables in reverse dependency order.
 * Preserves bill categories as they are system-defined reference data.
 *
 * @param tx - Database transaction instance
 */
function wipeData(tx: SeedTransaction): void {
  console.log('Wiping existing data...');

  tx.delete(schema.billsToTags).run();
  tx.delete(schema.transactions).run();
  tx.delete(schema.bills).run();
  tx.delete(schema.tags).run();
  tx.delete(schema.settings).run();
  tx.delete(schema.settingsSections).run();
  tx.delete(schema.settingsCategories).run();

  console.log('Database wiped clean.');
}

/**
 * Seed tags for bill organization.
 *
 * @param tx - Database transaction instance
 * @returns Array of inserted tag records
 */
function seedTags(tx: SeedTransaction): typeof schema.tags.$inferSelect[] {
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

/**
 * Seed default settings hierarchy.
 */
async function seedSettings(): Promise<void> {
  console.log('Seeding settings...');
  await SettingsService.initializeDefaults();
  console.log('Seeded settings hierarchy.');
}

/**
 * Query existing bill categories from the database, excluding the System group.
 *
 * @returns Array of category records for bill assignment
 */
function getCategories(): typeof schema.billCategories.$inferSelect[] {
  const filteredCategories = db
    .select()
    .from(schema.billCategories)
    .innerJoin(
      schema.billCategoryGroups,
      eq(schema.billCategories.groupId, schema.billCategoryGroups.id)
    )
    .where(lt(schema.billCategoryGroups.displayOrder, 999))
    .all();

  return filteredCategories.map(row => row.bill_categories);
}

/**
 * Seed bills with various statuses and frequencies.
 *
 * @param tx - Database transaction instance
 * @param tags - Array of tag records to associate with bills
 * @param categories - Array of category records for bill assignment
 * @returns Array of inserted bill records
 */
function seedBills(
  tx: SeedTransaction,
  tags: typeof schema.tags.$inferSelect[],
  categories: typeof schema.billCategories.$inferSelect[]
): typeof schema.bills.$inferInsert[] {
  console.log('Seeding bills...');

  if (categories.length === 0) {
    throw new Error('No categories found. Categories must be seeded first.');
  }

  const billsToInsert: typeof schema.bills.$inferInsert[] = [];
  const billsToTagsToInsert: typeof schema.billsToTags.$inferInsert[] = [];

  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const id = createId();

    const frequencies = [
      'weekly',
      'biweekly',
      'twicemonthly',
      'monthly',
      'monthly',
      'monthly',
      'bimonthly',
      'quarterly',
      'yearly',
      'once'
    ] as const;
    const frequency = faker.helpers.arrayElement(frequencies);

    const isVariable = faker.datatype.boolean(0.3);
    const amount = faker.number.int({ min: 1000, max: 200000 });

    const categoryId = faker.helpers.arrayElement(categories).id;

    // Generate realistic bill states based on frequency
    let status: BillStatus;
    let dueDate: Date;
    let amountDue: number;

    if (frequency === 'once') {
      // One-time bills: can be pending, paid, or overdue
      const oneTimeStatuses = ['pending', 'pending', 'paid', 'paid', 'overdue'] as const;
      status = faker.helpers.arrayElement(oneTimeStatuses);

      if (status === 'paid') {
        // Paid one-time: due date in past, amountDue = 0
        dueDate = faker.date.between({ from: subDays(now, 60), to: subDays(now, 1) });
        amountDue = 0;
      } else if (status === 'overdue') {
        // Overdue one-time: due date in past, full amount still due
        dueDate = faker.date.between({ from: subDays(now, 30), to: subDays(now, 1) });
        amountDue = amount;
      } else {
        // Pending one-time: due date in future
        dueDate = faker.date.between({ from: now, to: addDays(now, 60) });
        amountDue = amount;
      }
    } else {
      // Recurring bills (monthly/yearly): never 'paid' status
      // After payment, due date advances and status becomes pending/overdue
      const recurringStatuses = ['pending', 'pending', 'pending', 'pending', 'overdue'] as const;
      status = faker.helpers.arrayElement(recurringStatuses);

      if (status === 'overdue') {
        // Overdue recurring: due date in past
        dueDate = faker.date.between({ from: subDays(now, 30), to: subDays(now, 1) });
        amountDue = amount;
      } else {
        // Pending recurring: due date in future
        dueDate = faker.date.between({ from: now, to: addDays(now, 60) });
        amountDue = amount;
      }
    }

    const bill: typeof schema.bills.$inferInsert = {
      id,
      title: `${faker.finance.accountName()} ${faker.helpers.arrayElement(['Bill', 'Payment', 'Expense', 'Invoice'])}`,
      amount,
      amountDue,
      dueDate,
      frequency,
      isAutoPay: faker.datatype.boolean(0.2),
      isVariable,
      status,
      categoryId,
      notes: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
      createdAt: subDays(dueDate, 30),
      updatedAt: now
    };

    billsToInsert.push(bill);

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
 * @param tx - Database transaction instance
 * @param bills - Array of bill records to generate transactions for
 */
function seedTransactions(tx: SeedTransaction, bills: typeof schema.bills.$inferInsert[]): void {
  console.log('Seeding transactions...');

  const transactionsToInsert: typeof schema.transactions.$inferInsert[] = [];

  for (const bill of bills) {
    if (bill.id === undefined) continue;

    let count = 0;
    if (bill.frequency === 'weekly') count = faker.number.int({ min: 1, max: 12 });
    else if (bill.frequency === 'biweekly') count = faker.number.int({ min: 1, max: 6 });
    else if (bill.frequency === 'twicemonthly') count = faker.number.int({ min: 1, max: 6 });
    else if (bill.frequency === 'monthly') count = faker.number.int({ min: 1, max: 5 });
    else if (bill.frequency === 'bimonthly') count = faker.number.int({ min: 1, max: 3 });
    else if (bill.frequency === 'quarterly') count = faker.number.int({ min: 1, max: 2 });
    else if (bill.frequency === 'yearly') count = faker.number.int({ min: 0, max: 1 });
    else if (bill.frequency === 'once' && bill.status === 'paid') count = 1;

    for (let j = 0; j < count; j++) {
      if (bill.dueDate === undefined || bill.amount === undefined) continue;

      let paidAt: Date;
      const offset = j + (bill.status === 'paid' ? 0 : 1);

      if (bill.frequency === 'weekly') paidAt = subDays(bill.dueDate as Date, offset * 7);
      else if (bill.frequency === 'biweekly') paidAt = subDays(bill.dueDate as Date, offset * 14);
      else if (bill.frequency === 'twicemonthly') paidAt = subDays(bill.dueDate as Date, offset * 15); // Approximation
      else if (bill.frequency === 'bimonthly') paidAt = subMonths(bill.dueDate as Date, offset * 2);
      else if (bill.frequency === 'quarterly') paidAt = subMonths(bill.dueDate as Date, offset * 3);
      else if (bill.frequency === 'yearly') paidAt = subMonths(bill.dueDate as Date, offset * 12);
      else paidAt = subMonths(bill.dueDate as Date, offset); // Monthly and default

      transactionsToInsert.push({
        id: createId(),
        billId: bill.id,
        amount: bill.amount,
        paidAt,
        notes: faker.datatype.boolean(0.2) ? 'Logged by Oar' : null,
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
 * Main seed entry point.
 *
 * Seeds the database with:
 * 1. Bill categories (idempotent - skips if exist)
 * 2. Settings hierarchy
 * 3. Sample tags, bills, and transactions
 */
async function main(): Promise<void> {
  try {
    console.log('Starting database seed...');

    seedCategories();

    const categories = getCategories();
    console.log(`Found ${categories.length} bill categories.`);

    db.transaction((tx) => {
      wipeData(tx);
    });

    await seedSettings();

    db.transaction((tx) => {
      const tags = seedTags(tx);
      const bills = seedBills(tx, tags, categories);
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
