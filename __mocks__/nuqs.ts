export const useQueryStates = jest.fn(() => [{}, jest.fn()]);
export const parseAsString = {
  withDefault: jest.fn(() => ({
    parse: (v: string) => v,
    serialize: (v: string) => v,
  })),
};

