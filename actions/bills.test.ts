import { createBill, updateBill, getBillTags } from './bills';
import { db, bills, billsToTags, resetDbMocks } from '@/db';
import { revalidatePath } from 'next/cache';

jest.mock('@/db');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('createBill', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it('converts float amount string to integer minor units', async () => {
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'bill-1' }]),
      }),
    });

    const input = {
      title: 'Test Bill',
      amount: '10.50',
      dueDate: new Date('2025-12-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    await createBill(input);

    expect(db.insert).toHaveBeenCalledWith(bills);
    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.amount).toBe(1050);
  });

  it('processes tagIds and inserts associations', async () => {
    (db.insert as jest.Mock)
      .mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'bill-1' }]),
        }),
      })
      .mockReturnValueOnce({
        values: jest.fn().mockResolvedValue(undefined),
      });

    const input = {
      title: 'Tagged Bill',
      amount: '25.00',
      dueDate: new Date('2025-12-20'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: ['tag-1', 'tag-2'],
    };

    const result = await createBill(input);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.insert).toHaveBeenNthCalledWith(1, bills);
    expect(db.insert).toHaveBeenNthCalledWith(2, billsToTags);

    const tagInsertCall = (db.insert as jest.Mock).mock.results[1].value;
    const tagValues = tagInsertCall.values.mock.calls[0][0];

    expect(tagValues).toEqual([
      { billId: 'bill-1', tagId: 'tag-1' },
      { billId: 'bill-1', tagId: 'tag-2' },
    ]);
  });

  it('returns validation error for invalid amount', async () => {
    const input = {
      title: 'Bad Bill',
      amount: 'not-a-number',
      dueDate: new Date(),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    const result = await createBill(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors?.amount).toBeDefined();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('returns validation error for empty title', async () => {
    const input = {
      title: '',
      amount: '10.00',
      dueDate: new Date(),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    const result = await createBill(input);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBeDefined();
  });

  it('handles database errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const input = {
      title: 'Error Bill',
      amount: '10.00',
      dueDate: new Date('2025-12-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    const result = await createBill(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to create bill. Please try again.');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('persists isVariable flag when set to true', async () => {
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'bill-1' }]),
      }),
    });

    const input = {
      title: 'Variable Electric Bill',
      amount: '75.00',
      dueDate: new Date('2025-12-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: true,
      tagIds: [],
    };

    const result = await createBill(input);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(bills);

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.isVariable).toBe(true);
  });
});

describe('updateBill', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it('converts float amount string to integer minor units', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input = {
      id: 'bill-1',
      title: 'Updated Bill',
      amount: '99.99',
      dueDate: new Date('2025-12-25'),
      frequency: 'yearly' as const,
      isAutoPay: true,
      isVariable: false,
      tagIds: [],
    };

    await updateBill(input);

    expect(db.update).toHaveBeenCalledWith(bills);
    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.amount).toBe(9999);
  });

  it('replaces tag associations on update', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    });

    const input = {
      id: 'bill-1',
      title: 'Tagged Bill',
      amount: '50.00',
      dueDate: new Date('2025-12-20'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: ['tag-3', 'tag-4'],
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalledWith(billsToTags);
    expect(db.insert).toHaveBeenCalledWith(billsToTags);

    const tagInsertCall = (db.insert as jest.Mock).mock.results[0].value;
    const tagValues = tagInsertCall.values.mock.calls[0][0];

    expect(tagValues).toEqual([
      { billId: 'bill-1', tagId: 'tag-3' },
      { billId: 'bill-1', tagId: 'tag-4' },
    ]);
  });

  it('returns validation error for missing id', async () => {
    const input = {
      id: '',
      title: 'No ID Bill',
      amount: '10.00',
      dueDate: new Date(),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    const result = await updateBill(input);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.id).toBeDefined();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('updates isVariable from false to true', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input = {
      id: 'bill-1',
      title: 'Now Variable Bill',
      amount: '100.00',
      dueDate: new Date('2025-12-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: true,
      tagIds: [],
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(bills);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.isVariable).toBe(true);
  });

  it('updates isVariable from true to false', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input = {
      id: 'bill-1',
      title: 'Now Fixed Bill',
      amount: '150.00',
      dueDate: new Date('2025-12-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.isVariable).toBe(false);
  });

  it('does NOT modify amountDue when updating bill (preserves partial payment progress)', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input = {
      id: 'bill-1',
      title: 'Updated Bill',
      amount: '250.00',
      dueDate: new Date('2025-12-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.amount).toBe(25000);
    expect(setCall).not.toHaveProperty('amountDue');
  });
});

describe('getBillTags', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('returns success with tags when bill found', async () => {
    const mockTags = [
      { id: 'tag-1', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockTags),
          }),
        }),
      }),
    });

    const result = await getBillTags('bill-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTags);
  });

  it('calls revalidatePath on success', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    await getBillTags('bill-1');

    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('returns success with empty array when no tags assigned', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const result = await getBillTags('bill-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns error with fieldErrors and data:[] for empty bill ID', async () => {
    const result = await getBillTags('');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.fieldErrors?.billId).toBeDefined();
    expect(result.data).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });
});
