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

  describe('getBillsForMonth', () => {
    it('projects bills with default forecast data for non-variable bills', async () => {
      const mockBills: BillWithTags[] = [createMockBill()];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toHaveLength(1);
      expect(result[0].displayAmount).toBe(10000);
      expect(result[0].isEstimated).toBe(false);
      expect(result[0].amortizationAmount).toBeNull();
      expect(result[0].dueDate).toEqual(new Date('2025-03-15'));
    });

    it('applies tag filter when provided', async () => {
      const mockBills: BillWithTags[] = [createMockBill()];
      createDbMock(mockBills);

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ id: 'tag-1' }]) }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ billId: 'bill-1' }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue([
                  {
                    bill: {
                      id: 'bill-1',
                      title: 'Test Bill',
                      amount: 10000,
                      amountDue: 10000,
                      dueDate: new Date('2025-03-15'),
                      endDate: null,
                      frequency: 'monthly',
                      isAutoPay: false,
                      isVariable: false,
                      status: 'pending',
                      isArchived: false,
                      notes: null,
                      categoryId: 'category-1',
                      createdAt: new Date('2025-01-01'),
                      updatedAt: new Date('2025-01-01'),
                    },
                    categoryIcon: 'house',
                  },
                ]),
              }),
            }),
          }),
        });

      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      await ForecastService.getBillsForMonth('2025-03', 'utilities');

      expect(db.select).toHaveBeenCalled();
    });

    it('enriches variable bills with estimated amounts', async () => {
      const mockBills: BillWithTags[] = [createMockBill({ isVariable: true })];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );
      (EstimationService.estimateAmount as jest.Mock).mockResolvedValue(15000);

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].displayAmount).toBe(15000);
      expect(result[0].isEstimated).toBe(true);
      expect(EstimationService.estimateAmount).toHaveBeenCalledWith(
        'bill-1',
        expect.any(Date)
      );
    });

    it('calculates amortization for quarterly bills', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({ frequency: 'quarterly' as const, amount: 30000 }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBe(10000);
    });

    it('calculates amortization for yearly bills', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({ frequency: 'yearly' as const, amount: 120000 }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBe(10000);
    });

    it('calculates amortization for bimonthly bills', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({ frequency: 'bimonthly' as const, amount: 20000 }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBe(10000);
    });

    it('rounds amortization to nearest integer', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({ frequency: 'yearly' as const, amount: 100000 }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBe(8333);
    });

    it('does not calculate amortization for monthly bills', async () => {
      const mockBills: BillWithTags[] = [createMockBill({ frequency: 'monthly' as const })];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBeNull();
    });

    it('does not calculate amortization for weekly bills', async () => {
      const mockBills: BillWithTags[] = [createMockBill({ frequency: 'weekly' as const })];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBeNull();
    });

    it('does not calculate amortization for one-time bills', async () => {
      const mockBills: BillWithTags[] = [createMockBill({ frequency: 'once' as const })];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].amortizationAmount).toBeNull();
    });

    it('handles bills with both variable and amortization', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          isVariable: true,
          frequency: 'yearly' as const,
          amount: 120000,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );
      (EstimationService.estimateAmount as jest.Mock).mockResolvedValue(125000);

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result[0].displayAmount).toBe(125000);
      expect(result[0].isEstimated).toBe(true);
      expect(result[0].amortizationAmount).toBe(10000);
    });

    it('returns empty array when no bills found', async () => {
      createDbMock([]);

      const result = await ForecastService.getBillsForMonth('2025-03');

      expect(result).toEqual([]);
    });

    it('projects occurrences for future months', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-01-15'),
          frequency: 'monthly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-06');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].dueDate.getMonth()).toBe(5);
      expect(result[0].dueDate.getFullYear()).toBe(2025);
    });

    it('filters out bills with no occurrence in target month', async () => {
      const mockBills: BillWithTags[] = [
        createMockBill({
          dueDate: new Date('2025-01-15'),
          frequency: 'yearly' as const,
        }),
      ];
      createDbMock(mockBills);
      (BillService.getTagsForBills as jest.Mock).mockResolvedValue(
        new Map([['bill-1', []]])
      );

      const result = await ForecastService.getBillsForMonth('2025-06');

      expect(result.length).toBe(0);
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

    it('handles bills with no amortization', () => {
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

    it('handles bills with only amortization', () => {
      const bills: ForecastBill[] = [
        {
          ...createMockBill({ id: 'bill-1', amount: 0 }),
          displayAmount: 0,
          isEstimated: false,
          amortizationAmount: 10000,
        },
        {
          ...createMockBill({ id: 'bill-2', amount: 0 }),
          displayAmount: 0,
          isEstimated: false,
          amortizationAmount: 20000,
        },
      ];

      const result = ForecastService.calculateSummary(bills);

      expect(result.totalDue).toBe(0);
      expect(result.totalToSave).toBe(30000);
      expect(result.grandTotal).toBe(30000);
    });

    it('handles empty array', () => {
      const result = ForecastService.calculateSummary([]);

      expect(result.totalDue).toBe(0);
      expect(result.totalToSave).toBe(0);
      expect(result.grandTotal).toBe(0);
    });

    it('handles estimated amounts in total due', () => {
      const bills: ForecastBill[] = [
        {
          ...createMockBill({ id: 'bill-1', amount: 10000 }),
          displayAmount: 15000,
          isEstimated: true,
          amortizationAmount: null,
        },
      ];

      const result = ForecastService.calculateSummary(bills);

      expect(result.totalDue).toBe(15000);
      expect(result.totalToSave).toBe(0);
      expect(result.grandTotal).toBe(15000);
    });
  });
});

