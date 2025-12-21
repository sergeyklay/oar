import { createBill, updateBill, getBillTags, getBillsFiltered, getBillsForCurrentMonthStats, getAllBillsStats, getBillsForDueSoonStats, skipPayment, type CreateBillInput, type UpdateBillInput } from './bills';
import { db, bills, billsToTags, resetDbMocks } from '@/db';
import { BillService } from '@/lib/services/BillService';
import { SettingsService } from '@/lib/services/SettingsService';
import { RecurrenceService } from '@/lib/services/RecurrenceService';
import type { BillWithTags } from '@/lib/types';
import { revalidatePath } from 'next/cache';

jest.mock('@/db');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('@/lib/services/BillService', () => ({
  BillService: {
    getFiltered: jest.fn(),
    getTags: jest.fn(),
  },
}));
jest.mock('@/lib/services/SettingsService', () => ({
  SettingsService: {
    getDueSoonRange: jest.fn(),
  },
}));
jest.mock('@/lib/services/RecurrenceService', () => ({
  RecurrenceService: {
    deriveStatus: jest.fn((dueDate: Date) => {
      const now = new Date();
      return dueDate < now ? 'overdue' : 'pending';
    }),
    calculateNextDueDate: jest.fn(),
  },
}));

const createMockBillInput = (overrides: Partial<CreateBillInput> = {}): CreateBillInput => ({
  title: 'Test Bill',
  amount: '10.00',
  dueDate: new Date('2025-12-15'),
  frequency: 'monthly' as const,
  isAutoPay: false,
  isVariable: false,
  categoryId: 'category-1',
  tagIds: [],
  notes: '',
  ...overrides,
});

