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

  it('returns absolute path when DATABASE_URL is set to absolute path', () => {
    process.env.DATABASE_URL = '/absolute/path/to/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/absolute/path/to/db.sqlite');
  });

  it('resolves relative path when DATABASE_URL is set to relative path', () => {
    process.env.DATABASE_URL = './data/custom.db';

    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', './data/custom.db'));
  });

  it('strips file: protocol from absolute path', () => {
    process.env.DATABASE_URL = 'file:/absolute/path/to/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/absolute/path/to/db.sqlite');
  });

  it('strips file: protocol from relative path without resolving it', () => {
    process.env.DATABASE_URL = 'file:./data/custom.db';

    const result = resolveDatabasePath();

    expect(result).toBe('./data/custom.db');
  });

  it('returns :memory: unchanged when DATABASE_URL is set to :memory:', () => {
    process.env.DATABASE_URL = ':memory:';

    const result = resolveDatabasePath();

    expect(result).toBe(':memory:');
  });

  it('returns :memory: when DATABASE_URL is not set but :memory: is used', () => {
    const result = resolveDatabasePath(':memory:');

    expect(result).toBe(':memory:');
  });

  it('uses DEFAULT_DATABASE_PATH when DATABASE_URL is not set', () => {
    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', DEFAULT_DATABASE_PATH));
  });

  it('handles nested relative paths correctly', () => {
    process.env.DATABASE_URL = '../../other-project/data.db';

    const result = resolveDatabasePath();

    expect(result).toBe(resolve('/home/user/project', '../../other-project/data.db'));
  });

  it('handles file: protocol with absolute Windows path', () => {
    process.env.DATABASE_URL = 'file:C:\\Users\\test\\db.sqlite';
    process.cwd = jest.fn(() => 'C:\\Users\\test');

    const result = resolveDatabasePath();

    expect(result).toBe('C:\\Users\\test\\db.sqlite');
  });

  it('strips file: protocol from parent-relative path without resolving it', () => {
    process.env.DATABASE_URL = 'file:../data/test.db';

    const result = resolveDatabasePath();

    expect(result).toBe('../data/test.db');
  });

  it('preserves absolute path with file: protocol when path is already absolute', () => {
    process.env.DATABASE_URL = 'file:/usr/local/data/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/usr/local/data/db.sqlite');
  });

  it('converts file:// URL with absolute POSIX path using fileURLToPath', () => {
    process.env.DATABASE_URL = 'file:///absolute/path/to/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/absolute/path/to/db.sqlite');
  });

  it('converts file:// URL with Windows path using fileURLToPath', () => {
    process.env.DATABASE_URL = 'file:///C:/Users/test/db.sqlite';

    const result = resolveDatabasePath();

    expect(result).toBe('/C:/Users/test/db.sqlite');
  });

  it('converts file:// URL with percent-encoded characters', () => {
    process.env.DATABASE_URL = 'file:///path/to/hello%20world.db';

    const result = resolveDatabasePath();

    expect(result).toBe('/path/to/hello world.db');
  });

  it('converts file:// URL with Unicode characters', () => {
    process.env.DATABASE_URL = 'file:///path/to/你好.db';

    const result = resolveDatabasePath();

    expect(result).toBe('/path/to/你好.db');
  });

  it('converts file:// URL with special characters in path', () => {
    process.env.DATABASE_URL = 'file:///path/to/file%231.db';

    const result = resolveDatabasePath();

    expect(result).toBe('/path/to/file#1.db');
  });

  it('handles file:// URL passed as parameter', () => {
    const result = resolveDatabasePath('file:///custom/path/db.sqlite');

    expect(result).toBe('/custom/path/db.sqlite');
  });
});

describe('DEFAULT_DATABASE_PATH', () => {
  it('is defined as ./data/oar.db', () => {
    expect(DEFAULT_DATABASE_PATH).toBe('./data/oar.db');
  });
});

