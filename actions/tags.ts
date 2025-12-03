'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, tags } from '@/db';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

/** Validation schema for tag creation */
const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be 50 characters or less'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

/** Standardized action result type */
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new tag
 *
 * - Generates URL-safe slug from name
 * - Returns existing tag if slug already exists (idempotent)
 */
export async function createTag(
  input: CreateTagInput
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  const parsed = createTagSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Validation failed',
    };
  }

  const { name } = parsed.data;
  const slug = generateSlug(name);

  try {
    // Check if tag with this slug already exists
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug));

    if (existingTag) {
      // Return existing tag (idempotent behavior)
      return {
        success: true,
        data: {
          id: existingTag.id,
          name: existingTag.name,
          slug: existingTag.slug,
        },
      };
    }

    // Create new tag
    const [newTag] = await db
      .insert(tags)
      .values({ name, slug })
      .returning({ id: tags.id, name: tags.name, slug: tags.slug });

    revalidatePath('/');

    return {
      success: true,
      data: newTag,
    };
  } catch (error) {
    console.error('Failed to create tag:', error);
    return {
      success: false,
      error: 'Failed to create tag. Please try again.',
    };
  }
}

/**
 * Fetch all tags ordered by name
 */
export async function getTags() {
  return db.select().from(tags).orderBy(tags.name);
}

/**
 * Fetch a single tag by slug
 */
export async function getTagBySlug(slug: string) {
  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
  return tag ?? null;
}
