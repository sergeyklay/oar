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
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      tags: [],
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
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      tags: [],
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
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      tags: [],
    },
  ];

  const createSelectMock = (returnValue: BillWithTags[]) => {
    const mockBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(returnValue),
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
    createSelectMock(paidBill);
    jest.spyOn(BillService, 'getTagsForBills').mockResolvedValue(new Map());

    const result = await BillService.getFiltered({ date: '2025-12-10' });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('paid');
    expect(db.select).toHaveBeenCalled();
  });
});