const createMockBillWithTags = (overrides: Partial<BillWithTags> = {}): BillWithTags => ({
  id: 'bill-1',
  title: 'Test Bill',
  amount: 10000,
  amountDue: 10000,
  dueDate: new Date('2025-12-15'),
  frequency: 'monthly' as const,
  isAutoPay: false,
  isVariable: false,
  status: 'pending' as const,
  isArchived: false,
  notes: null,
  categoryId: 'category-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  tags: [],
  categoryIcon: 'house',
  ...overrides,
});

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

    const input = createMockBillInput({
      amount: '10.50',
    });

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

    const input = createMockBillInput({
      title: 'Tagged Bill',
      amount: '25.00',
      dueDate: new Date('2025-12-20'),
      tagIds: ['tag-1', 'tag-2'],
    });

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
    const input = createMockBillInput({
      title: 'Bad Bill',
      amount: 'not-a-number',
      dueDate: new Date(),
    });

    const result = await createBill(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors?.amount).toBeDefined();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('returns validation error for empty title', async () => {
    const input = createMockBillInput({
      title: '',
      amount: '10.00',
      dueDate: new Date(),
    });

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

    const input = createMockBillInput({
      title: 'Error Bill',
      amount: '10.00',
      dueDate: new Date('2025-12-15'),
    });

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

    const input = createMockBillInput({
      title: 'Variable Electric Bill',
      amount: '75.00',
      dueDate: new Date('2025-12-15'),
      isVariable: true,
    });

    const result = await createBill(input);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(bills);

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.isVariable).toBe(true);
  });

  it('validates all new frequency types', async () => {
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'bill-1' }]),
      }),
    });

    const frequencies: Array<CreateBillInput['frequency']> = [
      'weekly',
      'biweekly',
      'twicemonthly',
      'bimonthly',
      'quarterly',
    ];

    for (const frequency of frequencies) {
      const input = createMockBillInput({ frequency });
      const result = await createBill(input);
      expect(result.success).toBe(true);
    }
  });

  it('stores notes when provided', async () => {
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'bill-1' }]),
      }),
    });

    const input = createMockBillInput({
      title: 'Bill with Notes',
      amount: '50.00',
      dueDate: new Date('2025-12-15'),
      notes: 'Account number: 12345\nPayment instructions: Pay online',
    });

    const result = await createBill(input);

    expect(result.success).toBe(true);

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.notes).toBe('Account number: 12345\nPayment instructions: Pay online');
  });

  it('converts empty string notes to null', async () => {
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'bill-1' }]),
      }),
    });

    const input = createMockBillInput({
      title: 'Bill without Notes',
      amount: '30.00',
      dueDate: new Date('2025-12-15'),
      notes: '',
    });

    const result = await createBill(input);

    expect(result.success).toBe(true);

    const insertCall = (db.insert as jest.Mock).mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    expect(valuesCall.notes).toBeNull();
  });

  it('returns validation error when notes exceed 1000 characters', async () => {
    const longNotes = 'a'.repeat(1001);

    const input = createMockBillInput({
      title: 'Bill with Long Notes',
      amount: '25.00',
      dueDate: new Date('2025-12-15'),
      notes: longNotes,
    });

    const result = await createBill(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors?.notes).toBeDefined();
    expect(db.insert).not.toHaveBeenCalled();
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

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Updated Bill',
        amount: '99.99',
        dueDate: new Date('2025-12-25'),
        frequency: 'yearly' as const,
        isAutoPay: true,
      }),
      id: 'bill-1',
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

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Tagged Bill',
        amount: '50.00',
        dueDate: new Date('2025-12-20'),
        tagIds: ['tag-3', 'tag-4'],
      }),
      id: 'bill-1',
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
    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'No ID Bill',
        amount: '10.00',
        dueDate: new Date(),
      }),
      id: '',
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

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Now Variable Bill',
        amount: '100.00',
        dueDate: new Date('2025-12-15'),
        isVariable: true,
      }),
      id: 'bill-1',
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

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Now Fixed Bill',
        amount: '150.00',
        dueDate: new Date('2025-12-15'),
      }),
      id: 'bill-1',
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

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Updated Bill',
        amount: '250.00',
        dueDate: new Date('2025-12-15'),
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.amount).toBe(25000);
    expect(setCall).not.toHaveProperty('amountDue');
  });

  it('updates notes when provided', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Updated Bill',
        amount: '100.00',
        dueDate: new Date('2025-12-15'),
        notes: 'Updated account number: 99999',
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.notes).toBe('Updated account number: 99999');
  });

  it('converts empty string notes to null when updating', async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Bill with Notes Removed',
        amount: '75.00',
        dueDate: new Date('2025-12-15'),
        notes: '',
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.notes).toBeNull();
  });

  it('returns validation error when notes exceed 1000 characters on update', async () => {
    const longNotes = 'b'.repeat(1001);

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Bill with Long Notes',
        amount: '50.00',
        dueDate: new Date('2025-12-15'),
        notes: longNotes,
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.fieldErrors?.notes).toBeDefined();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('preserves paid status when editing a fully-paid one-time bill', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ amountDue: 0, status: 'paid' }]),
        }),
      }),
    });
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Paid One-Time Bill',
        amount: '100.00',
        dueDate: new Date('2024-01-15'),
        frequency: 'once',
        notes: 'Updated notes only',
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.status).toBe('paid');
  });

  it('derives status from due date for one-time bill that is not fully paid', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ amountDue: 5000, status: 'pending' }]),
        }),
      }),
    });
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Unpaid One-Time Bill',
        amount: '50.00',
        dueDate: new Date('2024-01-15'),
        frequency: 'once',
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.status).toBe('overdue');
  });

  it('derives status from due date for recurring bills even when fully paid', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ amountDue: 0, status: 'paid' }]),
        }),
      }),
    });
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const input: UpdateBillInput = {
      ...createMockBillInput({
        title: 'Monthly Bill',
        amount: '100.00',
        dueDate: new Date('2026-12-15'),
        frequency: 'monthly',
      }),
      id: 'bill-1',
    };

    const result = await updateBill(input);

    expect(result.success).toBe(true);

    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.status).toBe('pending');
  });
});

