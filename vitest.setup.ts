import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';

import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// React Testing Library registers its auto-cleanup only when `afterEach` is a
// global, which this project disables (`globals: false`). Registering it here
// preserves per-test DOM isolation.
afterEach(() => {
  cleanup();
});

// React Testing Library's default asyncWrapper drains pending microtasks
// through a 0ms timeout it advances via another runner's global; under
// Vitest that timeout never fires while fake timers are installed, and every
// userEvent and waitFor call would deadlock. Mirror the default wrapper and
// advance the faked clock ourselves instead.
configure({
  asyncWrapper: async (cb: () => unknown) => {
    const actEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    };
    const previousActEnvironment = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      const result = await cb();
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 0);
        if (vi.isFakeTimers()) {
          vi.advanceTimersByTime(0);
        }
      });
      return result;
    } finally {
      actEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  },
});

/**
 * Suppress console output during tests for cleaner test output.
 * Only error and fatal logs are shown to catch actual errors.
 */
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
};

/**
 * Mock the timezone module to avoid calling cookies() outside request scope.
 * Returns UTC (offset=0) by default. Tests can override using vi.mocked().
 */
vi.mock('@/lib/timezone', () => ({
  getUserTimezoneOffset: vi.fn().mockResolvedValue(0),
}));

/**
 * Mock ResizeObserver for Radix UI components and other UI libraries.
 */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/**
 * Mock PointerEvent for Radix UI components (required for many interactions).
 */
if (!global.PointerEvent) {
  (global as unknown as Record<string, unknown>).PointerEvent = class PointerEvent extends Event {
    constructor(type: string, params: Record<string, unknown> = {}) {
      super(type, params);
    }
  };
}

/**
 * Mock TextEncoder/TextDecoder for Next.js server components.
 */
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
