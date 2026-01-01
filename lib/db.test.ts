import { resolve } from 'path';
import { resolveDatabasePath, DEFAULT_DATABASE_PATH } from './db.mjs';

describe('resolveDatabasePath', () => {
  const originalEnv = process.env.DATABASE_URL;
  const originalCwd = process.cwd;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    process.cwd = jest.fn(() => '/home/user/project');
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    process.cwd = originalCwd;
  });

  it('returns absolute path unchanged', () => {
    process.env.DATABASE_URL = '/absolute/path/to/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/absolute/path/to/db.sqlite');
  });

  it('resolves relative path to absolute', () => {
    process.env.DATABASE_URL = './data/custom.db';

    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', './data/custom.db'));
  });

  it('returns :memory: unchanged', () => {
    process.env.DATABASE_URL = ':memory:';

    const result = resolveDatabasePath();

    expect(result).toBe(':memory:');
  });

  it('uses DEFAULT_DATABASE_PATH when DATABASE_URL is not set', () => {
    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', DEFAULT_DATABASE_PATH));
  });

  it('handles nested relative paths', () => {
    process.env.DATABASE_URL = '../../other-project/data.db';

    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', '../../other-project/data.db'));
  });

  it('accepts envPath as parameter', () => {
    const result = resolveDatabasePath('./custom/path.db');

    expect(result).toBe(resolve('/home/user/project', './custom/path.db'));
  });

  it('accepts :memory: as parameter', () => {
    const result = resolveDatabasePath(':memory:');

    expect(result).toBe(':memory:');
  });

  it('accepts custom baseDir', () => {
    const result = resolveDatabasePath('./data.db', '/custom/base');

    expect(result).toBe(resolve('/custom/base', './data.db'));
  });
});

describe('DEFAULT_DATABASE_PATH', () => {
  it('is defined as ./data/oar.db', () => {
    expect(DEFAULT_DATABASE_PATH).toBe('./data/oar.db');
  });
});
