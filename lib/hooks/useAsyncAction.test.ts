import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useAsyncAction } from './useAsyncAction';
import type { ActionResult } from '@/lib/types';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useAsyncAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state management', () => {
    it('sets isPending to false initially', () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      expect(result.current.isPending).toBe(false);
    });

    it('sets isPending to true during action execution', async () => {
      let resolveAction: (value: ActionResult<void>) => void;
      const actionPromise = new Promise<ActionResult<void>>((resolve) => {
        resolveAction = resolve;
      });
      const mockAction = jest.fn().mockReturnValue(actionPromise);

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      act(() => {
        result.current.execute();
      });

      expect(result.current.isPending).toBe(true);

      act(() => {
        resolveAction!({ success: true });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    it('sets isPending to false after action completes successfully', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isPending).toBe(false);
    });

    it('sets isPending to false after action fails', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Action failed',
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isPending).toBe(false);
    });

    it('sets isPending to false after action throws exception', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Network error');
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('success handling', () => {
    it('shows success toast when successMessage is provided', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          successMessage: 'Action completed',
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.success).toHaveBeenCalledWith('Action completed', {
        description: undefined,
      });
    });

    it('shows success toast with description when provided', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          successMessage: 'Action completed',
          successDescription: 'The action was successful',
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.success).toHaveBeenCalledWith('Action completed', {
        description: 'The action was successful',
      });
    });

    it('does not show success toast when successMessage is not provided', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('does not show success toast when showSuccessToast is false', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          successMessage: 'Action completed',
          showSuccessToast: false,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('calls onSuccess callback with data when action succeeds', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: true,
        data: { id: '123' },
      });
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onSuccess,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith({ id: '123' });
    });

    it('calls onSuccess with undefined when result.data is undefined', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: true,
      });
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onSuccess,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith(undefined);
    });
  });

  describe('error handling', () => {
    it('shows error toast when action fails', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Action failed',
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).toHaveBeenCalledWith('Action failed', {
        description: 'Action failed',
      });
    });

    it('shows custom error toast message when errorMessage is provided', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Internal error',
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          errorMessage: 'Custom error message',
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).toHaveBeenCalledWith('Custom error message', {
        description: 'Internal error',
      });
    });

    it('uses result.error as fallback when errorMessage is not provided', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).toHaveBeenCalledWith('Database error', {
        description: 'Database error',
      });
    });

    it('uses default error message when result.error is undefined', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).toHaveBeenCalledWith('Action failed', {
        description: undefined,
      });
    });

    it('does not show error toast when showErrorToast is false', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Action failed',
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          showErrorToast: false,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('does not show error toast when errorMessage is null', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Action failed',
      });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          errorMessage: null,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('calls onError callback with error message and result', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Validation failed',
        fieldErrors: { title: ['Title is required'] },
      });
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onError,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalledWith('Validation failed', {
        success: false,
        error: 'Validation failed',
        fieldErrors: { title: ['Title is required'] },
      });
    });

    it('shows error toast when action throws exception', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Network error');
      });

      expect(toast.error).toHaveBeenCalledWith('Action failed');
    });

    it('calls onError callback when action throws exception', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Network error'));
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onError,
        }),
      );

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Network error');
      });

      expect(onError).toHaveBeenCalledWith('Unexpected error occurred', {
        success: false,
        error: 'Network error',
      });
    });

    it('re-throws exception after handling', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Network error');
      });
    });
  });

  describe('onSettled callback', () => {
    it('calls onSettled after successful action', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });
      const onSettled = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onSettled,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('calls onSettled after failed action', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Action failed',
      });
      const onSettled = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onSettled,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('calls onSettled after action throws exception', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Network error'));
      const onSettled = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          onSettled,
        }),
      );

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Network error');
      });

      expect(onSettled).toHaveBeenCalledTimes(1);
    });
  });

  describe('action parameters', () => {
    it('passes no parameters to action when execute is called without arguments', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockAction).toHaveBeenCalledWith();
    });

    it('passes single parameter to action', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute('param1');
      });

      expect(mockAction).toHaveBeenCalledWith('param1');
    });

    it('passes multiple parameters to action', async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
        }),
      );

      await act(async () => {
        await result.current.execute('param1', 42, true);
      });

      expect(mockAction).toHaveBeenCalledWith('param1', 42, true);
    });
  });

  describe('combined scenarios', () => {
    it('handles success with all callbacks and toast', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: true,
        data: { id: '123' },
      });
      const onSuccess = jest.fn();
      const onSettled = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          successMessage: 'Success',
          successDescription: 'Operation completed',
          onSuccess,
          onSettled,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.success).toHaveBeenCalledWith('Success', {
        description: 'Operation completed',
      });
      expect(onSuccess).toHaveBeenCalledWith({ id: '123' });
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(result.current.isPending).toBe(false);
    });

    it('handles error with all callbacks and toast', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Validation failed',
        fieldErrors: { field: ['Error message'] },
      });
      const onError = jest.fn();
      const onSettled = jest.fn();

      const { result } = renderHook(() =>
        useAsyncAction({
          action: mockAction,
          errorMessage: 'Custom error',
          onError,
          onSettled,
        }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(toast.error).toHaveBeenCalledWith('Custom error', {
        description: 'Validation failed',
      });
      expect(onError).toHaveBeenCalledWith('Validation failed', {
        success: false,
        error: 'Validation failed',
        fieldErrors: { field: ['Error message'] },
      });
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(result.current.isPending).toBe(false);
    });
  });
});
