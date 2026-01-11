'use client';

import { useActionState, useEffect, useRef, startTransition } from 'react';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/types';

interface ActionState<T> {
  value: T;
  error: string | null;
}

interface UseSettingDropdownOptions<T> {
  currentValue: T;
  onUpdate: (value: T) => Promise<ActionResult<void>>;
  showSuccessToast?: boolean;
}

interface UseSettingDropdownReturn<T> {
  displayValue: T;
  isPending: boolean;
  handleValueChange: (newValue: string) => void;
}

/**
 * Manages dropdown setting state with optimistic updates and error handling.
 *
 * Provides controlled state for settings dropdowns with automatic toast notifications,
 * error rollback, and synchronization with external prop changes.
 *
 * @template T - String literal type for the dropdown values
 * @param {UseSettingDropdownOptions<T>} options - Configuration object
 * @param {T} options.currentValue - Current setting value from server
 * @param {(value: T) => Promise<ActionResult<void>>} options.onUpdate - Async function to persist
 * @param {boolean} [options.showSuccessToast=true] - Whether to show success toast
 * @returns {UseSettingDropdownReturn<T>} Object with displayValue, isPending flag, and
 * handleValueChange callback
 */
export function useSettingDropdown<T extends string>({
  currentValue,
  onUpdate,
  showSuccessToast = true,
}: UseSettingDropdownOptions<T>): UseSettingDropdownReturn<T> {
  const updateAction = async (prevState: ActionState<T>, value: T): Promise<ActionState<T>> => {
    const result = await onUpdate(value);
    if (!result.success) {
      return {
        value: prevState.value,
        error: result.error || 'Failed to update setting',
      };
    }
    return {
      value,
      error: null,
    };
  };

  const [state, updateValue, isPending] = useActionState(updateAction, {
    value: currentValue,
    error: null,
  });

  const prevStateRef = useRef(state);
  const prevCurrentValueRef = useRef(currentValue);

  const displayValue = state.value as T;

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (state.error && !prevState.error) {
      toast.error('Failed to update setting', {
        description: state.error,
      });
    } else if (
      showSuccessToast &&
      state.value !== prevState.value &&
      !state.error &&
      !isPending &&
      state.value !== currentValue
    ) {
      toast.success('Setting updated');
    }
  }, [state, isPending, currentValue, showSuccessToast]);

  useEffect(() => {
    const prevCurrentValue = prevCurrentValueRef.current;
    prevCurrentValueRef.current = currentValue;

    if (currentValue !== prevCurrentValue && currentValue !== state.value && !isPending) {
      startTransition(() => {
        updateValue(currentValue);
      });
    }
  }, [currentValue, state.value, isPending, updateValue]);

  const handleValueChange = (newValue: string) => {
    startTransition(() => {
      updateValue(newValue as T);
    });
  };

  return {
    displayValue,
    isPending,
    handleValueChange,
  };
}
