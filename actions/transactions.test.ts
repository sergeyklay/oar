import { logPayment, deleteTransaction } from './transactions';
import { db, bills, transactions, resetDbMocks } from '@/db';
import { revalidatePath } from 'next/cache';

jest.mock('@/db');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('@/lib/services/PaymentService', () => ({
  PaymentService: {
    processPayment: jest.fn(),
  },
}));

import { PaymentService } from '@/lib/services/PaymentService';

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
  } = {
    nextDueDate: new Date('2026-01-15'),
    newAmountDue: 20000,
    newStatus: 'pending',
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

    await logPayment({
      billId: 'bill-1',
      amount: 10000, // 100.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: true,
    });

    expect(PaymentService.processPayment).toHaveBeenCalledWith(
      mockBill,
      10000,
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
      true
    );
  });

  it('passes updateDueDate=false to PaymentService for partial payments', async () => {
    setupMocks(mockBill, {
      nextDueDate: null,
      newAmountDue: 15000,
      newStatus: 'pending',
    });

    await logPayment({
      billId: 'bill-1',
      amount: 5000, // 50.00 in minor units
      paidAt: new Date('2025-12-15'),
      updateDueDate: false,
    });

    expect(PaymentService.processPayment).toHaveBeenCalledWith(
      mockBill,
      5000,
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

describe('deleteTransaction', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('deletes transaction when it exists', async () => {
    const runMock = jest.fn();
    const whereMock = jest.fn().mockReturnValue({ run: runMock });

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 'tx-1' }]),
      }),
    });

    (db.delete as jest.Mock).mockReturnValue({
      where: whereMock,
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

  it('does not modify associated bill (detached deletion)', async () => {
    const runMock = jest.fn();
    const whereMock = jest.fn().mockReturnValue({ run: runMock });

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 'tx-1' }]),
      }),
    });

    (db.delete as jest.Mock).mockReturnValue({
      where: whereMock,
    });

    await deleteTransaction({ id: 'tx-1' });

    expect(db.update).not.toHaveBeenCalled();
  });
});
