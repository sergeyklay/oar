#!/usr/bin/env node
/**
 * Production Seed Script
 *
 * Seeds bill categories into the SQLite database. This script is idempotent
 * and safe to run on every container startup - it skips seeding if categories
 * already exist.
 *
 * Categories are required for bill creation and are predefined by the system.
 *
 * Usage: node scripts/seed-production.mjs
 */

import Database from 'better-sqlite3';
import { dirname, resolve, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import { createId } from '@paralleldrive/cuid2';
import { getLogger } from './logger.mjs';

const logger = getLogger('SeedScript');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

const rawUrl = process.env.DATABASE_URL ?? './data/oar.db';
let dbPath = rawUrl.startsWith('file:') ? rawUrl.slice(5) : rawUrl;

if (dbPath === ':memory:') {
  logger.fatal('In-memory database not supported for seeding');
  process.exit(1);
}

if (!isAbsolute(dbPath)) {
  dbPath = resolve(ROOT_DIR, dbPath);
}

logger.info({ dbPath }, 'Database path');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const existingGroups = db.prepare('SELECT COUNT(*) as count FROM bill_category_groups').get();

if (existingGroups && existingGroups.count > 0) {
  logger.info({ count: existingGroups.count }, 'Found existing category groups. Skipping seed.');
  db.close();
  process.exit(0);
}

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

logger.info('Seeding bill categories');

const insertGroup = db.prepare(`
  INSERT INTO bill_category_groups (id, name, slug, display_order, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertCategory = db.prepare(`
  INSERT INTO bill_categories (id, group_id, name, slug, icon, display_order, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const now = Date.now();
let totalCategories = 0;

const seedTransaction = db.transaction(() => {
  for (const { group, categories } of CATEGORY_SEED_DATA) {
    const groupId = createId();

    insertGroup.run(groupId, group.name, group.slug, group.displayOrder, now);
    logger.debug({ groupName: group.name, groupId }, 'Created category group');

    for (const category of categories) {
      insertCategory.run(createId(), groupId, category.name, category.slug, category.icon, category.displayOrder, now);
      totalCategories++;
    }

    logger.debug({ groupName: group.name, categoryCount: categories.length }, 'Added categories to group');
  }
});

try {
  seedTransaction();
  logger.info(
    { totalCategories, groupCount: CATEGORY_SEED_DATA.length },
    'Successfully seeded categories'
  );
} catch (err) {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error({ err: error }, 'Failed to seed categories');
  process.exit(1);
}

db.close();

