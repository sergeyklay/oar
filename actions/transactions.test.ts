import {
  logPayment,
  deleteTransaction,
  updateTransaction,
  getRecentPaymentsStats,
  getRecentPayments,
  getPaymentsByDate,
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
    doesPaymentAffectCurrentCycle: jest.fn(),
    recalculateBillFromPayments: jest.fn(),
  },
}));
jest.mock('@/lib/services/SettingsService', () => ({
  SettingsService: {
    getPaidRecentlyRange: jest.fn(),
    getBillEndAction: jest.fn(),
  },
}));
jest.mock('@/lib/services/TransactionService', () => ({
  TransactionService: {
    getRecentPayments: jest.fn(),
    getPaymentsByDate: jest.fn(),
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

  it('archives bill when bill ended and setting is archive', async () => {
    const bill = {
      ...mockBill,
      endDate: new Date('2025-12-20'),
    };

    const paymentResult = {
      nextDueDate: null,
      newAmountDue: 0,
      newStatus: 'paid' as const,
      isHistorical: false,
      billEnded: true,
    };

    (PaymentService.processPayment as jest.Mock).mockReturnValue(paymentResult);
    (SettingsService.getBillEndAction as jest.Mock).mockResolvedValue('archive');

    setupMocks(bill, paymentResult);

    const result = await logPayment({
      billId: 'bill-1',
      amount: 20000,
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.billArchived).toBe(true);
    expect(result.message).toBe('Payment logged and bill archived.');
    expect(SettingsService.getBillEndAction).toHaveBeenCalled();

    const transactionCall = (db.transaction as jest.Mock).mock.calls[0][0];
    const mockTx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({ id: 'tx-1' }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ run: jest.fn() }),
        }),
      }),
    };
    transactionCall(mockTx);

    expect(mockTx.update).toHaveBeenCalled();
    const setCall = (mockTx.update as jest.Mock).mock.results[0].value.set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({ isArchived: true })
    );
  });

  it('does not archive bill when bill ended but setting is mark_as_paid', async () => {
    const bill = {
      ...mockBill,
      endDate: new Date('2025-12-20'),
    };

    const paymentResult = {
      nextDueDate: null,
      newAmountDue: 0,
      newStatus: 'paid' as const,
      isHistorical: false,
      billEnded: true,
    };

    (PaymentService.processPayment as jest.Mock).mockReturnValue(paymentResult);
    (SettingsService.getBillEndAction as jest.Mock).mockResolvedValue('mark_as_paid');

    setupMocks(bill, paymentResult);

    const result = await logPayment({
      billId: 'bill-1',
      amount: 20000,
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.billArchived).toBe(false);
    expect(result.message).toBe('Payment logged successfully.');
    expect(SettingsService.getBillEndAction).toHaveBeenCalled();

    const transactionCall = (db.transaction as jest.Mock).mock.calls[0][0];
    const mockTx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({ id: 'tx-1' }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ run: jest.fn() }),
        }),
      }),
    };
    transactionCall(mockTx);

    expect(mockTx.update).toHaveBeenCalled();
    const setCall = (mockTx.update as jest.Mock).mock.results[0].value.set;
    expect(setCall).toHaveBeenCalledWith(
      expect.not.objectContaining({ isArchived: expect.anything() })
    );
  });

  it('does not check bill end action when bill did not end', async () => {
    const paymentResult = {
      nextDueDate: new Date('2026-01-15'),
      newAmountDue: 20000,
      newStatus: 'pending' as const,
      isHistorical: false,
      billEnded: false,
    };

    (PaymentService.processPayment as jest.Mock).mockReturnValue(paymentResult);

    setupMocks(mockBill, paymentResult);

    await logPayment({
      billId: 'bill-1',
      amount: 20000,
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(SettingsService.getBillEndAction).not.toHaveBeenCalled();
  });

  it('returns error when database throws', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Database connection lost')),
      }),
    });

    const result = await logPayment({
      billId: 'bill-1',
      amount: 10000,
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to log payment. Please try again.');
  });
});

