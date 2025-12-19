import { TransactionService } from './TransactionService';
import { db, transactions, bills } from '@/db';
import { PaymentWithBill } from '@/lib/types';

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  transactions: {
    id: 'transactions.id',
    billId: 'transactions.bill_id',
    amount: 'transactions.amount',
    paidAt: 'transactions.paid_at',
    notes: 'transactions.notes',
  },
  bills: {
    id: 'bills.id',
    title: 'bills.title',
  },
}));

describe('TransactionService', () => {
  describe('getRecentPayments', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockPayments: PaymentWithBill[] = [
      {
        id: 'tx-1',
        billTitle: 'Rent',
        amount: 5000,
        paidAt: new Date(),
        notes: 'Monthly rent',
      },
    ];

    const setupDbMock = (returnValue: PaymentWithBill[]) => {
      const orderByMock = jest.fn().mockResolvedValue(returnValue);
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const innerJoinMock = jest.fn().mockReturnValue({ where: whereMock });
      const fromMock = jest.fn().mockReturnValue({ innerJoin: innerJoinMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      return { orderByMock, whereMock, innerJoinMock, fromMock };
    };

    it('fetches payments within date range', async () => {
      const { fromMock, innerJoinMock, whereMock, orderByMock } = setupDbMock(mockPayments);

      const result = await TransactionService.getRecentPayments(7);

      expect(result).toEqual(mockPayments);
      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(transactions);
      expect(innerJoinMock).toHaveBeenCalledWith(bills, expect.anything());
      expect(whereMock).toHaveBeenCalled();
      expect(orderByMock).toHaveBeenCalled();
    });

    it('returns empty array when no payments found', async () => {
      setupDbMock([]);

      const result = await TransactionService.getRecentPayments(7);

      expect(result).toEqual([]);
    });

    it('handles days=0 for today only', async () => {
      const { whereMock } = setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(0);

      expect(whereMock).toHaveBeenCalled();
    });

    it('handles days=1 for today or yesterday', async () => {
      const { whereMock } = setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(1);

      expect(whereMock).toHaveBeenCalled();
    });

    it('orders results by paidAt descending', async () => {
      const { orderByMock } = setupDbMock(mockPayments);

      await TransactionService.getRecentPayments(7);

      expect(orderByMock).toHaveBeenCalled();
    });
  });
});
