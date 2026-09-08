import { vi } from 'vitest';

export const useQueryStates = vi.fn(() => [{}, vi.fn()]);
export const parseAsString = {
  withDefault: vi.fn(() => ({
    parse: (v: string) => v,
    serialize: (v: string) => v,
  })),
};
