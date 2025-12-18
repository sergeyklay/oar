/**
 * Shared Types
 *
 * Re-exports domain types from schema for use in UI components.
 * UI components should import from here, not directly from @/db/schema.
 */

export type {
  Bill,
  BillWithTags,
  BillFrequency,
  BillStatus,
  Tag,
  Transaction,
} from '@/db/schema';


/** Standardized action result type */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
