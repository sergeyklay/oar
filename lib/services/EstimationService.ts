import { TransactionService } from './TransactionService';
import { BillService } from './BillService';

/**
 * Strategy interface for estimating variable bill amounts.
 *
 * WHY STRATEGY PATTERN: Allows extensibility (e.g., ML-based estimation)
 * without modifying UI or core forecast logic.
 */
export interface EstimationStrategy {
  /**
   * Calculates estimated amount for a variable bill.
   *
   * @param billId - Bill ID
   * @param targetDate - Target month for estimation
   * @returns Estimated amount in minor units (integer), or null if insufficient data
   */
  calculate(billId: string, targetDate: Date): Promise<number | null>;

  /**
   * Returns strategy name for logging/debugging.
   */
  getName(): string;
}

/**
 * Strategy that calculates the average of the last 3 recorded payments.
 *
 * Useful for bills with consistent payment patterns.
 */
export class AverageLastThreePaymentsStrategy implements EstimationStrategy {
  getName(): string {
    return 'AverageLastThreePayments';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async calculate(billId: string, _targetDate: Date): Promise<number | null> {
    const transactions = await TransactionService.getByBillId(billId, {
      limit: 3,
      orderBy: 'paidAt DESC',
    });

    if (transactions.length < 1) {
      return null;
    }

    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const average = Math.round(total / transactions.length);

    return average;
  }
}

/**
 * Strategy that uses the amount from the same month in the previous year.
 *
 * Useful for seasonal bills (e.g., heating costs in winter).
 */
export class HistoricalMonthStrategy implements EstimationStrategy {
  getName(): string {
    return 'HistoricalMonth';
  }

  async calculate(billId: string, targetDate: Date): Promise<number | null> {
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetYear = targetDate.getFullYear() - 1; // Previous year

    const transactions = await TransactionService.getByBillIdAndMonth(
      billId,
      targetMonth,
      targetYear
    );

    if (transactions.length === 0) {
      return null;
    }

    // Use most recent payment from that month
    return transactions[0].amount;
  }
}

/**
 * Service for estimating variable bill amounts using multiple strategies.
 *
 * Strategy Selection:
 * 1. Try HistoricalMonthStrategy (most accurate for seasonal bills)
 * 2. Fall back to AverageLastThreePaymentsStrategy
 * 3. If no data, return bill.baseAmount (fallback to current estimate)
 */
export const EstimationService = {
  /**
   * Estimates amount for a variable bill using the best available strategy.
   *
   * @param billId - Bill ID
   * @param targetDate - Target month for estimation
   * @returns Estimated amount in minor units (integer)
   */
  async estimateAmount(billId: string, targetDate: Date): Promise<number> {
    // Try HistoricalMonthStrategy first
    const historicalStrategy = new HistoricalMonthStrategy();
    const historicalEstimate = await historicalStrategy.calculate(billId, targetDate);

    if (historicalEstimate !== null) {
      return historicalEstimate;
    }

    // Fall back to AverageLastThreePaymentsStrategy
    const averageStrategy = new AverageLastThreePaymentsStrategy();
    const averageEstimate = await averageStrategy.calculate(billId, targetDate);

    if (averageEstimate !== null) {
      return averageEstimate;
    }

    // No historical data: return bill's base amount
    const bill = await BillService.getWithTags(billId);
    if (!bill) {
      throw new Error(`Bill not found: ${billId}`);
    }

    return bill.amount;
  },
};

