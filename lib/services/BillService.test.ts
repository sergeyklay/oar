import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { BillService } from './BillService';
import { db, bills, resetDbMocks } from '@/db';
import { SettingsService } from './SettingsService';
import { DateAdjustmentService } from './DateAdjustmentService';
import type { BillWithTags } from '@/db/schema';

vi.mock('@/db');
vi.mock('./SettingsService');
vi.mock('./DateAdjustmentService');

describe('BillService.getFiltered', () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  const mockBills: BillWithTags[] = [
    {
      id: 'bill-1',
      title: 'December Bill',
      amount: 10000,
      amountDue: 10000,
      dueDate: new Date('2025-12-10'),
      endDate: null,
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
      weekendAdjustment: null,
    },
    {
      id: 'bill-2',
      title: 'January Bill',
      amount: 20000,
      amountDue: 20000,
      dueDate: new Date('2026-01-15'),
      endDate: null,
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
      weekendAdjustment: null,
    },
    {
      id: 'bill-3',
      title: 'February Bill',
      amount: 30000,
      amountDue: 30000,
      dueDate: new Date('2026-02-20'),
      endDate: null,
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
      weekendAdjustment: null,
    },
  ];

  const createSelectMock = (activeBills: BillWithTags[], paidBills: BillWithTags[] = []) => {
    // Convert BillWithTags[] to the format returned by the JOIN query
    const mapToJoined = (bills: BillWithTags[]) =>
      bills.map((bill) => ({
        bill: {
          id: bill.id,
          title: bill.title,
          amount: bill.amount,
          amountDue: bill.amountDue,
          dueDate: bill.dueDate,
          frequency: bill.frequency,
          isAutoPay: bill.isAutoPay,
          isVariable: bill.isVariable,
          status: bill.status,
          isArchived: bill.isArchived,
          notes: bill.notes,
          categoryId: bill.categoryId,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
        },
        categoryIcon: bill.categoryIcon,
      }));

    const activeJoined = mapToJoined(activeBills);
    const paidJoined = mapToJoined(paidBills);

    const mockBuilder = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValueOnce(activeJoined).mockResolvedValueOnce(paidJoined),
    };
    (db.select as Mock).mockReturnValue(mockBuilder);
    return mockBuilder;
  };

  it('returns all bills from multiple months when no filters provided', async () => {
    const mockBuilder = createSelectMock(mockBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({});

    expect(result).toHaveLength(3);
    expect(result.map((b) => b.id)).toEqual(['bill-1', 'bill-2', 'bill-3']);
    expect(result[0].tags).toEqual([]);
    expect(result[1].tags).toEqual([]);
    expect(result[2].tags).toEqual([]);
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.from).toHaveBeenCalledWith(bills);
    expect(mockBuilder.orderBy).toHaveBeenCalledWith(bills.dueDate);
    expect(BillService.getTagsForBills).toHaveBeenCalledWith(['bill-1', 'bill-2', 'bill-3']);
  });

  it('returns active bills before paid bills when no filter provided', async () => {
    const activeBills: BillWithTags[] = [
      {
        ...mockBills[0],
        id: 'active-1',
        status: 'pending' as const,
        dueDate: new Date('2026-01-15'),
        endDate: null,
      },
    ];

    const paidBills: BillWithTags[] = [
      {
        ...mockBills[1],
        id: 'paid-1',
        status: 'paid' as const,
        dueDate: new Date('2025-12-10'),
        endDate: null,
      },
    ];

    createSelectMock(activeBills, paidBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({});

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('active-1');
    expect(result[0].status).toBe('pending');
    expect(result[1].id).toBe('paid-1');
    expect(result[1].status).toBe('paid');
  });

  it('returns only bills from specified month when month filter provided', async () => {
    const decemberBills = [mockBills[0]];
    const mockBuilder = createSelectMock(decemberBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-12' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(result[0].title).toBe('December Bill');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('returns only bills from specified date when date filter provided', async () => {
    const dateBills = [mockBills[0]];
    const mockBuilder = createSelectMock(dateBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ date: '2025-12-10' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('date filter takes precedence over month filter when both provided', async () => {
    const dateBills = [mockBills[0]];
    const mockBuilder = createSelectMock(dateBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ date: '2025-12-10', month: '2026-01' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('returns empty array when no bills match month filter', async () => {
    createSelectMock([]);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-03' });

    expect(result).toHaveLength(0);
    expect(db.select).toHaveBeenCalled();
  });

  it('returns bills sorted by dueDate ascending', async () => {
    const unsortedBills = [mockBills[2], mockBills[0], mockBills[1]];
    const mockBuilder = createSelectMock(unsortedBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({});

    expect(mockBuilder.orderBy).toHaveBeenCalledWith(bills.dueDate);
    expect(result).toHaveLength(3);
  });

  it('excludes paid bills when filtering by month', async () => {
    const billsWithMixedStatus: BillWithTags[] = [
      {
        ...mockBills[0],
        id: 'bill-pending',
        status: 'pending' as const,
        tags: [],
      },
      {
        ...mockBills[0],
        id: 'bill-paid',
        status: 'paid' as const,
        tags: [],
      },
      {
        ...mockBills[0],
        id: 'bill-overdue',
        status: 'overdue' as const,
        tags: [],
      },
    ];

    const expectedBills = [billsWithMixedStatus[0], billsWithMixedStatus[2]];
    const mockBuilder = createSelectMock(expectedBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-12' });

    expect(result).toHaveLength(2);
    expect(result.every((bill) => bill.status !== 'paid')).toBe(true);
    expect(result.some((bill) => bill.status === 'pending')).toBe(true);
    expect(result.some((bill) => bill.status === 'overdue')).toBe(true);
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('includes pending bills when filtering by month', async () => {
    const pendingBill: BillWithTags[] = [
      {
        ...mockBills[0],
        status: 'pending' as const,
        tags: [],
      },
    ];
    createSelectMock(pendingBill);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-12' });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
    expect(db.select).toHaveBeenCalled();
  });

  it('includes archived bills when includeArchived is true', async () => {
    const archivedBills: BillWithTags[] = [
      {
        ...mockBills[0],
        id: 'archived-1',
        isArchived: true,
      },
    ];
    createSelectMock(archivedBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ includeArchived: true });

    expect(result).toHaveLength(1);
    expect(result[0].isArchived).toBe(true);
    expect(db.select).toHaveBeenCalled();
  });

  it('returns only archived bills when archivedOnly is true', async () => {
    const archivedBills: BillWithTags[] = [
      {
        ...mockBills[0],
        id: 'archived-1',
        isArchived: true,
      },
    ];
    createSelectMock(archivedBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ archivedOnly: true });

    expect(result).toHaveLength(1);
    expect(result[0].isArchived).toBe(true);
    expect(db.select).toHaveBeenCalled();
  });

  it('excludes archived bills by default', async () => {
    const activeBills = [mockBills[0]];
    createSelectMock(activeBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({});

    expect(result.every((bill) => !bill.isArchived)).toBe(true);
    expect(db.select).toHaveBeenCalled();
  });

  it('filters bills by tag slug', async () => {
    const billsWithTag = [mockBills[0]];
    const mockBuilder = createSelectMock(billsWithTag);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    (db.select as Mock)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'tag-1' }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ billId: 'bill-1' }]),
        }),
      });

    const result = await BillService.getFiltered({ tag: 'utilities' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('returns empty array when tag does not exist', async () => {
    (db.select as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await BillService.getFiltered({ tag: 'nonexistent' });

    expect(result).toEqual([]);
  });

  it('returns bills with tags attached', async () => {
    const billsWithTags = [mockBills[0]];
    createSelectMock(billsWithTags);
    const tagsMap = new Map([
      [
        'bill-1',
        [
          {
            id: 'tag-1',
            name: 'Utilities',
            slug: 'utilities',
            createdAt: new Date('2025-01-01'),
          },
        ],
      ],
    ]);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(tagsMap);

    const result = await BillService.getFiltered({});

    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].slug).toBe('utilities');
  });

  it('handles date range filter correctly', async () => {
    const billsInRange = [mockBills[0]];
    const mockBuilder = createSelectMock(billsInRange);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ dateRange: 7 });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('handles date range of 0 (today only)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-10T12:00:00Z'));

    const billsToday = [mockBills[0]];
    createSelectMock(billsToday);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ dateRange: 0 });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('handles date range of 1 (today and tomorrow)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-09T12:00:00Z'));

    const billsInRange = [mockBills[0]];
    createSelectMock(billsInRange);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ dateRange: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');

    vi.useRealTimers();
  });

  it('handles month filter for current month with overdue bills', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-15T12:00:00Z'));

    const currentMonthBills = [mockBills[0]];
    createSelectMock(currentMonthBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-12' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');

    vi.useRealTimers();
  });

  it('handles month filter for future month', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-15T12:00:00Z'));

    const futureMonthBills = [mockBills[1]];
    createSelectMock(futureMonthBills);
    vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2026-01' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-2');

    vi.useRealTimers();
  });
});

