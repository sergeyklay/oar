import type pino from 'pino';

import { vi, type Mock } from 'vitest';

type MockLogger = {
  info: Mock;
  error: Mock;
  debug: Mock;
  warn: Mock;
  fatal: Mock;
  trace: Mock;
  child: Mock<(_bindings: Record<string, unknown>) => MockLogger>;
};

const mockLoggerInstance: MockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  child: vi.fn((_bindings: Record<string, unknown>) => mockLoggerInstance),
};

export const getLogger = vi.fn(() => mockLoggerInstance as unknown as pino.Logger);
