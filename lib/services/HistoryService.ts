import type { PaymentWithBill, HistorySummary, AggregatedBillSpending, AnnualSpendingSummary } from '@/lib/types';

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

  /**
   * Calculates annual spending summary from aggregated bill data.
   *
   * @param aggregatedData - Array of aggregated bill spending data
   * @returns Summary object with totalBills, totalPayments, and amountPaid (integer, minor units)
   */
  calculateAnnualSummary(aggregatedData: AggregatedBillSpending[]): AnnualSpendingSummary {
    const totalBills = aggregatedData.length;
    const totalPayments = aggregatedData.reduce((sum, bill) => sum + bill.paymentCount, 0);
    const amountPaid = aggregatedData.reduce((sum, bill) => sum + bill.totalAmount, 0);

    return {
      totalBills,
      totalPayments,
      amountPaid,
    };
  },
};