describe('BillService.getWithTags', () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  const mockBill = {
    id: 'bill-1',
    title: 'Test Bill',
    amount: 10000,
    amountDue: 10000,
    dueDate: new Date('2025-12-15'),
    endDate: null,
    frequency: 'monthly' as const,
    isAutoPay: false,
    isVariable: false,
    status: 'pending' as const,
    isArchived: false,
    notes: null,
    categoryId: 'category-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCategoryIcon = 'house';

  it('returns bill with tags when found and not archived', async () => {
    (db.select as Mock)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                bill: mockBill,
                categoryIcon: mockCategoryIcon,
              },
            ]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  id: 'tag-1',
                  name: 'Utilities',
                  slug: 'utilities',
                  createdAt: new Date('2025-01-01'),
                },
              ]),
            }),
          }),
        }),
      });

    const result = await BillService.getWithTags('bill-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('bill-1');
    expect(result?.categoryIcon).toBe('house');
    expect(result?.tags).toHaveLength(1);
    expect(result?.tags[0].slug).toBe('utilities');
  });

  it('returns null when bill is archived and includeArchived is false', async () => {
    (db.select as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await BillService.getWithTags('bill-archived', false);

    expect(result).toBeNull();
  });

  it('returns archived bill when includeArchived is true', async () => {
    const archivedBill = {
      ...mockBill,
      id: 'bill-archived',
      isArchived: true,
    };

    (db.select as Mock)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                bill: archivedBill,
                categoryIcon: mockCategoryIcon,
              },
            ]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

    const result = await BillService.getWithTags('bill-archived', true);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('bill-archived');
    expect(result?.isArchived).toBe(true);
  });

  it('returns null when bill not found', async () => {
    (db.select as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await BillService.getWithTags('nonexistent');

    expect(result).toBeNull();
  });
});

