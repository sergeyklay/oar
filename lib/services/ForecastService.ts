import type { BillWithTags, BillFrequency } from '@/db/schema';
import { BillService } from './BillService';
import { EstimationService } from './EstimationService';
import { db, bills, tags, billsToTags, billCategories } from '@/db';
import { eq, and, inArray, ne } from 'drizzle-orm';
import {
  parse,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addMonths,
  format,
} from 'date-fns';
import { RRule, Frequency } from 'rrule';

/**
 * Forecast bill with enriched data (estimates, amortization)
 */
export interface ForecastBill extends BillWithTags {
  /** Display amount in minor units (estimated if variable, base amount otherwise) */
  displayAmount: number;
  /** Whether displayAmount is an estimate (true for variable bills) */
  isEstimated: boolean;
  /** Monthly amortization amount in minor units (null if not applicable) */
  amortizationAmount: number | null;
}

/**
 * Amortization calculation result
 */
export interface AmortizationResult {
  /** Monthly amount to save in minor units */
  monthlyAmount: number | null;
  /** Whether amortization applies to this bill */
  applies: boolean;
}

/**
 * Forecast summary totals
 */
export interface ForecastSummary {
  /** Sum of direct payments due this month (in minor units) */
  totalDue: number;
  /** Sum of amortized portions for future bills (in minor units) */
  totalToSave: number;
  /** Grand total (totalDue + totalToSave) in minor units */
  grandTotal: number;
}

/**
 * Monthly forecast total for chart visualization
 */
export interface MonthlyForecastTotal {
  /** Month string in YYYY-MM format (for URL navigation) */
  month: string;
  /** Abbreviated month name for X-axis display (e.g., "Jan", "Feb", "Mar") */
  monthLabel: string;
  /** Sum of direct payments due this month (in minor units, integer) */
  totalDue: number;
  /** Sum of amortized portions for future bills (in minor units, integer) */
  totalToSave: number;
  /** Grand total (totalDue + totalToSave) in minor units, integer */
  grandTotal: number;
}

/**
 * Converts bill frequency to months for amortization calculations.
 *
 * @param frequency - Bill frequency enum
 * @returns Number of months (fractional for weekly/biweekly)
 */
function convertFrequencyToMonths(frequency: BillFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 0.25; // ~4 weeks per month
    case 'biweekly':
      return 0.5; // ~2 weeks per month
    case 'twicemonthly':
      return 1; // 2x per month = 1 month
    case 'monthly':
      return 1;
    case 'bimonthly':
      return 2;
    case 'quarterly':
      return 3;
    case 'yearly':
      return 12;
    case 'once':
      return 0; // No amortization for one-time
  }
}

/**
 * Calculates monthly "Amount to Save" for bills with recurrence > 1 month.
 *
 * Uses steady-state amortization: divide total by recurrence months.
 *
 * @param bill - Bill with tags
 * @param targetMonth - Target month for calculation (unused but reserved for future catch-up logic)
 * @returns Amortization result with monthly amount
 */
function calculateAmortization(
  bill: BillWithTags,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetMonth: Date
): AmortizationResult {
  const recurrenceMonths = convertFrequencyToMonths(bill.frequency);

  if (recurrenceMonths <= 1) {
    return { monthlyAmount: null, applies: false };
  }

  // Calculate monthly amount: divide total by recurrence months
  // Round to nearest integer (minor unit)
  const monthlyAmount = Math.round(bill.amount / recurrenceMonths);

  return { monthlyAmount, applies: true };
}

/**
 * Maps simple frequency enum to rrule Frequency.
 */
const FREQUENCY_MAP: Record<BillFrequency, Frequency | null> = {
  once: null,
  weekly: Frequency.WEEKLY,
  biweekly: Frequency.WEEKLY,
  twicemonthly: Frequency.MONTHLY,
  monthly: Frequency.MONTHLY,
  bimonthly: Frequency.MONTHLY,
  quarterly: Frequency.MONTHLY,
  yearly: Frequency.YEARLY,
};

/**
 * Projects occurrences for a bill within a target month.
 *
 * @param bill - Bill definition
 * @param targetMonthStart - Start of target month
 * @param targetMonthEnd - End of target month
 * @returns Projected due date in target month, or null if no occurrence
 */
