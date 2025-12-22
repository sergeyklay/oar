import '@testing-library/jest-dom';

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
