import { BillService } from './BillService';
import { db, bills, resetDbMocks } from '@/db';
import type { BillWithTags } from '@/db/schema';

jest.mock('@/db');

describe('BillService.getFiltered', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  const mockBills: BillWithTags[] = [
    {
      id: 'bill-1',
      title: 'December Bill',
      amount: 10000,
      amountDue: 10000,
      dueDate: new Date('2025-12-10'),
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
    },
    {
      id: 'bill-2',
      title: 'January Bill',
      amount: 20000,
      amountDue: 20000,
      dueDate: new Date('2026-01-15'),
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
    },
    {
      id: 'bill-3',
      title: 'February Bill',
      amount: 30000,
      amountDue: 30000,
      dueDate: new Date('2026-02-20'),
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
    },
  ];

  const createSelectMock = (activeBills: BillWithTags[], paidBills: BillWithTags[] = []) => {
    // Convert BillWithTags[] to the format returned by the JOIN query
    const mapToJoined = (bills: BillWithTags[]) => bills.map((bill) => ({
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
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn()
        .mockResolvedValueOnce(activeJoined)
        .mockResolvedValueOnce(paidJoined),
    };
    (db.select as jest.Mock).mockReturnValue(mockBuilder);
    return mockBuilder;
  };

  it('returns all bills from multiple months when no filters provided', async () => {
    const mockBuilder = createSelectMock(mockBills);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

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
      },
    ];

    const paidBills: BillWithTags[] = [
      {
        ...mockBills[1],
        id: 'paid-1',
        status: 'paid' as const,
        dueDate: new Date('2025-12-10'),
      },
    ];

    createSelectMock(activeBills, paidBills);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

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
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

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
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ date: '2025-12-10' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('date filter takes precedence over month filter when both provided', async () => {
    const dateBills = [mockBills[0]];
    const mockBuilder = createSelectMock(dateBills);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ date: '2025-12-10', month: '2026-01' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bill-1');
    expect(db.select).toHaveBeenCalled();
    expect(mockBuilder.where).toHaveBeenCalled();
  });

  it('returns empty array when no bills match month filter', async () => {
    createSelectMock([]);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-03' });

    expect(result).toHaveLength(0);
    expect(db.select).toHaveBeenCalled();
  });

  it('returns bills sorted by dueDate ascending', async () => {
    const unsortedBills = [mockBills[2], mockBills[0], mockBills[1]];
    const mockBuilder = createSelectMock(unsortedBills);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

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
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

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
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-12' });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
  });

  it('includes overdue bills when filtering by month', async () => {
    const overdueBill: BillWithTags[] = [
      {
        ...mockBills[0],
        status: 'overdue' as const,
        tags: [],
      },
    ];
    createSelectMock(overdueBill);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ month: '2025-12' });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('overdue');
  });

  it('includes paid bills when filtering by date', async () => {
    const paidBill: BillWithTags[] = [
      {
        ...mockBills[0],
        id: 'bill-paid',
        status: 'paid' as const,
        tags: [],
      },
    ];
    createSelectMock([], paidBill);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ date: '2025-12-10' });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('paid');
    expect(db.select).toHaveBeenCalled();
  });

  describe('overdue bills inclusion for current month', () => {
    it('includes overdue bills from previous months when filtering by current month', async () => {
      const currentDate = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const overdueBillFromPreviousMonth: BillWithTags = {
        id: 'bill-overdue-old',
        title: 'Old Overdue Bill',
        amount: 50000,
        amountDue: 50000,
        dueDate: new Date('2025-11-20'),
        frequency: 'monthly' as const,
        isAutoPay: false,
        isVariable: false,
        status: 'overdue' as const,
        isArchived: false,
        notes: null,
        categoryId: 'category-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [],
        categoryIcon: 'house',
      };

      const billInCurrentMonth: BillWithTags = {
        id: 'bill-current-month',
        title: 'Current Month Bill',
        amount: 30000,
        amountDue: 30000,
        dueDate: new Date('2026-01-20'),
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
      };

      const expectedBills = [overdueBillFromPreviousMonth, billInCurrentMonth];
      const mockBuilder = createSelectMock(expectedBills);
      jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.getFiltered({ month: '2026-01' });

      expect(result).toHaveLength(2);
      expect(result.some((bill) => bill.id === 'bill-overdue-old')).toBe(true);
      expect(result.some((bill) => bill.id === 'bill-current-month')).toBe(true);
      expect(result.every((bill) => bill.status !== 'paid')).toBe(true);
      expect(db.select).toHaveBeenCalled();
      expect(mockBuilder.where).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('includes overdue bills from multiple months ago when filtering by current month', async () => {
      const currentDate = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const overdueBillFrom3MonthsAgo: BillWithTags = {
        id: 'bill-overdue-3months',
        title: '3 Months Overdue',
        amount: 40000,
        amountDue: 40000,
        dueDate: new Date('2025-10-15'),
        frequency: 'monthly' as const,
        isAutoPay: false,
        isVariable: false,
        status: 'overdue' as const,
        isArchived: false,
        notes: null,
        categoryId: 'category-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [],
        categoryIcon: 'house',
      };

      const overdueBillFrom1YearAgo: BillWithTags = {
        id: 'bill-overdue-1year',
        title: '1 Year Overdue',
        amount: 60000,
        amountDue: 60000,
        dueDate: new Date('2025-01-10'),
        frequency: 'monthly' as const,
        isAutoPay: false,
        isVariable: false,
        status: 'overdue' as const,
        isArchived: false,
        notes: null,
        categoryId: 'category-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [],
        categoryIcon: 'house',
      };

      const billInCurrentMonth: BillWithTags = {
        id: 'bill-current',
        title: 'Current Month Bill',
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2026-01-25'),
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
      };

      const expectedBills = [
        overdueBillFrom1YearAgo,
        overdueBillFrom3MonthsAgo,
        billInCurrentMonth,
      ];
      createSelectMock(expectedBills);
      jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.getFiltered({ month: '2026-01' });

      expect(result).toHaveLength(3);
      expect(result.some((bill) => bill.id === 'bill-overdue-3months')).toBe(true);
      expect(result.some((bill) => bill.id === 'bill-overdue-1year')).toBe(true);
      expect(result.some((bill) => bill.id === 'bill-current')).toBe(true);
      expect(result.every((bill) => bill.status !== 'paid')).toBe(true);
      expect(db.select).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('excludes paid overdue bills when filtering by current month', async () => {
      const currentDate = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      // paidOverdueBill is intentionally defined to document test intent:
      // It represents a bill that would be filtered out by the query because it's paid
      const _paidOverdueBill: BillWithTags = {
        id: 'bill-paid-overdue',
        title: 'Paid Overdue Bill',
        amount: 30000,
        amountDue: 30000,
        dueDate: new Date('2025-11-20'),
        frequency: 'monthly' as const,
        isAutoPay: false,
        isVariable: false,
        status: 'paid' as const,
        isArchived: false,
        notes: null,
        categoryId: 'category-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [],
        categoryIcon: 'house',
      };
      void _paidOverdueBill;

      const unpaidOverdueBill: BillWithTags = {
        id: 'bill-unpaid-overdue',
        title: 'Unpaid Overdue Bill',
        amount: 40000,
        amountDue: 40000,
        dueDate: new Date('2025-12-10'),
        frequency: 'monthly' as const,
        isAutoPay: false,
        isVariable: false,
        status: 'overdue' as const,
        isArchived: false,
        notes: null,
        categoryId: 'category-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [],
        categoryIcon: 'house',
      };

      const expectedBills = [unpaidOverdueBill];
      createSelectMock(expectedBills);
      jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.getFiltered({ month: '2026-01' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-unpaid-overdue');
      expect(result[0].status).toBe('overdue');
      expect(result.every((bill) => bill.status !== 'paid')).toBe(true);
      expect(db.select).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('includes both overdue bills and bills due in current month', async () => {
      const currentDate = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const overdueBill: BillWithTags = {
        id: 'bill-overdue',
        title: 'Overdue Bill',
        amount: 50000,
        amountDue: 50000,
        dueDate: new Date('2025-12-05'),
        frequency: 'monthly' as const,
        isAutoPay: false,
        isVariable: false,
        status: 'overdue' as const,
        isArchived: false,
        notes: null,
        categoryId: 'category-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: [],
        categoryIcon: 'house',
      };

      const pendingBillInMonth: BillWithTags = {
        id: 'bill-pending',
        title: 'Pending Bill',
        amount: 30000,
        amountDue: 30000,
        dueDate: new Date('2026-01-20'),
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
      };

      const expectedBills = [overdueBill, pendingBillInMonth];
      createSelectMock(expectedBills);
      jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.getFiltered({ month: '2026-01' });

      expect(result).toHaveLength(2);
      expect(result.some((bill) => bill.id === 'bill-overdue' && bill.status === 'overdue')).toBe(
        true
      );
      expect(
        result.some((bill) => bill.id === 'bill-pending' && bill.status === 'pending')
      ).toBe(true);
      expect(db.select).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('does not include overdue bills when filtering by past month', async () => {
      const currentDate = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const billInPastMonth: BillWithTags = {
        id: 'bill-past-month',
        title: 'Past Month Bill',
        amount: 20000,
        amountDue: 20000,
        dueDate: new Date('2025-11-15'),
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
      };

      const expectedBills = [billInPastMonth];
      createSelectMock(expectedBills);
      jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.getFiltered({ month: '2025-11' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-past-month');
      expect(result[0].dueDate.getMonth()).toBe(10);
      expect(db.select).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('does not include overdue bills when filtering by future month', async () => {
      const currentDate = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const billInFutureMonth: BillWithTags = {
        id: 'bill-future-month',
        title: 'Future Month Bill',
        amount: 25000,
        amountDue: 25000,
        dueDate: new Date('2026-02-15'),
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
      };

      const expectedBills = [billInFutureMonth];
      createSelectMock(expectedBills);
      jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

      const result = await BillService.getFiltered({ month: '2026-02' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-future-month');
      expect(result[0].dueDate.getMonth()).toBe(1);
      expect(db.select).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});

