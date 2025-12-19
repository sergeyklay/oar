import { db } from '@/db';
import * as schema from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { faker } from '@faker-js/faker';
import { addDays, subDays, subMonths } from 'date-fns';

/**
 * Wipes all data from the database in reverse order of dependencies.
 */
async function wipeData() {
  console.log('🧹 Wiping existing data...');

  // Junction tables and dependent tables first
  await db.delete(schema.billsToTags);
  await db.delete(schema.transactions);

  // Main entity tables
  await db.delete(schema.bills);
  await db.delete(schema.tags);

  // Settings hierarchy
  await db.delete(schema.settings);
  await db.delete(schema.settingsSections);
  await db.delete(schema.settingsCategories);

  console.log('✅ Database wiped clean.');
}

/**
 * Seeds tags for bill organization.
 */
async function seedTags() {
  console.log('🏷️ Seeding tags...');

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

  await db.insert(schema.tags).values(tags);
  console.log(`✅ Seeded ${tags.length} tags.`);
  return tags;
}

/**
 * Seeds default settings hierarchy.
 */
async function seedSettings() {
  console.log('⚙️ Seeding settings...');

  const categories = [
    { id: createId(), slug: 'general', name: 'General', displayOrder: 1 },
    { id: createId(), slug: 'notifications', name: 'Notifications', displayOrder: 2 },
    { id: createId(), slug: 'appearance', name: 'Appearance', displayOrder: 3 }
  ];

  await db.insert(schema.settingsCategories).values(categories);

  const sections = [
    {
      id: createId(),
      categoryId: categories[0].id,
      slug: 'display',
      name: 'Display options',
      description: 'Configure how your data is displayed.',
      displayOrder: 1
    },
    {
      id: createId(),
      categoryId: categories[1].id,
      slug: 'email',
      name: 'Email alerts',
      description: 'Configure email notification preferences.',
      displayOrder: 1
    }
  ];

  await db.insert(schema.settingsSections).values(sections);

  const defaultSettings = [
    { key: 'currency', value: 'USD', sectionId: sections[0].id },
    { key: 'theme', value: 'system', sectionId: sections[0].id },
    { key: 'notifications_enabled', value: 'true', sectionId: sections[1].id }
  ];

  await db.insert(schema.settings).values(defaultSettings);
  console.log('✅ Seeded settings hierarchy.');
}

/**
 * Seeds bills with various statuses and frequencies.
 */
async function seedBills(tags: typeof schema.tags.$inferSelect[]) {
  console.log('💸 Seeding bills...');

  const billsToInsert: (typeof schema.bills.$inferInsert)[] = [];
  const billsToTagsToInsert: (typeof schema.billsToTags.$inferInsert)[] = [];

  const now = new Date();

  // Create 20 bills
  for (let i = 0; i < 20; i++) {
    const id = createId();
    const frequency = faker.helpers.arrayElement(['monthly', 'monthly', 'monthly', 'yearly', 'once'] as const);
    const isVariable = faker.datatype.boolean(0.3);
    const amount = faker.number.int({ min: 1000, max: 200000 }); // $10.00 to $2000.00

    // Status distribution: 60% pending, 30% paid, 10% overdue
    const status = faker.helpers.arrayElement(['pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'paid', 'paid', 'paid', 'overdue'] as const);

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
      title: faker.finance.accountName() + ' ' + faker.helpers.arrayElement(['Bill', 'Payment', 'Expense', 'Invoice']),
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

  await db.insert(schema.bills).values(billsToInsert);
  await db.insert(schema.billsToTags).values(billsToTagsToInsert);

  console.log(`✅ Seeded ${billsToInsert.length} bills.`);
  return billsToInsert;
}

/**
 * Seeds historical transactions for bills.
 */
async function seedTransactions(bills: (typeof schema.bills.$inferInsert)[]) {
  console.log('💳 Seeding transactions...');

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
      const paidAt = subMonths(bill.dueDate as Date, j + (bill.status === 'paid' ? 0 : 1));

      transactionsToInsert.push({
        id: createId(),
        billId: bill.id,
        amount: bill.amount as number,
        paidAt,
        notes: faker.datatype.boolean(0.2) ? 'Auto-payment' : null,
        createdAt: paidAt
      });
    }
  }

  if (transactionsToInsert.length > 0) {
    await db.insert(schema.transactions).values(transactionsToInsert);
  }

  console.log(`✅ Seeded ${transactionsToInsert.length} transactions.`);
}

async function main() {
  try {
    console.log('🌱 Starting database seed...');

    await wipeData();
    const tags = await seedTags();
    await seedSettings();
    const bills = await seedBills(tags);
    await seedTransactions(bills);

    console.log('✨ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();

