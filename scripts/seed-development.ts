import { db } from '@/db';
import * as schema from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { faker } from '@faker-js/faker';
import { addDays, subDays, subMonths, addMonths } from 'date-fns';
import { type SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { type RunResult } from 'better-sqlite3';
import { type ExtractTablesWithRelations, lt, eq } from 'drizzle-orm';
import { SettingsService } from '@/lib/services/SettingsService';
import type { BillStatus } from '@/lib/types';
import { getLogger } from '@/lib/logger';

const logger = getLogger('SeedScript');

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
 * Bill templates for seeding.
 */
const BILL_TEMPLATES = [
  { title: 'CodeRabbit Subscription', slug: 'subscriptions', frequency: 'monthly' },
  { title: 'AWS', slug: 'cloud-services', frequency: 'monthly' },
  { title: 'Google AI Pro (2TB)', slug: 'cloud-services', frequency: 'monthly' },
  { title: 'Apple iCloud', slug: 'cloud-services', frequency: 'monthly' },
  { title: 'Coursera', slug: 'subscriptions', frequency: 'monthly' },
  { title: 'Cursor Subscription', slug: 'subscriptions', frequency: 'monthly' },
  { title: '1Password', slug: 'subscriptions', frequency: 'yearly' },
  { title: 'Discord Nitro', slug: 'subscriptions', frequency: 'monthly' },
  { title: 'Fastmail', slug: 'subscriptions', frequency: 'yearly' },
  { title: 'Netflix', slug: 'video-streaming-television', frequency: 'monthly' },
  { title: 'Spotify', slug: 'music-subscriptions', frequency: 'monthly' },
  { title: 'Amazon Prime', slug: 'subscriptions', frequency: 'yearly' },
  { title: 'Gym Membership', slug: 'gym', frequency: 'monthly' },
  { title: 'Rent Payment', slug: 'home-mortgage-rent', frequency: 'monthly' },
  { title: 'Electric Bill', slug: 'electric-utilities', frequency: 'monthly' },
  { title: 'Water Bill', slug: 'water', frequency: 'monthly' },
  { title: 'Internet Bill', slug: 'internet-broadband', frequency: 'monthly' },
  { title: 'Car Insurance', slug: 'insurance', frequency: 'monthly' },
  { title: 'Health Insurance', slug: 'insurance', frequency: 'monthly' },
  { title: 'Phone Bill', slug: 'cellphone-mobile-service', frequency: 'monthly' },
  { title: 'Car Repair', slug: 'maintenance-repairs', frequency: 'once' },
  { title: 'Medical Checkup', slug: 'health-hospital-medicine', frequency: 'once' },
  { title: 'Birthday Gift', slug: 'gifts-donations', frequency: 'once' },
] as const;

interface BillState {
  status: BillStatus;
  dueDate: Date;
  amountDue: number;
}

/**
 * Generates a realistic bill state based on frequency and amount.
 *
 * @param frequency - Bill recurrence frequency
 * @param amount - Full bill amount
 * @param now - Reference date for generation
 * @returns Generated status, due date, and amount due
 */
function generateBillState(
  frequency: string,
  amount: number,
  now: Date
): BillState {
  if (frequency === 'once') {
    const oneTimeStatuses = ['pending', 'pending', 'paid', 'paid', 'overdue'] as const;
    const status = faker.helpers.arrayElement(oneTimeStatuses);

    if (status === 'paid') {
      return {
        status,
        dueDate: faker.date.between({ from: subDays(now, 60), to: subDays(now, 1) }),
        amountDue: 0,
      };
    }

    if (status === 'overdue') {
      return {
        status,
        dueDate: faker.date.between({ from: subDays(now, 30), to: subDays(now, 1) }),
        amountDue: amount,
      };
    }

    return {
      status,
      dueDate: faker.date.between({
        from: now,
        to: faker.helpers.arrayElement([
          addDays(now, 60),
          addMonths(now, 8),
          addMonths(now, 15),
        ]),
      }),
      amountDue: amount,
    };
  }

  const recurringStatuses = ['pending', 'pending', 'pending', 'pending', 'overdue'] as const;
  const status = faker.helpers.arrayElement(recurringStatuses);

  if (status === 'overdue') {
    return {
      status,
      dueDate: faker.date.between({ from: subDays(now, 30), to: subDays(now, 1) }),
      amountDue: amount,
    };
  }

  return {
    status,
    dueDate: faker.date.between({
      from: now,
      to: faker.helpers.arrayElement([
        addDays(now, 60),
        addMonths(now, 10),
        addMonths(now, 24),
      ]),
    }),
    amountDue: amount,
  };
}

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
    logger.info({ existingCount }, 'Found existing category groups, skipping category seed');
    return false;
  }

  logger.info('Seeding bill categories...');

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

  logger.info(
    { totalCategories, groupCount: CATEGORY_SEED_DATA.length },
    'Seeded categories'
  );
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
  logger.info('Wiping existing data...');

  tx.delete(schema.billsToTags).run();
  tx.delete(schema.transactions).run();
  tx.delete(schema.bills).run();
  tx.delete(schema.tags).run();
  tx.delete(schema.settings).run();
  tx.delete(schema.settingsSections).run();
  tx.delete(schema.settingsCategories).run();

  logger.info('Database wiped clean.');
}

