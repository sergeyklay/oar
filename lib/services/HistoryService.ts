import type { PaymentWithBill, HistorySummary } from '@/lib/types';

/**
 * Service for history-related business logic.
 */
export const HistoryService = {
  /**
   * Calculates payment count and total amount from payment array.
   *
   * @param payments - Array of payments with bill information
   * @returns Summary object with count and totalPaid (integer, minor units)
   */
  calculateSummary(payments: PaymentWithBill[]): HistorySummary {
    const count = payments.length;
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      count,
      totalPaid,
    };
  },
};

