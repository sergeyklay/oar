import { createTag, getTags, getTagBySlug } from './tags';
import { db, tags, resetDbMocks } from '@/db';
import { getLogger } from '@/lib/logger';

jest.mock('@/db');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('@/lib/logger');

describe('createTag', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it('returns existing tag if slug already exists (idempotent)', async () => {
    const existingTag = {
      id: 'existing-id',
      name: 'Business',
      slug: 'business',
      createdAt: new Date(),
    };

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([existingTag]),
      }),
    });

    const result = await createTag({ name: 'Business' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: 'existing-id',
      name: 'Business',
      slug: 'business',
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('creates new tag if slug does not exist', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'new-id',
          name: 'Personal',
          slug: 'personal',
        }]),
      }),
    });

    const result = await createTag({ name: 'Personal' });

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(tags);

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.name).toBe('Personal');
    expect(valuesCall.slug).toBe('personal');
  });

  it('generates correct slug from name with spaces', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'new-id',
          name: 'Business Expenses',
          slug: 'business-expenses',
        }]),
      }),
    });

    await createTag({ name: 'Business Expenses' });

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.slug).toBe('business-expenses');
  });

  it('generates correct slug from name with special chars', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'new-id',
          name: 'My Credit Card!',
          slug: 'my-credit-card',
        }]),
      }),
    });

    await createTag({ name: 'My Credit Card!' });

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.slug).toBe('my-credit-card');
  });

  it('returns validation error for empty name', async () => {
    const result = await createTag({ name: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Tag name is required');
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('returns validation error for name exceeding 50 chars', async () => {
    const longName = 'a'.repeat(51);

    const result = await createTag({ name: longName });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Tag name must be 50 characters or less');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    const mockLogger = getLogger('Actions:Tags') as unknown as { error: jest.Mock };

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const result = await createTag({ name: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to create tag. Please try again.');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe('getTags', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it('fetches all tags ordered by name', async () => {
    const mockTags = [
      { id: '1', name: 'Alpha', slug: 'alpha', createdAt: new Date() },
      { id: '2', name: 'Beta', slug: 'beta', createdAt: new Date() },
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockTags),
      }),
    });

    const result = await getTags();

    expect(result).toEqual(mockTags);
    expect(db.select).toHaveBeenCalled();
  });
});

describe('getTagBySlug', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it('returns tag when found', async () => {
    const mockTag = { id: '1', name: 'Business', slug: 'business', createdAt: new Date() };

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockTag]),
      }),
    });

    const result = await getTagBySlug('business');

    expect(result).toEqual(mockTag);
  });

  it('returns null when tag not found', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await getTagBySlug('nonexistent');

    expect(result).toBeNull();
  });
});
