'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/types';

/**
 * Options for configuring async action behavior.
 *
 * @template TData - Type of data returned by the action on success
 * @template TInput - Type of input parameters accepted by the action function
 */
interface UseAsyncActionOptions<TData, TInput extends unknown[]> {
  /**
   * Async function that returns ActionResult<TData>.
   * Can accept zero or more parameters of type TInput.
   */
  action: (...args: TInput) => Promise<ActionResult<TData>>;

  /**
   * Optional callback invoked on successful action execution.
   * Receives the data payload from ActionResult.
   */
  onSuccess?: (data: TData) => void;

  /**
   * Optional callback invoked on action failure.
   * Receives the error message and full ActionResult for field error handling.
   */
  onError?: (error: string, result: ActionResult<TData>) => void;

  /**
   * Optional callback invoked after action completes (success or error).
   * Useful for cleanup or side effects that should run regardless of outcome.
   */
  onSettled?: () => void;

  /**
   * Optional success toast message.
   * If provided, shows toast.success() on success.
   * If not provided, no success toast is shown.
   */
  successMessage?: string;

  /**
   * Optional success toast description.
   * Shown as description in toast.success().
   */
  successDescription?: string;

  /**
   * Optional error toast message.
   * Defaults to 'Action failed' if not provided.
   * If null, no error toast is shown.
   */
  errorMessage?: string | null;

  /**
   * Whether to show error toast on failure.
   * Defaults to true.
   */
  showErrorToast?: boolean;

  /**
   * Whether to show success toast on success.
   * Defaults to true if successMessage is provided, false otherwise.
   */
  showSuccessToast?: boolean;
}

/**
 * Return value from useAsyncAction hook.
 *
 * @template TData - Type of data returned by the action
 * @template TInput - Type of input parameters
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface UseAsyncActionReturn<TData, TInput extends unknown[]> {
  /**
   * Function to execute the async action.
   * Accepts the same parameters as the action function.
   * Returns a promise that resolves when the action completes.
   */
  execute: (...args: TInput) => Promise<void>;

  /**
   * Boolean indicating whether the action is currently pending.
   * True while the action is executing, false otherwise.
   */
  isPending: boolean;
}

/**
 * Custom hook for managing async Server Actions with loading states and toast notifications.
 *
 * Encapsulates the common pattern of:
 * - Setting loading state
 * - Calling async action
 * - Handling success/error results
 * - Showing toast notifications
 * - Invoking optional callbacks
 *
 * @template TData - Type of data returned by the action on success
 * @template TInput - Type of input parameters (use tuple for multiple params)
 * @param {UseAsyncActionOptions<TData, TInput>} options - Configuration options
 * @returns {UseAsyncActionReturn<TData, TInput>} Object with execute function and isPending state
 *
 * @example
 * // Simple usage with toast
 * const { execute: handleSkip, isPending: isSkipping } = useAsyncAction({
 *   action: () => skipPayment({ billId: bill.id }),
 *   successMessage: `Payment skipped for "${bill.title}"`,
 * });
 *
 * @example
 * // With callbacks
 * const { execute: handleDelete, isPending: isDeleting } = useAsyncAction({
 *   action: () => deleteBill(bill.id),
 *   successMessage: 'Bill deleted',
 *   successDescription: `"${bill.title}" has been removed.`,
 *   onSuccess: () => setSelectedBill(null),
 *   onSettled: () => setDeleteDialogOpen(false),
 * });
 *
 * @example
 * // Action with parameters
 * const { execute: handleArchive, isPending: isArchiving } = useAsyncAction({
 *   action: (isArchived: boolean) => archiveBill(bill.id, isArchived),
 *   successMessage: bill.isArchived ? 'Bill unarchived' : 'Bill archived',
 *   onSuccess: () => setSelectedBill(null),
 * });
 *
 * @example
 * // Form submission with field errors
 * const { execute: onSubmit, isPending: isSubmitting } = useAsyncAction({
 *   action: (values: FormValues) => logPayment(values),
 *   successMessage: 'Payment logged',
 *   onError: (error, result) => {
 *     if (result.fieldErrors) {
 *       Object.entries(result.fieldErrors).forEach(([field, messages]) => {
 *         form.setError(field as keyof FormValues, { message: messages?.[0] });
 *       });
 *     }
 *   },
 * });
 */
export function useAsyncAction<TData = void, TInput extends unknown[] = []>(
  options: UseAsyncActionOptions<TData, TInput>
): UseAsyncActionReturn<TData, TInput> {
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (...args: TInput): Promise<void> => {
      setIsPending(true);

      try {
        const result = await options.action(...args);
        setIsPending(false);

        if (result.success) {
          const shouldShowSuccess =
            options.showSuccessToast !== false &&
            options.successMessage !== undefined;

          if (shouldShowSuccess) {
            toast.success(options.successMessage, {
              description: options.successDescription,
            });
          }

          if (options.onSuccess) {
            options.onSuccess(result.data as TData);
          }
        } else {
          const errorMsg = result.error ?? 'Action failed';
          const shouldShowError = options.showErrorToast !== false;

          if (shouldShowError && options.errorMessage !== null) {
            toast.error(options.errorMessage ?? errorMsg, {
              description: result.error,
            });
          }

          if (options.onError) {
            options.onError(errorMsg, result);
          }
        }

        if (options.onSettled) {
          options.onSettled();
        }
      } catch (error) {
        setIsPending(false);

        const shouldShowError = options.showErrorToast !== false;

        if (shouldShowError && options.errorMessage !== null) {
          toast.error(options.errorMessage ?? 'Action failed');
        }

        if (options.onError) {
          options.onError('Unexpected error occurred', {
            success: false,
            error: error instanceof Error ? error.message : 'Unexpected error occurred',
          });
        }

        if (options.onSettled) {
          options.onSettled();
        }

        throw error;
      }
    },
    [options]
  );

  return { execute, isPending };
}