function projectOccurrenceInMonth(
  bill: BillWithTags,
  targetMonthStart: Date,
  targetMonthEnd: Date
): Date | null {
  // One-time bills: only include if their dueDate falls in target month
  if (bill.frequency === 'once') {
    if (
      isWithinInterval(bill.dueDate, {
        start: targetMonthStart,
        end: targetMonthEnd,
      })
    ) {
      return bill.dueDate;
    }
    return null;
  }

  const rruleFrequency = FREQUENCY_MAP[bill.frequency];
  if (rruleFrequency === null) {
    return null;
  }

  // Check if bill has ended
  if (bill.endDate && bill.endDate < targetMonthStart) {
    return null;
  }

  // Use UTC date with same components as local date to avoid timezone issues
  const localAsUtc = new Date(
    Date.UTC(
      bill.dueDate.getFullYear(),
      bill.dueDate.getMonth(),
      bill.dueDate.getDate(),
      bill.dueDate.getHours(),
      bill.dueDate.getMinutes(),
      bill.dueDate.getSeconds()
    )
  );

  const options: Partial<import('rrule').Options> = {
    freq: rruleFrequency,
    dtstart: localAsUtc,
  };

  // Handle intervals for expanded frequencies
  if (bill.frequency === 'biweekly') options.interval = 2;
  if (bill.frequency === 'bimonthly') options.interval = 2;
  if (bill.frequency === 'quarterly') options.interval = 3;

  // Handle twice-monthly logic
  if (bill.frequency === 'twicemonthly') {
    const day = bill.dueDate.getDate();
    const secondDay = day <= 14 ? day + 14 : day - 14;
    options.bymonthday = [day, secondDay].sort((a, b) => a - b);
  }

  // Set until date if bill has endDate
  if (bill.endDate) {
    const endDateUtc = new Date(
      Date.UTC(
        bill.endDate.getFullYear(),
        bill.endDate.getMonth(),
        bill.endDate.getDate(),
        bill.endDate.getHours(),
        bill.endDate.getMinutes(),
        bill.endDate.getSeconds()
      )
    );
    options.until = endDateUtc;
  }

  const rule = new RRule(options);

  // Convert target month bounds to UTC for RRule
  const targetStartUtc = new Date(
    Date.UTC(
      targetMonthStart.getFullYear(),
      targetMonthStart.getMonth(),
      targetMonthStart.getDate(),
      0,
      0,
      0
    )
  );
  const targetEndUtc = new Date(
    Date.UTC(
      targetMonthEnd.getFullYear(),
      targetMonthEnd.getMonth(),
      targetMonthEnd.getDate(),
      23,
      59,
      59
    )
  );

  // Find occurrences between target month bounds
  const occurrences = rule.between(targetStartUtc, targetEndUtc, true);

  if (occurrences.length === 0) {
    return null;
  }

  // Use first occurrence in the month
  const firstOccurrenceUtc = occurrences[0];

  // Convert back from UTC components to local date
  return new Date(
    firstOccurrenceUtc.getUTCFullYear(),
    firstOccurrenceUtc.getUTCMonth(),
    firstOccurrenceUtc.getUTCDate(),
    firstOccurrenceUtc.getUTCHours(),
    firstOccurrenceUtc.getUTCMinutes(),
    firstOccurrenceUtc.getUTCSeconds()
  );
}

/**
 * Service for forecast-related business logic.
 */
