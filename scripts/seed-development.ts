import { db } from '@/db';
import * as schema from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { faker } from '@faker-js/faker';
import { subDays, subMonths, addMonths } from 'date-fns';
import { type SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { type RunResult } from 'better-sqlite3';
import { type ExtractTablesWithRelations, lt, eq } from 'drizzle-orm';
import { SettingsService } from '@/lib/services/SettingsService';
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
 * Deterministic scenario bills for Forecast View testing.
 *
 * These scenarios are designed to test specific visual patterns in the Forecast Chart:
 * - Scenario A: Perfect sinking fund (tests savings bar amortization)
 * - Scenario B: Due soon big expense (tests transition from savings to due)
 * - Scenario C: Variable bill estimation (tests average calculation)
 * - Scenario D: Baseline bills (tests base "Amount Due" bars)
 */
interface ScenarioBill {
  title: string;
  slug: string;
  frequency: 'once' | 'weekly' | 'biweekly' | 'twicemonthly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
  amount: number; // in minor units (cents)
  dueDateMonthsFromNow: number; // months from now
  isVariable?: boolean;
  status?: 'pending' | 'paid' | 'overdue';
  isAutoPay?: boolean;
  notes?: string;
}

const SCENARIO_BILLS: ScenarioBill[] = [
  // Scenario A: The Perfect Sinking Fund (Testing Savings Bar)
  // $600 quarterly = $200/mo savings. Due in 6 months.
  {
    title: 'Car Insurance',
    slug: 'insurance',
    frequency: 'quarterly',
    amount: 60000, // $600.00
    dueDateMonthsFromNow: 6,
    status: 'pending',
    isAutoPay: false,
  },
  // Scenario B: The "Due Soon" Big Expense (Testing Transition)
  // $1200 yearly = $100/mo savings. Due in 2 months.
  {
    title: 'Annual Software License',
    slug: 'subscriptions',
    frequency: 'yearly',
    amount: 120000, // $1200.00
    dueDateMonthsFromNow: 2,
    status: 'pending',
    isAutoPay: false,
  },
  // Scenario C: Variable Bill Estimation (Testing Estimates)
  // Monthly variable bill with specific transaction history
  {
    title: 'Winter Heating / Gas',
    slug: 'gas',
    frequency: 'monthly',
    amount: 11000, // $110.00 (average of $100, $120, $110)
    dueDateMonthsFromNow: 1,
    isVariable: true,
    status: 'pending',
    isAutoPay: false,
  },
  // Scenario D: The Baseline (Background Noise)
  {
    title: 'Rent Payment',
    slug: 'home-mortgage-rent',
    frequency: 'monthly',
    amount: 200000, // $2000.00
    dueDateMonthsFromNow: 1,
    status: 'pending',
    isAutoPay: false,
  },
  {
    title: 'Internet Bill',
    slug: 'internet-broadband',
    frequency: 'monthly',
    amount: 8000, // $80.00
    dueDateMonthsFromNow: 1,
    status: 'pending',
    isAutoPay: false,
  },
  {
    title: 'Spotify',
    slug: 'music-subscriptions',
    frequency: 'monthly',
    amount: 1500, // $15.00
    dueDateMonthsFromNow: 1,
    status: 'pending',
    isAutoPay: false,
  },
];

/**
 * Bill templates for random generation to supplement scenarios.
 *
 * These provide variety and ensure we have sufficient data for testing.
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
  { title: 'Amazon Prime', slug: 'subscriptions', frequency: 'yearly' },
  { title: 'Gym Membership', slug: 'gym', frequency: 'monthly' },
  { title: 'Electric Bill', slug: 'electric-utilities', frequency: 'monthly' },
  { title: 'Water Bill', slug: 'water', frequency: 'monthly' },
  { title: 'Health Insurance', slug: 'insurance', frequency: 'monthly' },
  { title: 'Phone Bill', slug: 'cellphone-mobile-service', frequency: 'monthly' },
  { title: 'Car Repair', slug: 'maintenance-repairs', frequency: 'once' },
  { title: 'Medical Checkup', slug: 'health-hospital-medicine', frequency: 'once' },
  { title: 'Birthday Gift', slug: 'gifts-donations', frequency: 'once' },
] as const;

interface BillState {
  status: 'pending' | 'paid' | 'overdue';
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
          addMonths(now, 60),
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
        addMonths(now, 60),
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
 * Seed bills combining deterministic scenarios and random templates.
 *
 * First processes deterministic scenario bills for Forecast View testing,
 * then supplements with random bills from templates for variety.
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
  logger.info('Seeding bills (scenarios + random templates)...');

  if (categories.length === 0) {
    throw new Error('No categories found. Categories must be seeded first.');
  }

  const billsToInsert: typeof schema.bills.$inferInsert[] = [];
  const billsToTagsToInsert: typeof schema.billsToTags.$inferInsert[] = [];

  const now = new Date();
  const createdAt = subMonths(now, 3); // Set createdAt 3 months in the past

  // Create a map for quick category lookup by slug
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  // Step 1: Process deterministic scenario bills
  for (const scenario of SCENARIO_BILLS) {
    const id = createId();

    // Get category by slug, throw error if not found (deterministic scenarios require exact categories)
    const category = categoryMap.get(scenario.slug);
    if (!category) {
      throw new Error(`Category not found for slug: ${scenario.slug}. Required for scenario: ${scenario.title}`);
    }

    // Calculate due date from now
    const dueDate = addMonths(now, scenario.dueDateMonthsFromNow);

    // For pending bills, amountDue equals amount. For paid bills, amountDue is 0.
    const amountDue = scenario.status === 'paid' ? 0 : scenario.amount;

    const bill: typeof schema.bills.$inferInsert = {
      id,
      title: scenario.title,
      amount: scenario.amount,
      amountDue,
      dueDate,
      endDate: null, // No end dates for scenario bills
      frequency: scenario.frequency,
      isAutoPay: scenario.isAutoPay ?? false,
      isVariable: scenario.isVariable ?? false,
      status: scenario.status ?? 'pending',
      isArchived: false, // Keep all scenario bills active
      categoryId: category.id,
      notes: scenario.notes ?? null,
      createdAt,
      updatedAt: now,
    };

    billsToInsert.push(bill);

    // Assign 1-2 relevant tags to each bill
    const relevantTags = tags.filter(t =>
      t.name.toLowerCase().includes(scenario.slug.split('-')[0]) ||
      (scenario.slug === 'insurance' && t.name === 'Insurance') ||
      (scenario.slug === 'subscriptions' && t.name === 'Subscriptions') ||
      (scenario.slug === 'gas' && t.name === 'Utilities') ||
      (scenario.slug === 'home-mortgage-rent' && t.name === 'Rent')
    );
    const selectedTags = relevantTags.length > 0
      ? faker.helpers.arrayElements(relevantTags, { min: 1, max: Math.min(2, relevantTags.length) })
      : faker.helpers.arrayElements(tags, { min: 1, max: 2 });

    billsToTagsToInsert.push(
      ...selectedTags.map((tag) => ({
        billId: id,
        tagId: tag.id,
      }))
    );
  }

  // Step 2: Process random template bills
  for (const template of BILL_TEMPLATES) {
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

    const isArchived = faker.datatype.boolean(0.15);

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
      isArchived,
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

    const isArchived = faker.datatype.boolean(0.15);

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
      isArchived,
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

  logger.info({ billCount: billsToInsert.length }, 'Seeded bills (scenarios + random)');
  return billsToInsert;
}


/**
 * Generates a transaction amount for variable bills with realistic variance.
 *
 * For variable bills, amounts vary by ±20% to simulate real-world fluctuations.
 * For fixed bills, returns the base amount.
 *
 * @param baseAmount - Base bill amount in minor units
 * @param isVariable - Whether the bill has variable amounts
 * @returns Transaction amount in minor units
 */
function generateTransactionAmount(baseAmount: number, isVariable: boolean): number {
  if (!isVariable) {
    return baseAmount;
  }

  // Variable bills: vary by ±20% to simulate real-world fluctuations
  const variance = faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 });
  const variedAmount = Math.round(baseAmount * variance);

  // Ensure minimum of 1 cent
  return Math.max(1, variedAmount);
}