describe('BillService.searchByTitle', () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  const mockBill = {
    id: 'bill-1',
    title: 'Electric Bill',
    amount: 10000,
    amountDue: 10000,
    dueDate: new Date('2025-12-15'),
    endDate: null,
    frequency: 'monthly' as const,
    isAutoPay: false,
    isVariable: false,
    status: 'pending' as const,
    isArchived: false,
    notes: null,
    categoryId: 'category-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCategoryIcon = 'house';

  const createSearchMock = (matchingBills: (typeof mockBill)[] = []) => {
    const mapToJoined = (bills: (typeof mockBill)[]) =>
      bills.map((bill) => ({
        bill,
        categoryIcon: mockCategoryIcon,
      }));

    const joined = mapToJoined(matchingBills);

    return {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(joined),
    };
  };

  describe('input validation', () => {
    it('returns empty array when query is less than 3 characters', async () => {
      const result = await BillService.searchByTitle('el');

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('returns empty array when query is exactly 2 characters', async () => {
      const result = await BillService.searchByTitle('ab');

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('returns empty array when query is empty string', async () => {
      const result = await BillService.searchByTitle('');

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('returns empty array when query is only whitespace', async () => {
      const result = await BillService.searchByTitle('   ');

      expect(result).toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('accepts query with exactly 3 characters', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('abc');

      expect(result).toHaveLength(1);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('query normalization', () => {
    it('trims whitespace from query', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle('  electric  ');

      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();
    });

    it('converts query to lowercase', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle('ELECTRIC');

      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();
    });

    it('handles query with multiple spaces between words', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric    bill');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-1');
      expect(mockBuilder.where).toHaveBeenCalled();
    });

    it('handles query with tabs and newlines', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle('electric\tbill\n');

      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();
    });
  });

  describe('word matching', () => {
    it('returns bills matching single word query', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-1');
      expect(result[0].title).toBe('Electric Bill');
      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.limit).toHaveBeenCalledWith(20);
    });

    it('returns bills matching multiple word query with AND logic', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric bill');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-1');
      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();
    });

    it('matches word at start of title', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Electric Bill');
    });

    it('matches word in middle of title', async () => {
      const billWithMiddleWord = {
        ...mockBill,
        id: 'bill-2',
        title: 'My Electric Company',
      };
      const mockBuilder = createSearchMock([billWithMiddleWord]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('My Electric Company');
    });
  });

  describe('results', () => {
    it('returns bills with tags attached', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      const tagsMap = new Map([
        [
          'bill-1',
          [
            {
              id: 'tag-1',
              name: 'Utilities',
              slug: 'utilities',
              createdAt: new Date('2025-01-01'),
            },
          ],
        ],
      ]);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(tagsMap);

      const result = await BillService.searchByTitle('electric');

      expect(result[0].tags).toHaveLength(1);
      expect(result[0].tags[0].slug).toBe('utilities');
    });

    it('returns bills with category icon attached', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(result[0].categoryIcon).toBe(mockCategoryIcon);
    });

    it('returns empty array when no bills match', async () => {
      const mockBuilder = createSearchMock([]);
      (db.select as Mock).mockReturnValue(mockBuilder);

      const result = await BillService.searchByTitle('nonexistent');

      expect(result).toEqual([]);
      expect(db.select).toHaveBeenCalled();
    });

    it('orders results alphabetically by title', async () => {
      const bill1 = { ...mockBill, id: 'bill-1', title: 'Zebra Bill' };
      const bill2 = { ...mockBill, id: 'bill-2', title: 'Alpha Bill' };
      const bill3 = { ...mockBill, id: 'bill-3', title: 'Beta Bill' };
      const mockBuilder = createSearchMock([bill1, bill2, bill3]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle('bill');

      expect(mockBuilder.orderBy).toHaveBeenCalled();
    });
  });

  describe('archived bills', () => {
    it('includes archived bills in search results', async () => {
      const archivedBill = {
        ...mockBill,
        id: 'bill-archived',
        isArchived: true,
        title: 'Archived Electric Bill',
      };
      const mockBuilder = createSearchMock([archivedBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(result).toHaveLength(1);
      expect(result[0].isArchived).toBe(true);
      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();
    });

    it('includes both archived and non-archived bills', async () => {
      const archivedBill = {
        ...mockBill,
        id: 'bill-archived',
        isArchived: true,
        title: 'Archived Electric Bill',
      };
      const activeBill = {
        ...mockBill,
        id: 'bill-active',
        isArchived: false,
        title: 'Active Electric Bill',
      };
      const mockBuilder = createSearchMock([archivedBill, activeBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(result).toHaveLength(2);
      expect(result.some((b) => b.isArchived)).toBe(true);
      expect(result.some((b) => !b.isArchived)).toBe(true);
    });
  });

  describe('result limits', () => {
    it('limits results to 20 bills', async () => {
      const manyBills = Array.from({ length: 25 }, (_, i) => ({
        ...mockBill,
        id: `bill-${i}`,
        title: `Electric Bill ${i}`,
      }));
      const mockBuilder = createSearchMock(manyBills);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle('electric');

      expect(mockBuilder.limit).toHaveBeenCalledWith(20);
    });

    it('returns all results when fewer than 20 bills match', async () => {
      const fewBills = Array.from({ length: 5 }, (_, i) => ({
        ...mockBill,
        id: `bill-${i}`,
        title: `Electric Bill ${i}`,
      }));
      const mockBuilder = createSearchMock(fewBills);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.searchByTitle('electric');

      expect(mockBuilder.limit).toHaveBeenCalledWith(20);
      expect(result).toHaveLength(5);
    });
  });

  describe('database queries', () => {
    it('joins with bill_categories table to get category icon', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle('electric');

      expect(mockBuilder.innerJoin).toHaveBeenCalled();
    });

    it('uses parameterized queries to prevent SQL injection', async () => {
      const mockBuilder = createSearchMock([mockBill]);
      (db.select as Mock).mockReturnValue(mockBuilder);
      vi.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      await BillService.searchByTitle("'; DROP TABLE bills; --");

      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();
    });
  });
});

describe('BillService.getAdjustedDueDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns adjusted date when bill has override strategy', async () => {
    const saturday = new Date('2025-01-11');
    const friday = new Date('2025-01-10');
    const bill = {
      dueDate: saturday,
      weekendAdjustment: 'previous_business_day' as const,
    };

    (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('unchanged');
    (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('previous_business_day');
    (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(friday);

    const result = await BillService.getAdjustedDueDate(bill);

    expect(SettingsService.getWeekendAdjustment).toHaveBeenCalled();
    expect(DateAdjustmentService.getEffectiveStrategy).toHaveBeenCalledWith(
      'previous_business_day',
      'unchanged',
    );
    expect(DateAdjustmentService.adjustPaymentDate).toHaveBeenCalledWith(
      saturday,
      'previous_business_day',
    );
    expect(result).toEqual(friday);
  });

  it('uses global strategy when bill override is null', async () => {
    const saturday = new Date('2025-01-11');
    const monday = new Date('2025-01-13');
    const bill = {
      dueDate: saturday,
      weekendAdjustment: null,
    };

    (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('next_business_day');
    (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('next_business_day');
    (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(monday);

    const result = await BillService.getAdjustedDueDate(bill);

    expect(SettingsService.getWeekendAdjustment).toHaveBeenCalled();
    expect(DateAdjustmentService.getEffectiveStrategy).toHaveBeenCalledWith(
      null,
      'next_business_day',
    );
    expect(DateAdjustmentService.adjustPaymentDate).toHaveBeenCalledWith(
      saturday,
      'next_business_day',
    );
    expect(result).toEqual(monday);
  });

  it('returns unchanged date when strategy is unchanged', async () => {
    const saturday = new Date('2025-01-11');
    const bill = {
      dueDate: saturday,
      weekendAdjustment: 'unchanged' as const,
    };

    (SettingsService.getWeekendAdjustment as Mock).mockResolvedValue('next_business_day');
    (DateAdjustmentService.getEffectiveStrategy as Mock).mockReturnValue('unchanged');
    (DateAdjustmentService.adjustPaymentDate as Mock).mockReturnValue(saturday);

    const result = await BillService.getAdjustedDueDate(bill);

    expect(DateAdjustmentService.getEffectiveStrategy).toHaveBeenCalledWith(
      'unchanged',
      'next_business_day',
    );
    expect(DateAdjustmentService.adjustPaymentDate).toHaveBeenCalledWith(saturday, 'unchanged');
    expect(result).toEqual(saturday);
  });
});
