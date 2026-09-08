import { vi } from 'vitest';

export const createId = vi.fn(() => 'mock-cuid-id');
export const init = vi.fn(() => createId);
export const getConstants = vi.fn(() => ({}));
export const isCuid = vi.fn(() => true);