/**
 * Seed transaction history for bills (deterministic scenarios + random).
 *
 * Generates transaction patterns:
 * - Scenario C (Winter Heating/Gas): Exactly 12 months current year + 12 months previous year
 * - Other scenario bills: Deterministic history with YoY data
 * - Random bills: Variable history with YoY patterns for monthly bills
 *
 * @param tx - Database transaction instance
 * @param bills - Array of bill records to generate transactions for
 */
function seedTransactions(tx: SeedTransaction, bills: typeof schema.bills.$inferInsert[]): void {
  logger.info('Seeding transactions with YoY data...');

  const transactionsToInsert: typeof schema.transactions.$inferInsert[] = [];
  const scenarioTitles = new Set(SCENARIO_BILLS.map(s => s.title));
  const now = new Date();

  for (const bill of bills) {
    if (bill.id === undefined || bill.dueDate === undefined || bill.amount === undefined) {
      continue;
    }

    const dueDate = bill.dueDate as Date;
    const isVariable = bill.isVariable ?? false;
    const isScenarioBill = scenarioTitles.has(bill.title);

    // Scenario C: Winter Heating / Gas - generate 12 months current year + 12 months previous year
    if (bill.title === 'Winter Heating / Gas' && isVariable) {
      // Current year: 12 months with varying amounts
      const currentYearAmounts = [
        11000, 12000, 10000, 11500, 12500, 10500, // First 6 months
        11000, 13000, 10000, 11500, 12000, 10500, // Last 6 months
      ];

      for (let i = 0; i < 12; i++) {
        const paidAt = subMonths(now, i + 1);
        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: currentYearAmounts[i],
          paidAt,
          notes: null,
          createdAt: paidAt,
        });
      }

      // Previous year: 12 months with slightly different amounts for comparison
      const previousYearAmounts = [
        10500, 11500, 9500, 11000, 12000, 10000, // First 6 months
        10500, 12500, 9500, 11000, 11500, 10000, // Last 6 months
      ];

      for (let i = 0; i < 12; i++) {
        const paidAt = subMonths(now, i + 13); // 13-24 months ago
        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: previousYearAmounts[i],
          paidAt,
          notes: null,
          createdAt: paidAt,
        });
      }
      continue;
    }

    // For scenario bills (except Winter Heating), generate YoY data
    if (isScenarioBill) {
      if (bill.frequency === 'monthly') {
        // Generate 12 months current year + 12 months previous year
        for (let i = 0; i < 12; i++) {
          const currentYearPaidAt = subMonths(now, i + 1);
          transactionsToInsert.push({
            id: createId(),
            billId: bill.id,
            amount: bill.amount,
            paidAt: currentYearPaidAt,
            notes: null,
            createdAt: currentYearPaidAt,
          });

          const previousYearPaidAt = subMonths(now, i + 13);
          transactionsToInsert.push({
            id: createId(),
            billId: bill.id,
            amount: bill.amount,
            paidAt: previousYearPaidAt,
            notes: null,
            createdAt: previousYearPaidAt,
          });
        }
      } else if (bill.frequency === 'quarterly') {
        // Generate 4 quarters current year + 4 quarters previous year
        for (let i = 0; i < 4; i++) {
          const currentYearPaidAt = subMonths(now, i * 3 + 3);
          transactionsToInsert.push({
            id: createId(),
            billId: bill.id,
            amount: bill.amount,
            paidAt: currentYearPaidAt,
            notes: null,
            createdAt: currentYearPaidAt,
          });

          const previousYearPaidAt = subMonths(now, i * 3 + 15);
          transactionsToInsert.push({
            id: createId(),
            billId: bill.id,
            amount: bill.amount,
            paidAt: previousYearPaidAt,
            notes: null,
            createdAt: previousYearPaidAt,
          });
        }
      } else if (bill.frequency === 'yearly') {
        // Generate current year + previous year
        const currentYearPaidAt = subMonths(now, 12);
        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: bill.amount,
          paidAt: currentYearPaidAt,
          notes: null,
          createdAt: currentYearPaidAt,
        });

        const previousYearPaidAt = subMonths(now, 24);
        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: bill.amount,
          paidAt: previousYearPaidAt,
          notes: null,
          createdAt: previousYearPaidAt,
        });
      } else {
        // For other frequencies, generate a few transactions
        const count = bill.frequency === 'bimonthly' ? 6 : 3;
        for (let j = 0; j < count; j++) {
          let paidAt: Date;
          const offset = j + 1;

          if (bill.frequency === 'weekly') {
            paidAt = subDays(now, offset * 7);
          } else if (bill.frequency === 'biweekly') {
            paidAt = subDays(now, offset * 14);
          } else if (bill.frequency === 'twicemonthly') {
            paidAt = subDays(now, offset * 15);
          } else if (bill.frequency === 'bimonthly') {
            paidAt = subMonths(now, offset * 2);
          } else {
            paidAt = subMonths(now, offset);
          }

          transactionsToInsert.push({
            id: createId(),
            billId: bill.id,
            amount: bill.amount,
            paidAt,
            notes: null,
            createdAt: paidAt,
          });
        }
      }
      continue;
    }

    // For random bills, generate YoY data for monthly bills, otherwise use standard logic
    if (bill.frequency === 'monthly') {
      // Generate 12 months current year + 12 months previous year for monthly bills
      for (let i = 0; i < 12; i++) {
        const currentYearPaidAt = subMonths(now, i + 1);
        const currentYearAmount = generateTransactionAmount(bill.amount, isVariable);

        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: currentYearAmount,
          paidAt: currentYearPaidAt,
          notes: faker.datatype.boolean(0.2) ? 'Logged by Oar' : null,
          createdAt: currentYearPaidAt,
        });

        // Previous year: same month, one year earlier
        const previousYearPaidAt = subMonths(now, i + 13);
        // For variable bills, generate slightly different amount for comparison
        const previousYearAmount = isVariable
          ? generateTransactionAmount(bill.amount, true)
          : bill.amount;

        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: previousYearAmount,
          paidAt: previousYearPaidAt,
          notes: faker.datatype.boolean(0.2) ? 'Logged by Oar' : null,
          createdAt: previousYearPaidAt,
        });
      }
    } else {
      // For non-monthly bills, use standard generation logic
      let count = 0;

      if (bill.frequency === 'weekly') {
        count = faker.number.int({ min: 4, max: 12 });
      } else if (bill.frequency === 'biweekly') {
        count = faker.number.int({ min: 3, max: 6 });
      } else if (bill.frequency === 'twicemonthly') {
        count = faker.number.int({ min: 3, max: 6 });
      } else if (bill.frequency === 'bimonthly') {
        count = faker.number.int({ min: 2, max: 4 });
      } else if (bill.frequency === 'quarterly') {
        count = faker.number.int({ min: 2, max: 4 });
      } else if (bill.frequency === 'yearly') {
        count = isVariable
          ? faker.number.int({ min: 2, max: 3 })
          : faker.number.int({ min: 1, max: 2 });
      } else if (bill.frequency === 'once' && bill.status === 'paid') {
        count = 1;
      }

      // Generate transactions going backwards from due date
      for (let j = 0; j < count; j++) {
        let paidAt: Date;
        const offset = j + (bill.status === 'paid' ? 0 : 1);

        if (bill.frequency === 'weekly') {
          paidAt = subDays(dueDate, offset * 7);
        } else if (bill.frequency === 'biweekly') {
          paidAt = subDays(dueDate, offset * 14);
        } else if (bill.frequency === 'twicemonthly') {
          paidAt = subDays(dueDate, offset * 15);
        } else if (bill.frequency === 'bimonthly') {
          paidAt = subMonths(dueDate, offset * 2);
        } else if (bill.frequency === 'quarterly') {
          paidAt = subMonths(dueDate, offset * 3);
        } else if (bill.frequency === 'yearly') {
          paidAt = subMonths(dueDate, offset * 12);
        } else {
          paidAt = subMonths(dueDate, offset);
        }

        const transactionAmount = generateTransactionAmount(bill.amount, isVariable);

        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: transactionAmount,
          paidAt,
          notes: faker.datatype.boolean(0.2) ? 'Logged by Oar' : null,
          createdAt: paidAt,
        });
      }

      // For yearly bills, also generate previous year transaction for YoY comparison
      if (bill.frequency === 'yearly' && count >= 1) {
        const previousYearPaidAt = subMonths(dueDate, 12 + (bill.status === 'paid' ? 0 : 1));
        const previousYearAmount = generateTransactionAmount(bill.amount, isVariable);

        transactionsToInsert.push({
          id: createId(),
          billId: bill.id,
          amount: previousYearAmount,
          paidAt: previousYearPaidAt,
          notes: faker.datatype.boolean(0.2) ? 'Logged by Oar' : null,
          createdAt: previousYearPaidAt,
        });
      }
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
