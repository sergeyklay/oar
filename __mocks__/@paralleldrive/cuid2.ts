export const createId = jest.fn(() => 'mock-cuid-id');
export const init = jest.fn(() => createId);
export const getConstants = jest.fn(() => ({}));
export const isCuid = jest.fn(() => true);