describe('getBillTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success with tags when bill found', async () => {
    const mockTags = [
      { id: 'tag-1', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
    ];

    (BillService.getTags as jest.Mock).mockResolvedValue(mockTags);

    const result = await getBillTags('bill-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTags);
    expect(BillService.getTags).toHaveBeenCalledWith('bill-1');
  });

  it('returns success with empty array when no tags assigned', async () => {
    (BillService.getTags as jest.Mock).mockResolvedValue([]);

    const result = await getBillTags('bill-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(BillService.getTags).toHaveBeenCalledWith('bill-1');
  });

  it('returns error with fieldErrors and data:[] for empty bill ID', async () => {
    const result = await getBillTags('');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.fieldErrors?.billId).toBeDefined();
    expect(result.data).toEqual([]);
    expect(BillService.getTags).not.toHaveBeenCalled();
  });
});

describe('getBillsFiltered', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBills: BillWithTags[] = [
    createMockBillWithTags({
      id: 'bill-1',
      title: 'Rent',
      amount: 100000,
      amountDue: 100000,
      dueDate: new Date('2025-01-15'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    }),
    createMockBillWithTags({
      id: 'bill-2',
      title: 'Electric',
      amount: 5000,
      amountDue: 5000,
      dueDate: new Date('2025-01-20'),
      isVariable: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    }),
    createMockBillWithTags({
      id: 'bill-3',
      title: 'Internet',
      amount: 8000,
      amountDue: 8000,
      dueDate: new Date('2025-02-10'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    }),
  ];

  it('returns all non-archived bills sorted by dueDate when no filters provided', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsFiltered({});

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('bill-1');
    expect(result[1].id).toBe('bill-2');
    expect(result[2].id).toBe('bill-3');
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });

  it('ignores month parameter and returns all bills', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);
    const resultWithMonth = await getBillsFiltered({ month: '2025-01' });

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);
    const resultWithoutMonth = await getBillsFiltered({});

    expect(resultWithMonth).toHaveLength(3);
    expect(resultWithoutMonth).toHaveLength(3);
    expect(resultWithMonth.map(b => b.id)).toEqual(resultWithoutMonth.map(b => b.id));
    expect(BillService.getFiltered).toHaveBeenCalledWith({ month: '2025-01' });
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });

  it('filters bills by specific date when date parameter provided', async () => {
    const billsOnDate = [mockBills[0]];
    (BillService.getFiltered as jest.Mock).mockResolvedValue(billsOnDate);

    const result = await getBillsFiltered({ date: '2025-01-15' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(BillService.getFiltered).toHaveBeenCalledWith({ date: '2025-01-15' });
  });

  it('excludes archived bills by default', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsFiltered({});

    expect(result.every(bill => !bill.isArchived)).toBe(true);
    expect(result).toHaveLength(3);
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });

  it('includes archived bills when includeArchived is true', async () => {
    const billsWithArchived = [
      ...mockBills,
      createMockBillWithTags({
        ...mockBills[0],
        id: 'bill-archived',
        isArchived: true,
      }),
    ];
    (BillService.getFiltered as jest.Mock).mockResolvedValue(billsWithArchived);

    const result = await getBillsFiltered({ includeArchived: true });

    expect(result.some(bill => bill.isArchived)).toBe(true);
    expect(result.length).toBeGreaterThan(3);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ includeArchived: true });
  });

  it('filters bills by tag slug', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue([mockBills[0]]);

    const result = await getBillsFiltered({ tag: 'utilities' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(BillService.getFiltered).toHaveBeenCalledWith({ tag: 'utilities' });
  });

  it('returns empty array when tag does not exist', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue([]);

    const result = await getBillsFiltered({ tag: 'nonexistent' });

    expect(result).toEqual([]);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ tag: 'nonexistent' });
  });

  it('combines date and tag filters', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue([mockBills[0]]);

    const result = await getBillsFiltered({ date: '2025-01-15', tag: 'utilities' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(BillService.getFiltered).toHaveBeenCalledWith({ date: '2025-01-15', tag: 'utilities' });
  });

  it('returns bills with tags attached', async () => {
    const billWithTags = createMockBillWithTags({
      ...mockBills[0],
      tags: [
        {
          id: 'tag-1',
          name: 'Utilities',
          slug: 'utilities',
          createdAt: new Date('2025-01-01'),
        },
      ],
    });
    (BillService.getFiltered as jest.Mock).mockResolvedValue([billWithTags]);

    const result = await getBillsFiltered({});

    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].slug).toBe('utilities');
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });

  it('returns empty array when no bills match filters', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue([]);

    const result = await getBillsFiltered({ date: '2025-12-31' });

    expect(result).toEqual([]);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ date: '2025-12-31' });
  });

  it('sorts bills by dueDate ascending', async () => {
    const sortedBills = [...mockBills].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    (BillService.getFiltered as jest.Mock).mockResolvedValue(sortedBills);

    const result = await getBillsFiltered({});

    expect(result[0].dueDate.getTime()).toBeLessThanOrEqual(result[1].dueDate.getTime());
    expect(result[1].dueDate.getTime()).toBeLessThanOrEqual(result[2].dueDate.getTime());
    expect(result[0].id).toBe('bill-1');
    expect(result[1].id).toBe('bill-2');
    expect(result[2].id).toBe('bill-3');
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });
});

describe('getBillsForCurrentMonthStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculates count, total, and hasVariable correctly for current month bills', async () => {
    jest.setSystemTime(new Date('2025-12-15'));

    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Rent',
        amount: 100000,
        amountDue: 100000,
        dueDate: new Date('2025-12-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-2',
        title: 'Electric',
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-12-20'),
        isVariable: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-3',
        title: 'Internet',
        amount: 8000,
        amountDue: 8000,
        dueDate: new Date('2025-12-25'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsForCurrentMonthStats();

    expect(result.count).toBe(3);
    expect(result.total).toBe(113000);
    expect(result.hasVariable).toBe(true);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ month: '2025-12' });
  });

  it('returns zero stats when no bills exist for current month', async () => {
    jest.setSystemTime(new Date('2025-12-15'));

    (BillService.getFiltered as jest.Mock).mockResolvedValue([]);

    const result = await getBillsForCurrentMonthStats();

    expect(result.count).toBe(0);
    expect(result.total).toBe(0);
    expect(result.hasVariable).toBe(false);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ month: '2025-12' });
  });

  it('calculates hasVariable as false when no variable bills exist', async () => {
    jest.setSystemTime(new Date('2025-12-15'));

    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Rent',
        amount: 100000,
        amountDue: 100000,
        dueDate: new Date('2025-12-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsForCurrentMonthStats();

    expect(result.hasVariable).toBe(false);
  });

  it('sums amountDue values correctly for total calculation', async () => {
    jest.setSystemTime(new Date('2025-12-15'));

    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Bill 1',
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2025-12-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-2',
        title: 'Bill 2',
        amount: 20000,
        amountDue: 15000,
        dueDate: new Date('2025-12-20'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsForCurrentMonthStats();

    expect(result.total).toBe(25000);
  });
});