export const ForecastService = {
  /**
   * Projects bills for target month with estimation and amortization calculations.
   *
   * Uses projection logic: fetches all active bills and projects their occurrences
   * into the target month, rather than querying for existing instances.
   *
   * @param month - Month string in YYYY-MM format
   * @param tag - Optional tag slug for filtering
   * @returns Array of forecast bills with enriched data
   */
  async getBillsForMonth(month: string, tag?: string): Promise<ForecastBill[]> {
    // Parse month string to Date object
    const targetDate = parse(month, 'yyyy-MM', new Date());
    const targetMonthStart = startOfMonth(targetDate);
    const targetMonthEnd = endOfMonth(targetDate);

    // Fetch ALL active bills (not filtered by month)
    const conditions = [eq(bills.isArchived, false), ne(bills.status, 'paid')];

    // Apply tag filter if provided
    let billIds: string[] | undefined;
    if (tag) {
      const [tagRecord] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tag));

      if (!tagRecord) {
        return [];
      }

      const billsWithTag = await db
        .select({ billId: billsToTags.billId })
        .from(billsToTags)
        .where(eq(billsToTags.tagId, tagRecord.id));

      billIds = billsWithTag.map((b) => b.billId);

      if (billIds.length === 0) {
        return [];
      }

      conditions.push(inArray(bills.id, billIds));
    }

    // Fetch bills with tags and category icons
    const baseQuery = db
      .select({
        bill: bills,
        categoryIcon: billCategories.icon,
      })
      .from(bills)
      .innerJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(...conditions))
      .orderBy(bills.dueDate);

    const billsWithCategories = await baseQuery;

    if (billsWithCategories.length === 0) {
      return [];
    }

    // Fetch tags for all bills
    const allBillIds = billsWithCategories.map((b) => b.bill.id);
    const tagsByBillId = await BillService.getTagsForBills(allBillIds);

    // Project occurrences and enrich with forecast data
    const forecastBills: ForecastBill[] = [];
    const variableBillsToEstimate: Array<{ billId: string; forecastBillIndex: number }> = [];

    // First pass: Build forecast bills and collect variable bills for parallel estimation
    for (const { bill, categoryIcon } of billsWithCategories) {
      const billWithTags: BillWithTags = {
        ...bill,
        endDate: bill.endDate ?? null,
        tags: tagsByBillId.get(bill.id) ?? [],
        categoryIcon,
      };

      // Project occurrence in target month
      const projectedDueDate = projectOccurrenceInMonth(
        billWithTags,
        targetMonthStart,
        targetMonthEnd
      );

      // Skip if no occurrence in target month
      if (!projectedDueDate) {
        continue;
      }

      // Create forecast bill with projected due date
      const forecastBill: ForecastBill = {
        ...billWithTags,
        dueDate: projectedDueDate,
        displayAmount: bill.amount, // Default to base amount
        isEstimated: false,
        amortizationAmount: null,
      };

      // If variable bill, collect for parallel estimation
      if (bill.isVariable) {
        variableBillsToEstimate.push({
          billId: bill.id,
          forecastBillIndex: forecastBills.length,
        });
      }

      // If recurrence > 1 month, calculate amortization
      const recurrenceMonths = convertFrequencyToMonths(bill.frequency);
      if (recurrenceMonths > 1) {
        const amortizationResult = calculateAmortization(
          forecastBill,
          targetMonthStart
        );
        forecastBill.amortizationAmount = amortizationResult.monthlyAmount;
      }

      forecastBills.push(forecastBill);
    }

    // Parallel estimation for all variable bills
    if (variableBillsToEstimate.length > 0) {
      const estimates = await Promise.all(
        variableBillsToEstimate.map(({ billId }) =>
          EstimationService.estimateAmount(billId, targetDate)
        )
      );

      // Merge estimates back into forecast bills
      for (let i = 0; i < variableBillsToEstimate.length; i++) {
        const { forecastBillIndex } = variableBillsToEstimate[i];
        const estimatedAmount = estimates[i];
        forecastBills[forecastBillIndex].displayAmount = estimatedAmount;
        forecastBills[forecastBillIndex].isEstimated = true;
      }
    }

    // Sort by projected due date
    forecastBills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return forecastBills;
  },

  /**
   * Calculates summary totals from forecast bills.
   *
   * @param bills - Array of forecast bills
   * @returns Summary with total due, total to save, and grand total
   */
  calculateSummary(bills: ForecastBill[]): ForecastSummary {
    const totalDue = bills.reduce((sum, bill) => sum + bill.displayAmount, 0);

    const totalToSave = bills.reduce((sum, bill) => {
      if (bill.amortizationAmount !== null) {
        return sum + bill.amortizationAmount;
      }
      return sum;
    }, 0);

    const grandTotal = totalDue + totalToSave;

    return {
      totalDue,
      totalToSave,
      grandTotal,
    };
  },

  /**
   * Projects bills for multiple months and returns aggregated monthly totals.
   *
   * @param startMonth - Starting month in YYYY-MM format
   * @param count - Number of months to project (default 12, max 24)
   * @param tag - Optional tag slug for filtering
   * @returns Array of monthly forecast totals
   */
  async getBillsForMonthRange(
    startMonth: string,
    count: number,
    tag?: string
  ): Promise<MonthlyForecastTotal[]> {
    const startDate = parse(startMonth, 'yyyy-MM', new Date());
    const results: MonthlyForecastTotal[] = [];

    for (let i = 0; i < count; i++) {
      const currentMonthDate = addMonths(startDate, i);
      const currentMonthStr = format(currentMonthDate, 'yyyy-MM');
      const monthLabel = format(currentMonthDate, 'MMM');

      const bills = await this.getBillsForMonth(currentMonthStr, tag);
      const summary = this.calculateSummary(bills);

      results.push({
        month: currentMonthStr,
        monthLabel,
        totalDue: summary.totalDue,
        totalToSave: summary.totalToSave,
        grandTotal: summary.grandTotal,
      });
    }

    return results;
  },
};

