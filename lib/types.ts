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

/**
 * Standardized result wrapper for Server Actions and operations.
 *
 * Provides a consistent interface for returning success/failure states along with
 * optional data payloads or error messages. Used throughout the application to
 * ensure uniform error handling and result processing.
 *
 * @template T - The type of data payload returned on successful operations.
 *               Defaults to `void` for operations that don't return data.
 *
 * @property {boolean} success - Indicates whether the operation completed successfully.
 *                               When `true`, `data` should be present. When `false`, `error` should
 *                               be present.
 * @property {T} [data] - Optional payload containing the result data on success.
 *                        Only present when `success` is `true`.
 * @property {string} [error] - Optional error message describing what went wrong.
 *                               Only present when `success` is `false`.
 *
 * @example
 * // Success case with data
 * const result: ActionResult<{ id: string }> = {
 *   success: true,
 *   data: { id: '123' }
 * };
 *
 * @example
 * // Failure case with error
 * const result: ActionResult = {
 *   success: false,
 *   error: 'Validation failed'
 * };
 *
 * @example
 * // Usage in Server Action
 * export async function createBill(input: CreateBillInput): Promise<ActionResult<{ id: string }>> {
 *   try {
 *     const bill = await BillService.create(input);
 *     return { success: true, data: { id: bill.id } };
 *   } catch (error) {
 *     return { success: false, error: 'Failed to create bill' };
 *   }
 * }
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
