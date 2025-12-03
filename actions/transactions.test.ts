import { logPayment } from './transactions';
import { db, bills, transactions, resetDbMocks } from '@/db';

jest.mock('@/db');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('@/lib/services/RecurrenceService', () => ({
  RecurrenceService: {
    calculateNextDueDate: jest.fn(),
    deriveStatus: jest.fn().mockReturnValue('pending'),
  },
}));

import { RecurrenceService } from '@/lib/services/RecurrenceService';

describe('logPayment', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  it('calls db.transaction for atomicity', async () => {
    // Mock bill fetch
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{
          id: 'bill-1',
          dueDate: new Date('2025-12-15'),
          frequency: 'monthly',
        }]),
      }),
    });

    // Mock next due date calculation
    (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(
      new Date('2026-01-15')
    );

    // Setup transaction mock to execute callback
    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const txMock = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockReturnValue({
              get: jest.fn().mockReturnValue({ id: 'tx-1' }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              run: jest.fn(),
            }),
          }),
        }),
      };
      return callback(txMock);
    });

    const input = {
      billId: 'bill-1',
      amount: '100.00',
      paidAt: new Date('2025-12-15'),
    };

    await logPayment(input);

    expect(db.transaction).toHaveBeenCalled();
  });

  it('inserts transaction AND updates bill within transaction', async () => {
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

    // Mock bill fetch
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{
          id: 'bill-1',
          dueDate: new Date('2025-12-15'),
          frequency: 'monthly',
        }]),
      }),
    });

    (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(
      new Date('2026-01-15')
    );

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      const txMock = {
        insert: insertMock,
        update: updateMock,
      };
      return callback(txMock);
    });

    const input = {
      billId: 'bill-1',
      amount: '50.00',
      paidAt: new Date('2025-12-15'),
    };

    const result = await logPayment(input);

    expect(result.success).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(transactions);
    expect(updateMock).toHaveBeenCalledWith(bills);
  });

  it('converts amount to minor units in transaction insert', async () => {
    let capturedAmount: number | undefined;

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
        where: jest.fn().mockReturnValue({
          run: jest.fn(),
        }),
      }),
    });

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{
          id: 'bill-1',
          dueDate: new Date('2025-12-15'),
          frequency: 'monthly',
        }]),
      }),
    });

    (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(
      new Date('2026-01-15')
    );

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: '75.50',
      paidAt: new Date('2025-12-15'),
    });

    expect(capturedAmount).toBe(7550);
  });

  it('marks one-time bill as paid without advancing date', async () => {
    let capturedStatus: string | undefined;

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
        return {
          where: jest.fn().mockReturnValue({
            run: jest.fn(),
          }),
        };
      }),
    });

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{
          id: 'bill-1',
          dueDate: new Date('2025-12-15'),
          frequency: 'once',
        }]),
      }),
    });

    // One-time bills return null for next date
    (RecurrenceService.calculateNextDueDate as jest.Mock).mockReturnValue(null);

    (db.transaction as jest.Mock).mockImplementation((callback) => {
      return callback({ insert: insertMock, update: updateMock });
    });

    await logPayment({
      billId: 'bill-1',
      amount: '200.00',
      paidAt: new Date('2025-12-15'),
    });

    expect(capturedStatus).toBe('paid');
  });

  it('returns error when bill not found', async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await logPayment({
      billId: 'nonexistent',
      amount: '10.00',
      paidAt: new Date(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bill not found');
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('validates amount is positive', async () => {
    const result = await logPayment({
      billId: 'bill-1',
      amount: '0',
      paidAt: new Date(),
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.amount).toBeDefined();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('validates amount format', async () => {
    const result = await logPayment({
      billId: 'bill-1',
      amount: 'invalid',
      paidAt: new Date(),
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.amount).toBeDefined();
  });
});
