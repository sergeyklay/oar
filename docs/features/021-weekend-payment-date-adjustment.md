# Weekend Payment Date Adjustment

- **Status:** Draft
- **Last Updated:** 2025-12-27

## Overview

Banks don't process payments on weekends. When a bill's due date falls on Saturday or Sunday, the payment clears on the next business day. This creates a mismatch between your calendar and reality: a bill due "January 15" might actually clear on January 17 if the 15th is a Saturday.

Weekend Payment Date Adjustment synchronizes your financial calendar with banking reality. Instead of showing a bill due on Saturday when it won't clear until Monday, the system adjusts the displayed date to match when money moves. This improves forecast accuracy and prevents cash flow gaps.

The system supports three adjustment strategies. You can set a global default in Settings, then override it per bill. This gives you control over how different payment types are handled. Digital subscriptions that process on weekends stay unchanged. Traditional banking payments move to the next business day. Bills where you want extra safety move to the previous business day.

## The anchor date principle

The system separates "anchor dates" from "payment dates" to prevent date drift in recurrence calculations.

**Anchor dates** are stored in the database and used for all recurrence calculations. A monthly bill due on the 15th always advances to the next month's 15th, regardless of whether that date falls on a weekend.

**Payment dates** are calculated on-the-fly by applying weekend adjustments to anchor dates. These are what you see in the bill list, forecast view, and status checks.

This separation ensures that a monthly bill due January 15 (Saturday) shows as due January 14 (Friday) with the "previous business day" strategy, but when you log payment, the next due date correctly advances to February 15 (not February 14). The anchor stays on the 15th, preventing drift across months and years.

## Adjustment strategies

Three strategies control how weekend dates are handled:

**Leave Unchanged.** The bill keeps its original date even if it falls on Saturday or Sunday. Use this for digital subscriptions, streaming services, or any bill that processes on weekends. The system displays the weekend date as-is.

**Move to Next Business Day.** If the due date falls on Saturday or Sunday, it moves to Monday. This matches traditional banking behavior where payments scheduled for weekends clear on the next business day. Saturday January 15 becomes Monday January 17. Sunday January 16 becomes Monday January 17.

**Move to Previous Business Day.** If the due date falls on Saturday or Sunday, it moves to Friday. This is a "safe payer" strategy that ensures you pay before the weekend. Saturday January 15 becomes Friday January 14. Sunday January 16 becomes Friday January 14.

## Configuration

You configure weekend adjustment in two places:

**Global default (Settings).** Navigate to Settings > Behavior Options. Find "If a bill is due on the weekend" and select your preferred strategy. This becomes the default for all new bills. The default is "Leave Unchanged" when you first install Oar.

**Per-bill override (Bill Form).** When creating or editing a bill, you'll see "If due date falls on weekend" in the form. Select a strategy to override the global default for that specific bill. Leave it as the default to use your global setting.

This two-level configuration lets you handle different payment types differently. Set "Move to Next Business Day" as your global default for traditional bills, then override specific bills (like digital subscriptions) to "Leave Unchanged" when needed.

## How it works in practice

When you create a bill with a due date that falls on a weekend, the system stores the anchor date (the actual weekend date) in the database. When displaying the bill, it calculates the adjusted payment date based on your configured strategy.

**Example: Monthly rent due January 15 (Saturday)**

With "Move to Previous Business Day" strategy:
- Anchor date stored: January 15 (Saturday)
- Payment date displayed: January 14 (Friday)
- When you log payment on January 14, the next due date advances to February 15 (anchor preserved)
- If February 15 is also a weekend, it adjusts again for display

With "Move to Next Business Day" strategy:
- Anchor date stored: January 15 (Saturday)
- Payment date displayed: January 17 (Monday)
- When you log payment on January 17, the next due date advances to February 15 (anchor preserved)

The anchor date principle ensures that monthly bills stay anchored to the same day of the month across all months, regardless of weekend adjustments.

## Integration with other features

Weekend adjustment integrates throughout the system:

**Bill List Display.** Bills show adjusted payment dates, not anchor dates. A bill due Saturday January 15 with "previous business day" strategy appears as "Due January 14" in the list.

**Forecast View.** The forecast projects anchor dates using recurrence rules, then applies weekend adjustment for display. A monthly bill due on the 15th projects to February 15, March 15, and so on. If any of those dates fall on weekends, they adjust according to your strategy.

**AutoPay Processing.** AutoPay eligibility uses adjusted dates. A bill due Saturday January 15 with "previous business day" strategy becomes eligible on Friday January 14. When processed, the transaction records the adjusted date (January 14) for audit accuracy, but the next due date advances using the anchor date (February 15).

**Daily Status Check.** The background job that marks bills overdue uses adjusted dates. A bill due Saturday January 15 with "next business day" strategy becomes overdue on Monday January 17, not on Saturday.

**Historical Payment Detection.** Billing cycle boundaries use anchor dates, not adjusted dates. This ensures historical payment detection works correctly regardless of weekend adjustments. A monthly bill with anchor date January 15 has a billing cycle from December 15 to January 15, even if the displayed date adjusts to January 14 or January 17.

## Edge cases and constraints

**Weekday dates.** If a bill's due date falls on a weekday (Monday through Friday), no adjustment occurs regardless of strategy. The payment date matches the anchor date.

**Leap years and month boundaries.** The anchor date principle handles leap years and month boundaries correctly. A bill due February 29 in a leap year advances to the next occurrence based on the anchor, not the adjusted date.

**Year boundaries.** When crossing year boundaries, anchor dates remain stable. A monthly bill due December 15 advances to January 15 the next year, regardless of weekend adjustments applied to either date.

**Timezone handling.** Weekend detection uses local dates. A date that's Saturday in your timezone is treated as Saturday, even if it's Sunday in UTC. The adjustment happens in your local timezone context.

**Bills with end dates.** When a bill has an end date, the anchor date principle still applies. The bill ends when the next anchor date would exceed the end date, not when the adjusted date would exceed it.

**One-time bills.** Bills with "Never" repeat interval still benefit from weekend adjustment for display and status determination, but they don't advance to a next occurrence, so anchor date preservation doesn't apply.

**Changing strategies.** If you change the global strategy or a bill's override strategy, existing bills immediately reflect the new adjustment when displayed. The anchor dates in the database remain unchanged, ensuring recurrence calculations stay stable.

## Verification

To confirm weekend adjustment works:

1. Navigate to Settings > Behavior Options. Verify "If a bill is due on the weekend" dropdown appears with three options.
2. Create a new bill with a due date that falls on a Saturday. Set the weekend adjustment to "Move to Previous Business Day" in the bill form.
3. Check the bill list. The bill should display as due on Friday (the previous business day), not Saturday.
4. Log a payment for the bill. Verify the next due date advances to the same day next month (preserving the anchor), not the adjusted date.
5. Create another bill due on a Sunday with "Move to Next Business Day" strategy. Verify it displays as due on Monday.
6. Navigate to Forecast View and select a month where bills have weekend due dates. Verify the forecast shows adjusted dates, not anchor dates.
7. Mark a bill as auto-pay with a weekend due date and "previous business day" strategy. Verify it becomes eligible on Friday, not Saturday.
8. Create a bill due yesterday (if it was a weekend) with "next business day" strategy. Verify the daily status check marks it overdue based on the adjusted date (Monday), not the anchor date (Saturday).

## Related Documents

* [Recurrence Engine](./001-recurrence-engine.md) - How recurring and one-time payments advance
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Background Jobs](./006-background-jobs.md) - Automated system tasks
* [Forecast View](./016-forecast-view.md) - Projecting future financial liabilities by month

