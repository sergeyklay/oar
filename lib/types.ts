import React from 'react';

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
  BillCategory,
  BillCategoryGroup,
  BillCategoryWithGroup,
  BillCategoryGroupWithCategories,
} from '@/db/schema';

export type {
  ForecastBill,
  AmortizationResult,
  ForecastSummary,
} from '@/lib/services/ForecastService';

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

/**
 * Represents a payment transaction with associated bill information.
 * Used for displaying recent payments in the Paid Recently view.
 *
 * @property {string} id - Transaction ID
 * @property {string} billTitle - Bill name for display
 * @property {number} amount - Payment amount in minor units
 * @property {Date} paidAt - Payment date
 * @property {string | null} notes - Optional payment notes
 * @property {string} categoryIcon - Lucide icon name for category
 */
export interface PaymentWithBill {
  id: string;
  billTitle: string;
  amount: number;
  paidAt: Date;
  notes: string | null;
  categoryIcon: string;
}

/**
 * Utility type for extracting prop types from React components.
 *
 * Allows type-safe extraction of event handler types from components,
 * enabling automatic type inference when extracting event handlers to separate functions.
 *
 * Based on: https://www.guisehn.com/react-extract-event-handler-typescript/
 *
 * @template Component - The React component type (use `typeof ComponentName`)
 * @template PropKey - The name of the prop to extract (e.g., "onClick", "onSubmit")
 *
 * @example
 * ```tsx
 * import { Button } from "@/components/ui/button";
 * import { type Prop } from "@/lib/types";
 *
 * function MyComponent() {
 *   const handleClick: Prop<typeof Button, "onClick"> = (event) => {
 *     // `event` is automatically inferred with correct type
 *     event.preventDefault();
 *   };
 *
 *   return <Button onClick={handleClick}>Click me</Button>;
 * }
 * ```
 */
type ComponentType = React.ElementType;

export type Prop<
  Component extends ComponentType,
  PropKey extends keyof React.ComponentProps<Component>
> = React.ComponentProps<Component>[PropKey];
