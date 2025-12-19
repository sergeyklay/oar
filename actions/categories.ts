'use server';

import { db, billCategoryGroups, billCategories } from '@/db';
import type { BillCategoryGroupWithCategories } from '@/db/schema';
import { asc, lt, eq } from 'drizzle-orm';

/**
 * Fetches all category groups with nested categories for dropdown display.
 *
 * @returns Groups with categories, sorted by displayOrder. Excludes System group (displayOrder: 999).
 */
export async function getCategoriesGrouped(): Promise<BillCategoryGroupWithCategories[]> {
  const groups = await db
    .select()
    .from(billCategoryGroups)
    .where(lt(billCategoryGroups.displayOrder, 999))
    .orderBy(asc(billCategoryGroups.displayOrder));

  const categories = await db
    .select()
    .from(billCategories)
    .orderBy(asc(billCategories.displayOrder));

  return groups.map((group) => ({
    ...group,
    categories: categories.filter((cat) => cat.groupId === group.id),
  }));
}

/**
 * Fetches all category groups including System group (for editing legacy bills).
 *
 * @returns All groups with categories, sorted by displayOrder.
 */
export async function getAllCategoriesGrouped(): Promise<BillCategoryGroupWithCategories[]> {
  const groups = await db
    .select()
    .from(billCategoryGroups)
    .orderBy(asc(billCategoryGroups.displayOrder));

  const categories = await db
    .select()
    .from(billCategories)
    .orderBy(asc(billCategories.displayOrder));

  return groups.map((group) => ({
    ...group,
    categories: categories.filter((cat) => cat.groupId === group.id),
  }));
}

/**
 * Returns the ID of the default category (first category from first non-System group).
 *
 * @returns The category ID or null if no categories exist
 */
export async function getDefaultCategoryId(): Promise<string | null> {
  const groups = await db
    .select()
    .from(billCategoryGroups)
    .where(lt(billCategoryGroups.displayOrder, 999))
    .orderBy(asc(billCategoryGroups.displayOrder))
    .limit(1);

  if (groups.length === 0) {
    return null;
  }

  const categories = await db
    .select()
    .from(billCategories)
    .where(eq(billCategories.groupId, groups[0].id))
    .orderBy(asc(billCategories.displayOrder))
    .limit(1);

  return categories[0]?.id ?? null;
}

