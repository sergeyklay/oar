import {
  logPayment,
  deleteTransaction,
  updateTransaction,
  getRecentPaymentsStats,
} from './transactions';
import { db, bills, transactions, resetDbMocks } from '@/db';
import { revalidatePath } from 'next/cache';

jest.mock('@/db');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('@/lib/services/PaymentService', () => ({
  PaymentService: {
    processPayment: jest.fn(),
    doesPaymentAffectCurrentCycle: jest.fn().mockReturnValue(true),
    recalculateBillFromPayments: jest.fn().mockReturnValue({
      amountDue: 10000,
      status: 'pending',
      nextDueDate: null,
    }),
  },
}));
jest.mock('@/lib/services/SettingsService', () => ({
  SettingsService: {
    getPaidRecentlyRange: jest.fn(),
  },
}));
jest.mock('@/lib/services/TransactionService', () => ({
  TransactionService: {
    getRecentPayments: jest.fn(),
  },
}));

import { PaymentService } from '@/lib/services/PaymentService';
import { SettingsService } from '@/lib/services/SettingsService';
import { TransactionService } from '@/lib/services/TransactionService';

describe('logPayment', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  const mockBill = {
    id: 'bill-1',
    amount: 20000,
    amountDue: 20000,
    dueDate: new Date('2025-12-15'),
    frequency: 'monthly' as const,
  };

  const setupMocks = (bill = mockBill, paymentResult: {
    nextDueDate: Date | null;
    newAmountDue: number;
    newStatus: 'pending' | 'paid' | 'overdue';
    isHistorical: boolean;
  } = {
    nextDueDate: new Date('2026-01-15'),
    newAmountDue: 20000,
    newStatus: 'pending',
    isHistorical: false,
  }) => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([bill]),
      }),
    });

    (PaymentService.processPayment as jest.Mock).mockReturnValue(paymentResult);

    const insertMock = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({ id: 'tx-1' }),
        }),
      }),
    });

    const updateMock = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          run: jest.fn(),
        }),
      }),
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      return callback({ insert: insertMock, update: updateMock });
    });

    return { insertMock, updateMock };
  };

  it('calls db.transaction for atomicity', async () => {
    setupMocks();

    await logPayment({
      billId: 'bill-1',
      amount: 10000, // 100.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(db.transaction).toHaveBeenCalled();
  });

  it('inserts transaction AND updates bill within transaction', async () => {
    const { insertMock, updateMock } = setupMocks();

    const result = await logPayment({
      billId: 'bill-1',
      amount: 5000, // 50.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(result.success).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(transactions);
    expect(updateMock).toHaveBeenCalledWith(bills);
  });

  it('uses provided integer amount directly in transaction insert', async () => {
    let capturedAmount: number | undefined;

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });

    (PaymentService.processPayment as jest.Mock).mockReturnValue({
      nextDueDate: new Date('2026-01-15'),
      newAmountDue: 20000,
      newStatus: 'pending',
      isHistorical: false,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn((data) => {
          capturedAmount = data.amount;
          return {
            returning: jest.fn().mockReturnValue({
              get: jest.fn().mockReturnValue({ id: 'tx-1' }),
            }),
          };
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ run: jest.fn() }),
        }),
      });
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: 7550, // Already in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(capturedAmount).toBe(7550);
  });

  it('calls PaymentService.processPayment with correct arguments', async () => {
    setupMocks();

    const paidAt = new Date('2025-12-15');
    await logPayment({
      billId: 'bill-1',
      amount: 10000, // 100.00 in minor units
      paidAt,
      updateDueDate: true,
    });

    expect(PaymentService.processPayment).toHaveBeenCalledWith(
      mockBill,
      10000,
      paidAt,
      true
    );
  });

  it('passes updateDueDate to PaymentService', async () => {
    setupMocks();

    await logPayment({
      billId: 'bill-1',
      amount: 10000,
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(PaymentService.processPayment).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.any(Date),
      true
    );
  });

  it('passes updateDueDate=false to PaymentService for partial payments', async () => {
    setupMocks(mockBill, {
      nextDueDate: null,
      newAmountDue: 15000,
      newStatus: 'pending',
      isHistorical: false,
    });

    const paidAt = new Date('2025-12-15');
    await logPayment({
      billId: 'bill-1',
      amount: 5000, // 50.00 in minor units
      paidAt,
      updateDueDate: false,
    });

    expect(PaymentService.processPayment).toHaveBeenCalledWith(
      mockBill,
      5000,
      paidAt,
      false
    );
  });

  it('updates bill with amountDue from PaymentService result', async () => {
    let capturedAmountDue: number | undefined;

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });

    (PaymentService.processPayment as jest.Mock).mockReturnValue({
      nextDueDate: null,
      newAmountDue: 5000,
      newStatus: 'pending',
      isHistorical: false,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({ id: 'tx-1' }),
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn((data) => {
          capturedAmountDue = data.amountDue;
          return {
            where: jest.fn().mockReturnValue({ run: jest.fn() }),
          };
        }),
      });
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: 15000, // 150.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: false,
    });

    expect(capturedAmountDue).toBe(5000);
  });

  it('keeps original dueDate when PaymentService returns null nextDueDate', async () => {
    let capturedDueDate: Date | undefined;

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });

    (PaymentService.processPayment as jest.Mock).mockReturnValue({
      nextDueDate: null,
      newAmountDue: 5000,
      newStatus: 'pending',
      isHistorical: false,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({ id: 'tx-1' }),
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn((data) => {
          capturedDueDate = data.dueDate;
          return {
            where: jest.fn().mockReturnValue({ run: jest.fn() }),
          };
        }),
      });
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: 15000, // 150.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: false,
    });

    expect(capturedDueDate).toEqual(mockBill.dueDate);
  });

  it('updates dueDate when PaymentService returns new nextDueDate', async () => {
    let capturedDueDate: Date | undefined;
    const newDueDate = new Date('2026-01-15');

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockBill]),
      }),
    });

    (PaymentService.processPayment as jest.Mock).mockReturnValue({
      nextDueDate: newDueDate,
      newAmountDue: 20000,
      newStatus: 'pending',
      isHistorical: false,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({ id: 'tx-1' }),
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn((data) => {
          capturedDueDate = data.dueDate;
          return {
            where: jest.fn().mockReturnValue({ run: jest.fn() }),
          };
        }),
      });
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: 20000, // 200.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(capturedDueDate).toEqual(newDueDate);
  });

  it('marks one-time bill as paid with zero amountDue', async () => {
    let capturedStatus: string | undefined;
    let capturedAmountDue: number | undefined;

    const oneTimeBill = { ...mockBill, frequency: 'once' as const };

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([oneTimeBill]),
      }),
    });

    (PaymentService.processPayment as jest.Mock).mockReturnValue({
      nextDueDate: null,
      newAmountDue: 0,
      newStatus: 'paid',
      isHistorical: false,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({ id: 'tx-1' }),
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn((data) => {
          capturedStatus = data.status;
          capturedAmountDue = data.amountDue;
          return {
            where: jest.fn().mockReturnValue({ run: jest.fn() }),
          };
        }),
      });
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: 20000, // 200.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(capturedStatus).toBe('paid');
    expect(capturedAmountDue).toBe(0);
  });

  it('returns error when bill not found', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await logPayment({
      billId: 'nonexistent',
      amount: 1000, // 10.00 in minor units
      paidAt: new Date(),
      updateDueDate: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bill not found');
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('validates amount is positive integer', async () => {
    const result = await logPayment({
      billId: 'bill-1',
      amount: 0,
      paidAt: new Date(),
      updateDueDate: true,
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.amount).toBeDefined();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('validates amount is an integer', async () => {
    const result = await logPayment({
      billId: 'bill-1',
      amount: 10.5, // Not an integer
      paidAt: new Date(),
      updateDueDate: true,
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.amount).toBeDefined();
  });

  it('revalidates path after successful payment', async () => {
    setupMocks();

    await logPayment({
      billId: 'bill-1',
      amount: 10000, // 100.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(revalidatePath).toHaveBeenCalledWith('/');
  });
});

describe('updateTransaction', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('returns validation error when id is empty', async () => {
    const result = await updateTransaction({
      id: '',
      amount: 10000,
      paidAt: new Date('2025-12-21'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns validation error when amount is negative', async () => {
    const result = await updateTransaction({
      id: 'tx-1',
      amount: -100,
      paidAt: new Date('2025-12-21'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns validation error when amount is zero', async () => {
    const result = await updateTransaction({
      id: 'tx-1',
      amount: 0,
      paidAt: new Date('2025-12-21'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
  });
});

describe('deleteTransaction', () => {
  const mockTransaction = {
    id: 'tx-1',
    billId: 'bill-1',
    amount: 10000,
    paidAt: new Date('2025-12-20'),
    notes: null,
    createdAt: new Date(),
  };

  const mockBill = {
    id: 'bill-1',
    title: 'Test Bill',
    amount: 10000,
    amountDue: 10000,
    dueDate: new Date('2025-12-25'),
    frequency: 'monthly',
    status: 'pending',
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('deletes transaction when it exists', async () => {
    const runMock = jest.fn();
    const deleteMock = jest.fn().mockReturnValue({ run: runMock });
    const updateRunMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: updateRunMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    // First call: fetch transaction, Second call: fetch bill, Third call: fetch all transactions
    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTransaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBill]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

    (db.delete as jest.Mock).mockReturnValue({
      where: deleteMock,
    });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    const result = await deleteTransaction({ id: 'tx-1' });

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalledWith(transactions);
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('returns error when transaction not found', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await deleteTransaction({ id: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Transaction not found');
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('returns error when id is empty', async () => {
    const result = await deleteTransaction({ id: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid transaction ID');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('recalculates bill when payment affected current cycle', async () => {
    const runMock = jest.fn();
    const deleteMock = jest.fn().mockReturnValue({ run: runMock });
    const updateRunMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: updateRunMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(true);
    (PaymentService.recalculateBillFromPayments as jest.Mock).mockReturnValue({
      amountDue: 10000,
      status: 'pending',
      nextDueDate: new Date('2025-11-25'),
    });

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTransaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBill]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

    (db.delete as jest.Mock).mockReturnValue({
      where: deleteMock,
    });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    await deleteTransaction({ id: 'tx-1' });

    expect(db.update).toHaveBeenCalledWith(bills);
    expect(updateSetMock).toHaveBeenCalled();
  });
});

describe('getRecentPaymentsStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns count and total from recent payments', async () => {
    (SettingsService.getPaidRecentlyRange as jest.Mock).mockResolvedValue(7);
    (TransactionService.getRecentPayments as jest.Mock).mockResolvedValue([
      { id: 'tx-1', amount: 5000, billTitle: 'Rent', paidAt: new Date(), notes: null },
      { id: 'tx-2', amount: 3000, billTitle: 'Electric', paidAt: new Date(), notes: null },
    ]);

    const result = await getRecentPaymentsStats();

    expect(result.count).toBe(2);
    expect(result.total).toBe(8000);
  });

  it('calls SettingsService to get range', async () => {
    (SettingsService.getPaidRecentlyRange as jest.Mock).mockResolvedValue(14);
    (TransactionService.getRecentPayments as jest.Mock).mockResolvedValue([]);

    await getRecentPaymentsStats();

    expect(SettingsService.getPaidRecentlyRange).toHaveBeenCalled();
    expect(TransactionService.getRecentPayments).toHaveBeenCalledWith(14);
  });

  it('returns zero count and total when no payments', async () => {
    (SettingsService.getPaidRecentlyRange as jest.Mock).mockResolvedValue(7);
    (TransactionService.getRecentPayments as jest.Mock).mockResolvedValue([]);

    const result = await getRecentPaymentsStats();

    expect(result.count).toBe(0);
    expect(result.total).toBe(0);
  });

  it('calculates total correctly with multiple payments', async () => {
    (SettingsService.getPaidRecentlyRange as jest.Mock).mockResolvedValue(7);
    (TransactionService.getRecentPayments as jest.Mock).mockResolvedValue([
      { id: 'tx-1', amount: 10000, billTitle: 'Rent', paidAt: new Date(), notes: null },
      { id: 'tx-2', amount: 5000, billTitle: 'Electric', paidAt: new Date(), notes: null },
      { id: 'tx-3', amount: 2500, billTitle: 'Internet', paidAt: new Date(), notes: null },
    ]);

    const result = await getRecentPaymentsStats();

    expect(result.count).toBe(3);
    expect(result.total).toBe(17500);
  });
});
