#!/usr/bin/env node
/**
 * Seed Script for Bill Categories
 *
 * Seeds predefined category groups and categories into the SQLite database.
 * This script is idempotent and skips seeding if categories already exist.
 *
 * Used in both local development and Docker production:
 * - Local: node scripts/seed-categories.mjs
 * - Docker: Runs automatically at container startup via docker-entrypoint.sh
 */

import Database from 'better-sqlite3';
import { dirname, resolve, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

/**
 * Generate a CUID2-like ID.
 *
 * @returns {string} A unique identifier
 */
function createId() {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('base64url').slice(0, 12);
  return `${timestamp}${random}`;
}

// Read database path from environment or use default
const rawUrl = process.env.DATABASE_URL ?? './data/oar.db';
let dbPath = rawUrl.startsWith('file:') ? rawUrl.slice(5) : rawUrl;

// Handle in-memory database
if (dbPath === ':memory:') {
  console.error('[seed-categories] In-memory database not supported for seeding');
  process.exit(1);
}

// Resolve relative paths to absolute paths
if (!isAbsolute(dbPath)) {
  dbPath = resolve(ROOT_DIR, dbPath);
}

console.log(`[seed-categories] Database path: ${dbPath}`);

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Check if categories already exist
const existingGroups = db.prepare('SELECT COUNT(*) as count FROM bill_category_groups').get();

if (existingGroups.count > 0) {
  console.log(`[seed-categories] Found ${existingGroups.count} existing groups. Skipping seed.`);
  db.close();
  process.exit(0);
}

// Category seed data
const CATEGORY_SEED_DATA = [
  {
    group: { name: 'Housing & Essential Services', slug: 'housing-essential-services', displayOrder: 1 },
    categories: [
      { name: 'Home, Mortgage & Rent', slug: 'home-mortgage-rent', displayOrder: 1 },
      { name: 'Credit Cards', slug: 'credit-cards', displayOrder: 2 },
      { name: 'Cellphone & Mobile Service', slug: 'cellphone-mobile-service', displayOrder: 3 },
      { name: 'Auto & Car', slug: 'auto-car', displayOrder: 4 },
      { name: 'Insurance', slug: 'insurance', displayOrder: 5 },
    ],
  },
  {
    group: { name: 'Utilities', slug: 'utilities', displayOrder: 2 },
    categories: [
      { name: 'Electric & Utilities', slug: 'electric-utilities', displayOrder: 1 },
      { name: 'Gas', slug: 'gas', displayOrder: 2 },
      { name: 'Internet & Broadband', slug: 'internet-broadband', displayOrder: 3 },
      { name: 'Phone & Business Communication', slug: 'phone-business-communication', displayOrder: 4 },
      { name: 'Trash', slug: 'trash', displayOrder: 5 },
      { name: 'Water', slug: 'water', displayOrder: 6 },
    ],
  },
  {
    group: { name: 'Transportation & Travel', slug: 'transportation-travel', displayOrder: 3 },
    categories: [
      { name: 'Boat & Marine', slug: 'boat-marine', displayOrder: 1 },
      { name: 'Motorcycle', slug: 'motorcycle', displayOrder: 2 },
      { name: 'Maintenance & Repairs', slug: 'maintenance-repairs', displayOrder: 3 },
      { name: 'Travel', slug: 'travel', displayOrder: 4 },
    ],
  },
  {
    group: { name: 'Digital Services & Subscriptions', slug: 'digital-services-subscriptions', displayOrder: 4 },
    categories: [
      { name: 'Video Streaming & Television', slug: 'video-streaming-television', displayOrder: 1 },
      { name: 'Apps', slug: 'apps', displayOrder: 2 },
      { name: 'Cloud Services', slug: 'cloud-services', displayOrder: 3 },
      { name: 'Music Subscriptions', slug: 'music-subscriptions', displayOrder: 4 },
      { name: 'Subscriptions', slug: 'subscriptions', displayOrder: 5 },
    ],
  },
  {
    group: { name: 'Home Maintenance & Household', slug: 'home-maintenance-household', displayOrder: 5 },
    categories: [
      { name: 'Cleaning', slug: 'cleaning', displayOrder: 1 },
      { name: 'Food', slug: 'food', displayOrder: 2 },
      { name: 'Lawn & Garden', slug: 'lawn-garden', displayOrder: 3 },
      { name: 'Alarm & Reminder Services', slug: 'alarm-reminder-services', displayOrder: 4 },
    ],
  },
  {
    group: { name: 'Goods & Shopping', slug: 'goods-shopping', displayOrder: 6 },
    categories: [
      { name: 'Appliances', slug: 'appliances', displayOrder: 1 },
      { name: 'Television, Audio & Computer Equipment', slug: 'television-audio-computer', displayOrder: 2 },
      { name: 'Furniture', slug: 'furniture', displayOrder: 3 },
      { name: 'Gaming', slug: 'gaming', displayOrder: 4 },
      { name: 'Jewelry', slug: 'jewelry', displayOrder: 5 },
      { name: 'Watches & Smartwatches', slug: 'watches-smartwatches', displayOrder: 6 },
      { name: 'Shopping & Purchases', slug: 'shopping-purchases', displayOrder: 7 },
      { name: 'Childcare', slug: 'childcare', displayOrder: 8 },
      { name: 'Community & Organizations', slug: 'community-organizations', displayOrder: 9 },
      { name: 'Concerts, Tickets & Events', slug: 'concerts-tickets-events', displayOrder: 10 },
      { name: 'Dental', slug: 'dental', displayOrder: 11 },
      { name: 'Gifts & Donations', slug: 'gifts-donations', displayOrder: 12 },
      { name: 'Gym', slug: 'gym', displayOrder: 13 },
      { name: 'Health, Hospital & Medicine', slug: 'health-hospital-medicine', displayOrder: 14 },
      { name: 'Legal', slug: 'legal', displayOrder: 15 },
      { name: 'Personal Care', slug: 'personal-care', displayOrder: 16 },
      { name: 'Pet', slug: 'pet', displayOrder: 17 },
      { name: 'School & Student Loans', slug: 'school-student-loans', displayOrder: 18 },
      { name: 'Sports', slug: 'sports', displayOrder: 19 },
    ],
  },
  {
    group: { name: 'Financial Management & Business', slug: 'financial-management-business', displayOrder: 7 },
    categories: [
      { name: 'Business', slug: 'business', displayOrder: 1 },
      { name: 'Storage & Security', slug: 'storage-security', displayOrder: 2 },
      { name: 'Loans', slug: 'loans', displayOrder: 3 },
      { name: 'Mail', slug: 'mail', displayOrder: 4 },
      { name: 'Savings', slug: 'savings', displayOrder: 5 },
      { name: 'Taxes & General', slug: 'taxes-general', displayOrder: 6 },
    ],
  },
  {
    group: { name: 'System', slug: 'system', displayOrder: 999 },
    categories: [
      { name: 'Uncategorized', slug: 'uncategorized', displayOrder: 1 },
    ],
  },
];

console.log('[seed-categories] Seeding bill categories...');

const insertGroup = db.prepare(`
  INSERT INTO bill_category_groups (id, name, slug, display_order, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertCategory = db.prepare(`
  INSERT INTO bill_categories (id, group_id, name, slug, display_order, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateBillsUncategorized = db.prepare(`
  UPDATE bills SET category_id = ? WHERE category_id IS NULL
`);

const countBillsByCategory = db.prepare(`
  SELECT COUNT(*) as count FROM bills WHERE category_id = ?
`);

let uncategorizedId = null;
const now = Date.now();
let totalCategories = 0;

const seedTransaction = db.transaction(() => {
  for (const { group, categories } of CATEGORY_SEED_DATA) {
    const groupId = createId();

    insertGroup.run(groupId, group.name, group.slug, group.displayOrder, now);
    console.log(`[seed-categories] Created group: ${group.name}`);

    for (const category of categories) {
      const categoryId = createId();
      insertCategory.run(categoryId, groupId, category.name, category.slug, category.displayOrder, now);
      totalCategories++;

      if (category.slug === 'uncategorized') {
        uncategorizedId = categoryId;
      }
    }

    console.log(`[seed-categories]   Added ${categories.length} categories`);
  }

  if (uncategorizedId) {
    updateBillsUncategorized.run(uncategorizedId);
    const result = countBillsByCategory.get(uncategorizedId);
    console.log(`[seed-categories] Updated ${result.count} existing bills to "Uncategorized" category.`);
  }
});

try {
  seedTransaction();
  console.log(`[seed-categories] Successfully seeded ${totalCategories} categories across ${CATEGORY_SEED_DATA.length} groups.`);
} catch (err) {
  console.error('[seed-categories] Failed to seed categories:', err.message);
  process.exit(1);
}

db.close();

