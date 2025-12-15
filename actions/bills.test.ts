import { createBill, updateBill, getBillTags, getBillsFiltered } from './bills';
import { db, bills, billsToTags, resetDbMocks } from '@/db';

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

describe('getBillsFiltered', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  const mockBills = [
    {
      id: 'bill-1',
      title: 'Rent',
      amount: 100000,
      amountDue: 100000,
      dueDate: new Date('2025-01-15'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      status: 'pending' as const,
      isArchived: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'bill-2',
      title: 'Electric',
      amount: 5000,
      amountDue: 5000,
      dueDate: new Date('2025-01-20'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: true,
      status: 'pending' as const,
      isArchived: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'bill-3',
      title: 'Internet',
      amount: 8000,
      amountDue: 8000,
      dueDate: new Date('2025-02-10'),
      frequency: 'monthly' as const,
      isAutoPay: false,
      isVariable: false,
      status: 'pending' as const,
      isArchived: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ];

  const setupBillsAndTagsQuery = (
    billsToReturn = mockBills,
    tagAssociations: Array<{
      billId: string;
      tagId: string;
      tagName: string;
      tagSlug: string;
      tagCreatedAt: Date;
    }> = []
  ) => {
    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(billsToReturn),
          }),
          orderBy: jest.fn().mockResolvedValue(billsToReturn),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(tagAssociations),
          }),
        }),
      });
  };

  it('returns all non-archived bills sorted by dueDate when no filters provided', async () => {
    setupBillsAndTagsQuery();

    const result = await getBillsFiltered({});

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('bill-1');
    expect(result[1].id).toBe('bill-2');
    expect(result[2].id).toBe('bill-3');
    expect(db.select).toHaveBeenCalled();
  });

  it('ignores month parameter and returns all bills', async () => {
    setupBillsAndTagsQuery();
    const resultWithMonth = await getBillsFiltered({ month: '2025-01' });

    setupBillsAndTagsQuery();
    const resultWithoutMonth = await getBillsFiltered({});

    expect(resultWithMonth).toHaveLength(3);
    expect(resultWithoutMonth).toHaveLength(3);
    expect(resultWithMonth.map(b => b.id)).toEqual(resultWithoutMonth.map(b => b.id));
  });

  it('filters bills by specific date when date parameter provided', async () => {
    const billsOnDate = [mockBills[0]];
    setupBillsAndTagsQuery(billsOnDate);

    const result = await getBillsFiltered({ date: '2025-01-15' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
  });

  it('excludes archived bills by default', async () => {
    setupBillsAndTagsQuery(mockBills);

    const result = await getBillsFiltered({});

    expect(result.every(bill => !bill.isArchived)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('includes archived bills when includeArchived is true', async () => {
    const billsWithArchived = [
      ...mockBills,
      {
        ...mockBills[0],
        id: 'bill-archived',
        isArchived: true,
      },
    ];
    setupBillsAndTagsQuery(billsWithArchived);

    const result = await getBillsFiltered({ includeArchived: true });

    expect(result.some(bill => bill.isArchived)).toBe(true);
    expect(result.length).toBeGreaterThan(3);
  });

  it('filters bills by tag slug', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'tag-1' }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ billId: 'bill-1' }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockBills[0]]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

    const result = await getBillsFiltered({ tag: 'utilities' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
  });

  it('returns empty array when tag does not exist', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await getBillsFiltered({ tag: 'nonexistent' });

    expect(result).toEqual([]);
  });

  it('combines date and tag filters', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'tag-1' }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ billId: 'bill-1' }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockBills[0]]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

    const result = await getBillsFiltered({ date: '2025-01-15', tag: 'utilities' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
  });

  it('returns bills with tags attached', async () => {
    const tagAssociations = [
      {
        billId: 'bill-1',
        tagId: 'tag-1',
        tagName: 'Utilities',
        tagSlug: 'utilities',
        tagCreatedAt: new Date('2025-01-01'),
      },
    ];
    setupBillsAndTagsQuery([mockBills[0]], tagAssociations);

    const result = await getBillsFiltered({});

    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].slug).toBe('utilities');
  });

  it('returns empty array when no bills match filters', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await getBillsFiltered({ date: '2025-12-31' });

    expect(result).toEqual([]);
  });

  it('sorts bills by dueDate ascending', async () => {
    const sortedBills = [...mockBills].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    setupBillsAndTagsQuery(sortedBills);

    const result = await getBillsFiltered({});

    expect(result[0].dueDate.getTime()).toBeLessThanOrEqual(result[1].dueDate.getTime());
    expect(result[1].dueDate.getTime()).toBeLessThanOrEqual(result[2].dueDate.getTime());
    expect(result[0].id).toBe('bill-1');
    expect(result[1].id).toBe('bill-2');
    expect(result[2].id).toBe('bill-3');
  });
});
