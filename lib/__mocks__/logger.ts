import type pino from 'pino';

type MockLogger = {
  info: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
  warn: jest.Mock;
  fatal: jest.Mock;
  trace: jest.Mock;
  child: jest.Mock<MockLogger, []>;
};

const mockLoggerInstance: MockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  child: jest.fn(() => mockLoggerInstance),
};

export const getLogger = jest.fn(() => mockLoggerInstance as unknown as pino.Logger);