/**
 * Seed tags for bill organization.
 *
 * @param tx - Database transaction instance
 * @returns Array of inserted tag records
 */
function seedTags(tx: SeedTransaction): typeof schema.tags.$inferSelect[] {
  logger.info('Seeding tags...');

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

  logger.info({ tagCount: tags.length }, 'Seeded tags');
  return tags;
}

/**
 * Seed default settings hierarchy.
 */
async function seedSettings(): Promise<void> {
  logger.info('Seeding settings...');
  await SettingsService.initializeDefaults();
  logger.info('Seeded settings hierarchy.');
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
  logger.info('Seeding bills...');

  if (categories.length === 0) {
    throw new Error('No categories found. Categories must be seeded first.');
  }

  const billsToInsert: typeof schema.bills.$inferInsert[] = [];
  const billsToTagsToInsert: typeof schema.billsToTags.$inferInsert[] = [];

  const now = new Date();

  // Create a map for quick category lookup by slug
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  for (let i = 0; i < BILL_TEMPLATES.length; i++) {
    const template = BILL_TEMPLATES[i];
    const id = createId();

    const frequency = template.frequency;
    const isVariable = faker.datatype.boolean(0.2);
    const amount = faker.number.int({ min: 1000, max: 25000 });

    // Try to get the matching category, fallback to random if not found
    const category = categoryMap.get(template.slug) ?? faker.helpers.arrayElement(categories);
    const categoryId = category.id;

    // Generate realistic bill states based on frequency
    const { status, dueDate, amountDue } = generateBillState(frequency, amount, now);

    // Add endDate to ~25% of recurring bills to demonstrate bill end feature
    const hasEndDate = frequency !== 'once' && faker.datatype.boolean(0.25);
    const endDate = hasEndDate
      ? faker.date.between({
          from: addMonths(now, 3),
          to: addMonths(now, 12),
        })
      : null;

    const bill: typeof schema.bills.$inferInsert = {
      id,
      title: template.title,
      amount,
      amountDue,
      dueDate,
      endDate,
      frequency,
      isAutoPay: faker.datatype.boolean(0.2),
      isVariable,
      status,
      categoryId,
      notes: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
      createdAt: subDays(dueDate, 30),
      updatedAt: now,
    };

    billsToInsert.push(bill);

    const selectedTags = faker.helpers.arrayElements(tags, { min: 1, max: 3 });
    billsToTagsToInsert.push(
      ...selectedTags.map((tag) => ({
        billId: id,
        tagId: tag.id,
      }))
    );
  }

  // Generate a few more random bills to ensure variety
  for (let i = 0; i < 5; i++) {
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
      'once',
    ] as const;
    const frequency = faker.helpers.arrayElement(frequencies);

    const isVariable = faker.datatype.boolean(0.3);
    const amount = faker.number.int({ min: 1000, max: 200000 });

    const categoryId = faker.helpers.arrayElement(categories).id;

    // Generate realistic bill states based on frequency
    const { status, dueDate, amountDue } = generateBillState(frequency, amount, now);

    // Add endDate to ~25% of recurring bills to demonstrate bill end feature
    const hasEndDate = frequency !== 'once' && faker.datatype.boolean(0.25);
    const endDate = hasEndDate
      ? faker.date.between({
          from: addMonths(now, 3),
          to: addMonths(now, 12),
        })
      : null;

    const bill: typeof schema.bills.$inferInsert = {
      id,
      title: `${faker.finance.accountName()} ${faker.helpers.arrayElement(['Bill', 'Payment', 'Expense', 'Invoice'])}`,
      amount,
      amountDue,
      dueDate,
      endDate,
      frequency,
      isAutoPay: faker.datatype.boolean(0.2),
      isVariable,
      status,
      categoryId,
      notes: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
      createdAt: subDays(dueDate, 30),
      updatedAt: now,
    };

    billsToInsert.push(bill);

    const selectedTags = faker.helpers.arrayElements(tags, { min: 1, max: 3 });
    billsToTagsToInsert.push(
      ...selectedTags.map((tag) => ({
        billId: id,
        tagId: tag.id,
      }))
    );
  }

  tx.insert(schema.bills).values(billsToInsert).run();
  tx.insert(schema.billsToTags).values(billsToTagsToInsert).run();

  logger.info({ billCount: billsToInsert.length }, 'Seeded bills');
  return billsToInsert;
}


/**
 * Seed historical transactions for bills.
 *
 * @param tx - Database transaction instance
 * @param bills - Array of bill records to generate transactions for
 */
function seedTransactions(tx: SeedTransaction, bills: typeof schema.bills.$inferInsert[]): void {
  logger.info('Seeding transactions...');

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

  logger.info(
    { transactionCount: transactionsToInsert.length },
    'Seeded transactions'
  );
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
    logger.info('Starting database seed...');

    seedCategories();

    const categories = getCategories();
    logger.info({ categoryCount: categories.length }, 'Found bill categories');

    db.transaction((tx) => {
      wipeData(tx);
    });

    await seedSettings();

    db.transaction((tx) => {
      const tags = seedTags(tx);
      const bills = seedBills(tx, tags, categories);
      seedTransactions(tx, bills);
    });

    logger.info('Seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Seeding failed');
    process.exit(1);
  }
}

main();
