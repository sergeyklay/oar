import { ForecastService } from './ForecastService';
import { BillService } from './BillService';
import { EstimationService } from './EstimationService';
import { db } from '@/db';
import type { BillWithTags } from '@/db/schema';
import type { ForecastBill } from './ForecastService';

jest.mock('@/db');
jest.mock('./BillService');
jest.mock('./EstimationService');

describe('ForecastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockBill = (overrides: Partial<BillWithTags> = {}): BillWithTags => ({
    id: 'bill-1',
    title: 'Test Bill',
    amount: 10000,
    amountDue: 10000,
    dueDate: new Date('2025-03-15'),
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
    ...overrides,
  });

  const createDbMock = (billsToReturn: BillWithTags[]) => {
    const joinedBills = billsToReturn.map((bill) => ({
      bill: {
        id: bill.id,
        title: bill.title,
        amount: bill.amount,
        amountDue: bill.amountDue,
        dueDate: bill.dueDate,
        endDate: bill.endDate,
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

    const orderByMock = jest.fn().mockResolvedValue(joinedBills);
    const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
    const innerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
    const fromMock = jest.fn().mockReturnValue({ innerJoin: innerJoinMock });
    (db.select as jest.Mock).mockReturnValue({ from: fromMock });

    return { orderByMock, whereMock, innerJoinMock, fromMock };
  };

  const createDbMockWithTagFilter = (
    billsToReturn: BillWithTags[],
    tagSlug: string,
    tagId = 'tag-1'
  ) => {
    const joinedBills = billsToReturn.map((bill) => ({
      bill: {
        id: bill.id,
        title: bill.title,
        amount: bill.amount,
        amountDue: bill.amountDue,
        dueDate: bill.dueDate,
        endDate: bill.endDate,
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

    const billIds = billsToReturn.map((bill) => bill.id);

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: tagId }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(billIds.map((id) => ({ billId: id }))),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(joinedBills),
            }),
          }),
        }),
      });

    return { tagId };
  };

  describe('getBillsForMonth', () => {
    it('returns forecast bills for a specific month', async () => {
      const mockBills: BillWithTags[] = [createMockBill()];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-1');
      expect(result[0].displayAmount).toBe(10000);
    });

    it('filters bills by tag when tag is provided', async () => {
      const mockBills: BillWithTags[] = [createMockBill({ id: 'bill-tagged' })];
      createDbMockWithTagFilter(mockBills, 'utilities', 'tag-utilities');
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-tagged', []]])
      );

      await ForecastService.getBillsForMonth('2025-03', 'utilities');

      expect(db.select).toHaveBeenCalledTimes(3);
    });

    it('excludes archived bills', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({ id: 'bill-1', isArchived: false }),
        createMockBill({ id: 'bill-2', isArchived: true }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([
          ['bill-1', []],
          ['bill-2', []],
        ])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-1');
    });

    it('excludes bills with status paid', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({ id: 'bill-1', status: 'pending' as const }),
        createMockBill({ id: 'bill-2', status: 'paid' as const }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([
          ['bill-1', []],
          ['bill-2', []],
        ])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bill-1');
    });

    it('excludes bills that have ended before target month', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          id: 'bill-1',
          endDate: new Date('2025-02-28'),
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(0);
    });

    it('projects monthly bill correctly', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-02-15'),
          frequency: 'monthly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].dueDate.getMonth()).toBe(2);
      expect(result[0].dueDate.getDate()).toBe(15);
    });

    it('projects yearly bill correctly', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2024-06-15'),
          frequency: 'yearly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-06');

      expect(result).toHaveLength(1);
      expect(result[0].dueDate.getFullYear()).toBe(2025);
      expect(result[0].dueDate.getMonth()).toBe(5);
      expect(result[0].dueDate.getDate()).toBe(15);
    });

    it('projects quarterly bill correctly', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2024-12-15'),
          frequency: 'quarterly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].dueDate.getFullYear()).toBe(2025);
      expect(result[0].dueDate.getMonth()).toBe(2);
      expect(result[0].dueDate.getDate()).toBe(15);
    });

    it('projects biweekly bill correctly', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-02-28'),
          frequency: 'biweekly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result.length).toBeGreaterThan(0);
    });

    it('projects weekly bill correctly', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-02-28'),
          frequency: 'weekly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result.length).toBeGreaterThan(0);
    });

    it('handles one-time bills correctly', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-03-20'),
          frequency: 'once' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].dueDate.getTime()).toBe(mockBills[0].dueDate.getTime());
    });

    it('excludes one-time bills not in target month', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-04-20'),
          frequency: 'once' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(0);
    });

    it('handles variable bills with estimation', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          id: 'bill-1',
          isVariable: true,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );
      (EstimationService.estimateAmount as jest.Mock).mockResolvedValue(15000);

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].displayAmount).toBe(15000);
      expect(result[0].isEstimated).toBe(true);
      expect(EstimationService.estimateAmount).toHaveBeenCalledWith(
        'bill-1',
        expect.any(Date)
      );
    });

    it('sorts bills by due date', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          id: 'bill-1',
          dueDate: new Date('2025-03-20'),
        }),
        createMockBill({
          id: 'bill-2',
          dueDate: new Date('2025-03-10'),
        }),
        createMockBill({
          id: 'bill-3',
          dueDate: new Date('2025-03-15'),
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([
          ['bill-1', []],
          ['bill-2', []],
          ['bill-3', []],
        ])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('bill-2');
      expect(result[1].id).toBe('bill-3');
      expect(result[2].id).toBe('bill-1');
    });

    it('handles empty result set', async () => {
      createDbMock([]);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(new Map());

      const result = await ForecastService.getBillsForMonth('2025-06');

      expect(result).toHaveLength(0);
    });

    describe('twice-monthly edge cases for month-end dates', () => {
      it.each([
        { dueDate: '2025-01-29', targetMonth: '2025-01', expectedDate: 29 },
        { dueDate: '2025-01-30', targetMonth: '2025-01', expectedDate: 30 },
        { dueDate: '2025-01-31', targetMonth: '2025-01', expectedDate: 31 },
      ])(
        'projects twice-monthly bill with dueDate on $dueDate in same month as dueDate',
        async ({ dueDate, targetMonth, expectedDate }) => {
          const mockBills: BillWithTags[] = [
            createMockBill({
              dueDate: new Date(dueDate),
              frequency: 'twicemonthly' as const,
            }),
          ];
          createDbMock(mockBills);
          (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
            new Map([['bill-1', []]])
          );

          const result = await ForecastService.getBillsForMonth(targetMonth);

          expect(result.length).toBeGreaterThan(0);
          expect(result[0].dueDate.getDate()).toBe(expectedDate);
        }
      );

      it.each([
        { dueDate: '2025-01-29', expectedDate: 15 },
        { dueDate: '2025-01-30', expectedDate: 16 },
        { dueDate: '2025-01-31', expectedDate: 17 },
      ])(
        'projects twice-monthly bill with dueDate on $dueDate in February (non-leap year), silently dropping invalid dates',
        async ({ dueDate, expectedDate }) => {
          const mockBills: BillWithTags[] = [
            createMockBill({
              dueDate: new Date(dueDate),
              frequency: 'twicemonthly' as const,
            }),
          ];
          createDbMock(mockBills);
          (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
            new Map([['bill-1', []]])
          );

          const result = await ForecastService.getBillsForMonth('2025-02');

          expect(result.length).toBe(1);
          expect(result[0].dueDate.getDate()).toBe(expectedDate);
        }
      );

      it.each([
        { dueDate: '2025-01-31', targetMonth: '2025-04', expectedDate: 17 },
        { dueDate: '2025-01-31', targetMonth: '2025-06', expectedDate: 17 },
      ])(
        'projects twice-monthly bill with dueDate on $dueDate in months with 30 days, silently dropping 31st',
        async ({ dueDate, targetMonth, expectedDate }) => {
          const mockBills: BillWithTags[] = [
            createMockBill({
              dueDate: new Date(dueDate),
              frequency: 'twicemonthly' as const,
            }),
          ];
          createDbMock(mockBills);
          (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
            new Map([['bill-1', []]])
          );

          const result = await ForecastService.getBillsForMonth(targetMonth);

          expect(result.length).toBe(1);
          expect(result[0].dueDate.getDate()).toBe(expectedDate);
        }
      );
    });
  });

  describe('calculateSummary', () => {
    it('calculates totals correctly', () => {
      const bills: ForecastBill[] = [
        {
          ...createMockBill({ id: 'bill-1', amount: 10000 }),
          displayAmount: 10000,
          isEstimated: false,
          amortizationAmount: null,
        },
        {
          ...createMockBill({ id: 'bill-2', amount: 20000 }),
          displayAmount: 20000,
          isEstimated: false,
          amortizationAmount: 5000,
        },
        {
          ...createMockBill({ id: 'bill-3', amount: 15000 }),
          displayAmount: 15000,
          isEstimated: false,
          amortizationAmount: null,
        },
      ];

      const result = ForecastService.calculateSummary(bills);

      expect(result.totalDue).toBe(45000);
      expect(result.totalToSave).toBe(5000);
      expect(result.grandTotal).toBe(50000);
    });

    it('handles bills with only display amounts', () => {
      const bills: ForecastBill[] = [
        {
          ...createMockBill({ id: 'bill-1', amount: 10000 }),
          displayAmount: 10000,
          isEstimated: false,
          amortizationAmount: null,
        },
        {
          ...createMockBill({ id: 'bill-2', amount: 20000 }),
          displayAmount: 20000,
          isEstimated: false,
          amortizationAmount: null,
        },
      ];

      const result = ForecastService.calculateSummary(bills);

      expect(result.totalDue).toBe(30000);
      expect(result.totalToSave).toBe(0);
      expect(result.grandTotal).toBe(30000);
    });

    it('handles bills with only amortization amounts', () => {
      const bills: ForecastBill[] = [
        {
          ...createMockBill({ id: 'bill-1', amount: 10000 }),
          displayAmount: 0,
          isEstimated: false,
          amortizationAmount: 5000,
        },
        {
          ...createMockBill({ id: 'bill-2', amount: 20000 }),
          displayAmount: 0,
          isEstimated: false,
          amortizationAmount: 3000,
        },
      ];

      const result = ForecastService.calculateSummary(bills);

      expect(result.totalDue).toBe(0);
      expect(result.totalToSave).toBe(8000);
      expect(result.grandTotal).toBe(8000);
    });

    it('handles empty array', () => {
      const result = ForecastService.calculateSummary([]);

      expect(result.totalDue).toBe(0);
      expect(result.totalToSave).toBe(0);
      expect(result.grandTotal).toBe(0);
    });

    it('handles bills with both display and amortization amounts', () => {
      const bills: ForecastBill[] = [
        {
          ...createMockBill({ id: 'bill-1', amount: 10000 }),
          displayAmount: 10000,
          isEstimated: false,
          amortizationAmount: 2000,
        },
        {
          ...createMockBill({ id: 'bill-2', amount: 20000 }),
          displayAmount: 20000,
          isEstimated: false,
          amortizationAmount: 3000,
        },
      ];

      const result = ForecastService.calculateSummary(bills);

      expect(result.totalDue).toBe(30000);
      expect(result.totalToSave).toBe(5000);
      expect(result.grandTotal).toBe(35000);
    });
  });

  describe('getBillsForMonthRange', () => {
    const createMockForecastBill = (
      id: string,
      displayAmount: number,
      amortizationAmount: number | null = null
    ): ForecastBill => ({
      id,
      title: `Bill ${id}`,
      amount: displayAmount,
      amountDue: displayAmount,
      dueDate: new Date('2025-03-15'),
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
      displayAmount,
      isEstimated: false,
      amortizationAmount,
    });

    it('returns monthly totals for single month', async () => {
      const mockBills = [
        createMockForecastBill('bill-1', 10000, null),
        createMockForecastBill('bill-2', 20000, 5000),
      ];
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue(mockBills);

      const result = await ForecastService.getBillsForMonthRange('2025-03', 1);

      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2025-03');
      expect(result[0].monthLabel).toBe('Mar');
      expect(result[0].totalDue).toBe(30000);
      expect(result[0].totalToSave).toBe(5000);
      expect(result[0].grandTotal).toBe(35000);
      expect(getBillsForMonthSpy).toHaveBeenCalledTimes(1);
      expect(getBillsForMonthSpy).toHaveBeenCalledWith('2025-03', undefined);

      getBillsForMonthSpy.mockRestore();
    });

    it('returns monthly totals for 12 months', async () => {
      const mockBills = [createMockForecastBill('bill-1', 10000, null)];
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue(mockBills);

      const result = await ForecastService.getBillsForMonthRange('2025-03', 12);

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe('2025-03');
      expect(result[0].monthLabel).toBe('Mar');
      expect(result[11].month).toBe('2026-02');
      expect(result[11].monthLabel).toBe('Feb');
      expect(getBillsForMonthSpy).toHaveBeenCalledTimes(12);

      getBillsForMonthSpy.mockRestore();
    });

    it('returns monthly totals for 24 months', async () => {
      const mockBills = [createMockForecastBill('bill-1', 10000, null)];
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue(mockBills);

      const result = await ForecastService.getBillsForMonthRange('2025-03', 24);

      expect(result).toHaveLength(24);
      expect(result[0].month).toBe('2025-03');
      expect(result[23].month).toBe('2027-02');
      expect(getBillsForMonthSpy).toHaveBeenCalledTimes(24);

      getBillsForMonthSpy.mockRestore();
    });

    it('filters bills by tag when tag is provided', async () => {
      const mockBills = [createMockForecastBill('bill-1', 10000, null)];
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue(mockBills);

      await ForecastService.getBillsForMonthRange('2025-03', 1, 'utilities');

      expect(getBillsForMonthSpy).toHaveBeenCalledWith('2025-03', 'utilities');

      getBillsForMonthSpy.mockRestore();
    });

    it('handles year boundary correctly', async () => {
      const mockBills = [createMockForecastBill('bill-1', 10000, null)];
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue(mockBills);

      const result = await ForecastService.getBillsForMonthRange('2025-12', 3);

      expect(result).toHaveLength(3);
      expect(result[0].month).toBe('2025-12');
      expect(result[0].monthLabel).toBe('Dec');
      expect(result[1].month).toBe('2026-01');
      expect(result[1].monthLabel).toBe('Jan');
      expect(result[2].month).toBe('2026-02');
      expect(result[2].monthLabel).toBe('Feb');

      getBillsForMonthSpy.mockRestore();
    });

    it('formats month labels correctly', async () => {
      const mockBills = [createMockForecastBill('bill-1', 10000, null)];
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue(mockBills);

      const result = await ForecastService.getBillsForMonthRange('2025-01', 12);

      const expectedLabels = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      result.forEach((month, index) => {
        expect(month.monthLabel).toBe(expectedLabels[index]);
      });

      getBillsForMonthSpy.mockRestore();
    });

    it('handles empty bills array for a month', async () => {
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValue([]);

      const result = await ForecastService.getBillsForMonthRange('2025-03', 1);

      expect(result).toHaveLength(1);
      expect(result[0].totalDue).toBe(0);
      expect(result[0].totalToSave).toBe(0);
      expect(result[0].grandTotal).toBe(0);

      getBillsForMonthSpy.mockRestore();
    });

    it('calculates totals correctly for each month', async () => {
      const getBillsForMonthSpy = jest
        .spyOn(ForecastService, 'getBillsForMonth')
        .mockResolvedValueOnce([createMockForecastBill('bill-1', 10000, 2000)])
        .mockResolvedValueOnce([createMockForecastBill('bill-2', 20000, null)]);

      const result = await ForecastService.getBillsForMonthRange('2025-03', 2);

      expect(result).toHaveLength(2);
      expect(result[0].totalDue).toBe(10000);
      expect(result[0].totalToSave).toBe(2000);
      expect(result[0].grandTotal).toBe(12000);
      expect(result[1].totalDue).toBe(20000);
      expect(result[1].totalToSave).toBe(0);
      expect(result[1].grandTotal).toBe(20000);

      getBillsForMonthSpy.mockRestore();
    });
  });
});