describe('getAllBillsStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns count of all non-archived bills', async () => {
    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Rent',
        amount: 100000,
        amountDue: 100000,
        dueDate: new Date('2025-12-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-2',
        title: 'Electric',
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-12-20'),
        isVariable: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-3',
        title: 'Internet',
        amount: 8000,
        amountDue: 8000,
        dueDate: new Date('2025-11-25'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getAllBillsStats();

    expect(result.count).toBe(3);
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });

  it('returns zero count when no bills exist', async () => {
    (BillService.getFiltered as jest.Mock).mockResolvedValue([]);

    const result = await getAllBillsStats();

    expect(result.count).toBe(0);
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });

  it('excludes archived bills by calling getFiltered with empty options', async () => {
    const allBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Active Bill',
        amount: 100000,
        amountDue: 100000,
        dueDate: new Date('2025-12-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-2',
        title: 'Archived Bill',
        amount: 50000,
        amountDue: 50000,
        dueDate: new Date('2025-11-10'),
        isArchived: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    const nonArchivedBills = allBills.filter((bill) => !bill.isArchived);

    (BillService.getFiltered as jest.Mock).mockResolvedValue(nonArchivedBills);

    const result = await getAllBillsStats();

    expect(result.count).toBe(1);
    expect(BillService.getFiltered).toHaveBeenCalledWith({});
  });
});

describe('getBillsForDueSoonStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates count, total, and hasVariable correctly for due soon bills', async () => {
    (SettingsService.getDueSoonRange as jest.Mock).mockResolvedValue(7);

    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Rent',
        amount: 100000,
        amountDue: 100000,
        dueDate: new Date('2025-12-20'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-2',
        title: 'Electric',
        amount: 5000,
        amountDue: 5000,
        dueDate: new Date('2025-12-22'),
        isVariable: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsForDueSoonStats();

    expect(result.count).toBe(2);
    expect(result.total).toBe(105000);
    expect(result.hasVariable).toBe(true);
    expect(SettingsService.getDueSoonRange).toHaveBeenCalledTimes(1);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ dateRange: 7 });
  });

  it('returns zero stats when no bills exist for due soon range', async () => {
    (SettingsService.getDueSoonRange as jest.Mock).mockResolvedValue(7);
    (BillService.getFiltered as jest.Mock).mockResolvedValue([]);

    const result = await getBillsForDueSoonStats();

    expect(result.count).toBe(0);
    expect(result.total).toBe(0);
    expect(result.hasVariable).toBe(false);
    expect(BillService.getFiltered).toHaveBeenCalledWith({ dateRange: 7 });
  });

  it('calculates hasVariable as false when no variable bills exist', async () => {
    (SettingsService.getDueSoonRange as jest.Mock).mockResolvedValue(7);

    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Rent',
        amount: 100000,
        amountDue: 100000,
        dueDate: new Date('2025-12-20'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsForDueSoonStats();

    expect(result.hasVariable).toBe(false);
  });

  it('uses configured range from settings', async () => {
    (SettingsService.getDueSoonRange as jest.Mock).mockResolvedValue(14);
    (BillService.getFiltered as jest.Mock).mockResolvedValue([]);

    await getBillsForDueSoonStats();

    expect(BillService.getFiltered).toHaveBeenCalledWith({ dateRange: 14 });
  });

  it('sums amountDue values correctly for total calculation', async () => {
    (SettingsService.getDueSoonRange as jest.Mock).mockResolvedValue(7);

    const mockBills: BillWithTags[] = [
      createMockBillWithTags({
        id: 'bill-1',
        title: 'Bill 1',
        amount: 10000,
        amountDue: 10000,
        dueDate: new Date('2025-12-20'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
      createMockBillWithTags({
        id: 'bill-2',
        title: 'Bill 2',
        amount: 20000,
        amountDue: 15000,
        dueDate: new Date('2025-12-22'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }),
    ];

    (BillService.getFiltered as jest.Mock).mockResolvedValue(mockBills);

    const result = await getBillsForDueSoonStats();

    expect(result.total).toBe(25000);
  });
});

describe('skipPayment', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('fails for one-time bills', async () => {
    const mockBill = createMockBillWithTags({ frequency: 'once' });
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });

    const result = await skipPayment({ billId: 'bill-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot skip one-time bills');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('advances due date and resets amountDue for recurring bills', async () => {
    const mockBill = createMockBillWithTags({
      frequency: 'monthly',
      dueDate: new Date('2025-12-15'),
      amount: 10000,
      amountDue: 5000, // partial payment made
    });
    const nextDate = new Date('2026-01-15');

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });
    (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(nextDate);
    (RecurrenceService.deriveStatus as jest.Mock).mockReturnValue('pending');
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await skipPayment({ billId: 'bill-1' });

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(bills);
    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    const setCall = updateCall.set.mock.calls[0][0];

    expect(setCall.dueDate).toEqual(nextDate);
    expect(setCall.amountDue).toBe(10000);
    expect(setCall.status).toBe('pending');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('returns error if next due date cannot be calculated', async () => {
    const mockBill = createMockBillWithTags({ frequency: 'monthly' });
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });
    (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

    const result = await skipPayment({ billId: 'bill-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unable to calculate next due date');
  });

  it('handles bill not found', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await skipPayment({ billId: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bill not found');
  });
});