describe('updateTransaction', () => {
  const mockTransaction = {
    id: 'tx-1',
    billId: 'bill-1',
    amount: 10000,
    paidAt: new Date('2025-12-20'),
    notes: 'Original note',
    createdAt: new Date(),
  };

  const mockBill = {
    id: 'bill-1',
    title: 'Test Bill',
    amount: 10000,
    amountDue: 10000,
    dueDate: new Date('2025-12-25'),
    frequency: 'monthly' as const,
    status: 'pending' as const,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  it('updates transaction successfully when it does not affect cycle', async () => {
    const runMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: runMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

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
      });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: db.update,
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 15000,
      paidAt: new Date('2025-12-21'),
      notes: 'Updated note',
    });

    expect(result.success).toBe(true);
    expect(result.data?.transactionId).toBe('tx-1');
    expect(db.transaction).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledWith(transactions);
    expect(db.update).not.toHaveBeenCalledWith(bills);
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('recalculates bill when payment affects current cycle', async () => {
    const runMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: runMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    (PaymentService.recalculateBillFromPayments as jest.Mock).mockReturnValue({
      amountDue: 5000,
      status: 'pending' as const,
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
            orderBy: jest.fn().mockResolvedValue([mockTransaction]),
          }),
        }),
      });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: db.update,
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 15000,
      paidAt: new Date('2025-12-21'),
      notes: 'Updated note',
    });

    expect(result.success).toBe(true);
    expect(db.transaction).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledWith(transactions);
    expect(db.update).toHaveBeenCalledWith(bills);
    expect(PaymentService.recalculateBillFromPayments).toHaveBeenCalled();
  });

  it('recalculates bill when updated payment affects current cycle', async () => {
    const runMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: runMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    (PaymentService.recalculateBillFromPayments as jest.Mock).mockReturnValue({
      amountDue: 8000,
      status: 'pending' as const,
      nextDueDate: null,
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
            orderBy: jest.fn().mockResolvedValue([mockTransaction]),
          }),
        }),
      });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: db.update,
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 20000,
      paidAt: new Date('2025-12-22'),
    });

    expect(result.success).toBe(true);
    expect(db.transaction).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledWith(transactions);
    expect(db.update).toHaveBeenCalledWith(bills);
    expect(PaymentService.recalculateBillFromPayments).toHaveBeenCalled();
  });

  it('returns error when transaction not found', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await updateTransaction({
      id: 'nonexistent',
      amount: 10000,
      paidAt: new Date('2025-12-21'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Transaction not found');
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('returns error when bill not found', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTransaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 10000,
      paidAt: new Date('2025-12-21'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bill not found');
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('preserves cycle when editing amount without changing date (fast path)', async () => {
    const billWithAdvancedCycle = {
      ...mockBill,
      amountDue: 10000,
      dueDate: new Date('2026-01-25'),
    };

    const transactionWithOriginalDate = {
      ...mockTransaction,
      paidAt: new Date('2025-12-20T10:00:00'),
    };

    let capturedAmountDue: number | undefined;
    let capturedDueDate: Date | undefined;
    let capturedStatus: string | undefined;

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(true);

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([transactionWithOriginalDate]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([billWithAdvancedCycle]),
        }),
      });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn((data) => {
            if (data.amountDue !== undefined) {
              capturedAmountDue = data.amountDue;
              capturedDueDate = data.dueDate;
              capturedStatus = data.status;
            }
            return {
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
            };
          }),
        }),
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 9999,
      paidAt: new Date('2025-12-20T15:30:00'),
    });

    expect(result.success).toBe(true);
    expect(capturedAmountDue).toBe(10001);
    expect(capturedDueDate).toBeUndefined();
    expect(capturedStatus).toBeUndefined();
    expect(PaymentService.recalculateBillFromPayments).not.toHaveBeenCalled();
    expect(PaymentService.doesPaymentAffectCurrentCycle).toHaveBeenCalledWith(
      billWithAdvancedCycle,
      transactionWithOriginalDate
    );
  });

  it('preserves cycle when editing notes without changing date (fast path)', async () => {
    const billWithAdvancedCycle = {
      ...mockBill,
      amountDue: 10000,
      dueDate: new Date('2026-01-25'),
    };

    let capturedAmountDue: number | undefined;
    let capturedDueDate: Date | undefined;

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(true);

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTransaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([billWithAdvancedCycle]),
        }),
      });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn((data) => {
            if (data.amountDue !== undefined) {
              capturedAmountDue = data.amountDue;
              capturedDueDate = data.dueDate;
            }
            return {
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
            };
          }),
        }),
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 10000,
      paidAt: new Date('2025-12-20'),
      notes: 'Updated notes',
    });

    expect(result.success).toBe(true);
    expect(capturedAmountDue).toBe(10000);
    expect(capturedDueDate).toBeUndefined();
    expect(PaymentService.recalculateBillFromPayments).not.toHaveBeenCalled();
  });

  it('treats same calendar day as unchanged date even with different time', async () => {
    const billWithAdvancedCycle = {
      ...mockBill,
      amountDue: 10000,
      dueDate: new Date('2026-01-25'),
    };

    const transactionMorning = {
      ...mockTransaction,
      paidAt: new Date('2025-12-20T08:00:00'),
    };

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([transactionMorning]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([billWithAdvancedCycle]),
        }),
      });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ run: jest.fn() }),
          }),
        }),
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 9500,
      paidAt: new Date('2025-12-20T22:30:00'),
    });

    expect(result.success).toBe(true);
    expect(PaymentService.recalculateBillFromPayments).not.toHaveBeenCalled();
  });

  it('preserves cycle for variable bill when editing amount (fast path)', async () => {
    const variableBill = {
      ...mockBill,
      amountDue: 0,
      dueDate: new Date('2026-01-25'),
      isVariable: true,
    };

    const transactionWithOriginalDate = {
      ...mockTransaction,
      paidAt: new Date('2025-12-20'),
    };

    let capturedAmountDue: number | undefined;

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(true);

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([transactionWithOriginalDate]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([variableBill]),
        }),
      });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn((data) => {
            if (data.amountDue !== undefined) {
              capturedAmountDue = data.amountDue;
            }
            return {
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
            };
          }),
        }),
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 5000,
      paidAt: new Date('2025-12-20'),
    });

    expect(result.success).toBe(true);
    expect(capturedAmountDue).toBe(0);
    expect(PaymentService.recalculateBillFromPayments).not.toHaveBeenCalled();
  });

  it('triggers full recalculation when date changes', async () => {
    const runMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: runMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    (PaymentService.recalculateBillFromPayments as jest.Mock).mockReturnValue({
      amountDue: 5000,
      status: 'pending' as const,
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
            orderBy: jest.fn().mockResolvedValue([mockTransaction]),
          }),
        }),
      });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: db.update,
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 15000,
      paidAt: new Date('2025-12-19'),
    });

    expect(result.success).toBe(true);
    expect(PaymentService.recalculateBillFromPayments).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledWith(bills);
  });

  it('does not modify bill when editing historical transaction amount (fast path)', async () => {
    const historicalTransaction = {
      ...mockTransaction,
      paidAt: new Date('2025-11-15'),
      amount: 8000,
    };

    const currentBill = {
      ...mockBill,
      amountDue: 10000,
      dueDate: new Date('2025-12-25'),
    };

    const runMock = jest.fn();
    const updateWhereMock = jest.fn().mockReturnValue({ run: runMock });
    const updateSetMock = jest.fn().mockReturnValue({ where: updateWhereMock });

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(false);

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([historicalTransaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([currentBill]),
        }),
      });

    (db.update as jest.Mock).mockReturnValue({
      set: updateSetMock,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: db.update,
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 9000,
      paidAt: new Date('2025-11-15'),
      notes: 'Updated notes',
    });

    expect(result.success).toBe(true);
    expect(result.data?.transactionId).toBe('tx-1');
    expect(PaymentService.doesPaymentAffectCurrentCycle).toHaveBeenCalledWith(
      currentBill,
      historicalTransaction
    );
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledWith(transactions);
    expect(db.update).not.toHaveBeenCalledWith(bills);
    expect(PaymentService.recalculateBillFromPayments).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('uses full recalculation for one-time bills even when date unchanged', async () => {
    const oneTimeBill = {
      ...mockBill,
      frequency: 'once' as const,
      amountDue: 5000,
      dueDate: new Date('2025-12-25'),
      status: 'pending' as const,
    };

    const transaction = {
      ...mockTransaction,
      paidAt: new Date('2025-12-20'),
      amount: 5000,
    };

    let capturedAmountDue: number | undefined;
    let capturedStatus: string | undefined;

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(true);

    (PaymentService.recalculateBillFromPayments as jest.Mock).mockReturnValue({
      amountDue: 0,
      status: 'paid' as const,
      nextDueDate: null,
    });

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([transaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([oneTimeBill]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([transaction]),
          }),
        }),
      });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn((data) => {
            if (data.amountDue !== undefined) {
              capturedAmountDue = data.amountDue;
              capturedStatus = data.status;
            }
            return {
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
            };
          }),
        }),
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 5000,
      paidAt: new Date('2025-12-20'),
    });

    expect(result.success).toBe(true);
    expect(PaymentService.recalculateBillFromPayments).toHaveBeenCalled();
    const recalculateCall = (PaymentService.recalculateBillFromPayments as jest.Mock).mock.calls[0];
    expect(recalculateCall[0]).toMatchObject({
      frequency: 'once',
      amountDue: 5000,
    });
    expect(recalculateCall[1]).toHaveLength(1);
    expect(recalculateCall[1][0]).toMatchObject({
      id: 'tx-1',
      amount: 5000,
      paidAt: new Date('2025-12-20'),
    });
    expect(capturedAmountDue).toBe(0);
    expect(capturedStatus).toBe('paid');
  });

  it('updates one-time bill status to pending when amountDue becomes greater than zero', async () => {
    const oneTimeBill = {
      ...mockBill,
      frequency: 'once' as const,
      amountDue: 0,
      dueDate: new Date('2025-12-25'),
      status: 'paid' as const,
    };

    const transaction = {
      ...mockTransaction,
      paidAt: new Date('2025-12-20'),
      amount: 10000,
    };

    let capturedAmountDue: number | undefined;
    let capturedStatus: string | undefined;

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(true);

    (PaymentService.recalculateBillFromPayments as jest.Mock).mockReturnValue({
      amountDue: 2000,
      status: 'pending' as const,
      nextDueDate: null,
    });

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([transaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([oneTimeBill]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([transaction]),
          }),
        }),
      });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn((data) => {
            if (data.amountDue !== undefined) {
              capturedAmountDue = data.amountDue;
              capturedStatus = data.status;
            }
            return {
              where: jest.fn().mockReturnValue({ run: jest.fn() }),
            };
          }),
        }),
      };
      return callback(tx);
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 8000,
      paidAt: new Date('2025-12-20'),
    });

    expect(result.success).toBe(true);
    expect(PaymentService.recalculateBillFromPayments).toHaveBeenCalled();
    const recalculateCall = (PaymentService.recalculateBillFromPayments as jest.Mock).mock.calls[0];
    expect(recalculateCall[0]).toMatchObject({
      frequency: 'once',
      amountDue: 0,
    });
    expect(recalculateCall[1]).toHaveLength(1);
    expect(recalculateCall[1][0]).toMatchObject({
      id: 'tx-1',
      amount: 8000,
      paidAt: new Date('2025-12-20'),
    });
    expect(capturedAmountDue).toBe(2000);
    expect(capturedStatus).toBe('pending');
  });

  it('returns error when database throws', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Connection error')),
      }),
    });

    const result = await updateTransaction({
      id: 'tx-1',
      amount: 8000,
      paidAt: new Date('2025-12-20'),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update payment record. Please try again.');
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

    (PaymentService.doesPaymentAffectCurrentCycle as jest.Mock).mockReturnValue(false);

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
      });

    (db.delete as jest.Mock).mockReturnValue({
      where: deleteMock,
    });

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        delete: db.delete,
        update: db.update,
      };
      return callback(tx);
    });

    const result = await deleteTransaction({ id: 'tx-1' });

    expect(result.success).toBe(true);
    expect(db.transaction).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalledWith(transactions);
    expect(db.update).not.toHaveBeenCalled();
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

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const tx = {
        delete: db.delete,
        update: db.update,
      };
      return callback(tx);
    });

    await deleteTransaction({ id: 'tx-1' });

    expect(db.transaction).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalledWith(transactions);
    expect(db.update).toHaveBeenCalledWith(bills);
  });

  it('returns error when bill not found', async () => {
    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTransaction]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

    const result = await deleteTransaction({ id: 'tx-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bill not found');
  });

  it('returns error when database throws', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Connection error')),
      }),
    });

    const result = await deleteTransaction({ id: 'tx-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to delete payment record. Please try again.');
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
    expect(TransactionService.getRecentPayments).toHaveBeenCalledWith(14, undefined, 0);
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

describe('getRecentPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns payments for valid input', async () => {
    const mockPayments = [
      { id: 'tx-1', amount: 5000, billTitle: 'Rent', paidAt: new Date() },
    ];
    (TransactionService.getRecentPayments as jest.Mock).mockResolvedValue(mockPayments);

    const result = await getRecentPayments({ days: 7 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPayments);
  });

  it('passes tag to service when provided', async () => {
    (TransactionService.getRecentPayments as jest.Mock).mockResolvedValue([]);

    await getRecentPayments({ days: 14, tag: 'utilities' });

    expect(TransactionService.getRecentPayments).toHaveBeenCalledWith(14, 'utilities', 0);
  });

  it('returns error for invalid days', async () => {
    const result = await getRecentPayments({ days: -1 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid recent payments query parameters');
  });

  it('returns error for days exceeding max', async () => {
    const result = await getRecentPayments({ days: 400 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid recent payments query parameters');
  });

  it('returns error when service throws', async () => {
    (TransactionService.getRecentPayments as jest.Mock).mockRejectedValue(new Error('DB error'));

    const result = await getRecentPayments({ days: 7 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch recent payments');
  });
});

describe('getPaymentsByDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns payments for valid date', async () => {
    const mockPayments = [
      { id: 'tx-1', amount: 5000, billTitle: 'Rent', paidAt: new Date() },
    ];
    (TransactionService.getPaymentsByDate as jest.Mock).mockResolvedValue(mockPayments);

    const result = await getPaymentsByDate({ date: '2026-01-05' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPayments);
  });

  it('passes tag to service when provided', async () => {
    (TransactionService.getPaymentsByDate as jest.Mock).mockResolvedValue([]);

    await getPaymentsByDate({ date: '2026-01-05', tag: 'utilities' });

    expect(TransactionService.getPaymentsByDate).toHaveBeenCalledWith('2026-01-05', 'utilities', 0);
  });

  it('returns error for invalid date format', async () => {
    const result = await getPaymentsByDate({ date: '01-05-2026' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid date query parameters');
  });

  it('returns error for malformed date', async () => {
    const result = await getPaymentsByDate({ date: 'not-a-date' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid date query parameters');
  });

  it('returns error when service throws', async () => {
    (TransactionService.getPaymentsByDate as jest.Mock).mockRejectedValue(new Error('DB error'));

    const result = await getPaymentsByDate({ date: '2026-01-05' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch payments by date');
  });
});
