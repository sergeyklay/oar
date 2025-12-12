import { db, bills, tags, billsToTags } from '@/db';
import type { BillWithTags, Tag } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * BillService
 *
 * Domain logic for bill-related operations.
 * Pure data access; no validation (handled by actions layer).
 */
export const BillService = {
  /**
   * Fetch a single bill with its associated tags.
   *
   * @param billId - Bill ID to fetch (assumed valid)
   * @returns Bill with tags or null if not found/archived
   */
  async getWithTags(billId: string): Promise<BillWithTags | null> {
    const [bill] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, billId), eq(bills.isArchived, false)));

    if (!bill) {
      return null;
    }

    const billTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(billsToTags)
      .innerJoin(tags, eq(billsToTags.tagId, tags.id))
      .where(eq(billsToTags.billId, billId))
      .orderBy(tags.name);

    return {
      ...bill,
      tags: billTags,
    };
  },

  /**
   * Fetch tags for a specific bill.
   *
   * @param billId - Bill ID to fetch tags for
   * @returns Array of tags
   */
  async getTags(billId: string): Promise<Tag[]> {
    return db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(billsToTags)
      .innerJoin(tags, eq(billsToTags.tagId, tags.id))
      .where(eq(billsToTags.billId, billId))
      .orderBy(tags.name);
  },

  /**
   * Fetch multiple bills with their associated tags.
   *
   * @param billIds - Array of bill IDs
   * @returns Map of bill ID to tags array
   */
  async getTagsForBills(billIds: string[]): Promise<Map<string, Tag[]>> {
    if (billIds.length === 0) {
      return new Map();
    }

    const tagAssociations = await db
      .select({
        billId: billsToTags.billId,
        tagId: billsToTags.tagId,
        tagName: tags.name,
        tagSlug: tags.slug,
        tagCreatedAt: tags.createdAt,
      })
      .from(billsToTags)
      .innerJoin(tags, eq(billsToTags.tagId, tags.id))
      .where(inArray(billsToTags.billId, billIds))
      .orderBy(tags.name);

    const tagsByBillId = new Map<string, Tag[]>();
    for (const assoc of tagAssociations) {
      const billTags = tagsByBillId.get(assoc.billId) ?? [];
      billTags.push({
        id: assoc.tagId,
        name: assoc.tagName,
        slug: assoc.tagSlug,
        createdAt: assoc.tagCreatedAt,
      });
      tagsByBillId.set(assoc.billId, billTags);
    }

    return tagsByBillId;
  },
};

