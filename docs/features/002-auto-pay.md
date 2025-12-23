# Logging Payments

- **Status:** Draft
- **Last Updated:** 2025-12-22
- **Related:** [Recurrence Engine](./001-recurrence-engine.md), [Background Jobs](./006-background-jobs.md), [Overview Screen](./005-overview-screen.md)

## Overview

Most expense trackers auto-import transactions from bank feeds. Oar takes a different approach: you log each payment yourself. This isn't a missing feature; it's the core of the "Active Payer" philosophy.

When you manually record a payment, you're forced to acknowledge the money leaving your account. This small friction builds financial awareness over time. You can't sleepwalk through your expenses when every payment requires a conscious action.

The Log Payment dialog captures what you paid, when you paid it, and optionally advances the bill to its next due date.

## The Log Payment dialog

You open the Log Payment dialog through the [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md). Click any bill row in the Overview to open the panel, then click the **Log Payment** button. You'll see four fields:

**Amount.** Pre-filled with the bill's current amount due. Change this if you paid a different amount, like when splitting a payment or paying extra.

**Payment Date.** Defaults to today. You can pick any date in the past if you're catching up on records. Future dates aren't allowed; you can't log a payment before it happens.

**Notes.** An optional text field for confirmation numbers, payment methods, or any context you want to remember later. Limited to 500 characters.

**Update Due Date.** A toggle that controls whether the bill advances to its next billing cycle after you log this payment. On by default.

## Full payments vs partial payments

The "Update Due Date" toggle determines how your payment affects the bill:

**Toggle ON (full payment).** This is the standard flow. After logging:
- The due date advances to the next cycle based on the bill's repeat interval
- The amount due resets to the base bill amount
- The bill stays active for the next cycle

For example: a $150 monthly bill due March 1. You log a payment with the toggle on. The due date moves to April 1, and the amount due resets to $150.

**Toggle OFF (partial payment).** Use this when you're paying part of a bill now and the rest later:
- The due date stays the same
- The amount due decreases by what you paid
- The bill remains in your current obligations

For example: a $200 bill due March 15. You log $75 with the toggle off. The due date stays March 15, but the amount due drops to $125. The [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md) now displays your remaining commitment as "$125.00 ($200.00)" so you can see exactly how much is left. Log the remaining $125 later with the toggle on, and the cycle advances.

## One-time bills

Bills with a "Never" repeat interval behave differently. After you log a full payment:
- The amount due zeroes out
- The status changes to "paid"
- The bill remains in your history but no longer appears in active views

You can still log partial payments against one-time bills. When the cumulative payments equal or exceed the bill amount, the bill is marked paid.

## Historical payments

When you're onboarding a bill with existing payment history, you need to record past payments without affecting the current billing cycle. Oar detects this automatically.

If you select a payment date before the current billing cycle started, the system recognizes it as a "historical payment." You'll see an amber banner in the dialog:

> Historical payment: this will be recorded without changing the due date.

The "Update Due Date" toggle disappears for historical payments since it doesn't apply. Your payment is recorded in the transaction history with the date you selected, but the bill's due date, amount due, and status remain untouched.

**How the system calculates billing cycle boundaries:**

| Repeat interval | Current cycle starts |
|-----------------|---------------------|
| Weekly | 7 days before due date |
| Biweekly | 14 days before due date |
| Twice monthly | 14 days before due date |
| Monthly | 1 month before due date |
| Bimonthly | 2 months before due date |
| Quarterly | 3 months before due date |
| Yearly | 1 year before due date |
| One-time | N/A (no historical detection) |

One-time bills don't have billing cycles, so early payments are always treated as current payments. If you pay a one-time bill before its due date, the payment marks the bill as paid.

**Example scenario:**

You have a monthly electric bill due December 22. The current billing cycle runs from November 22 through December 22.

- Log a payment dated December 20 → Current cycle payment. Toggle appears. Bill advances if toggle is on.
- Log a payment dated November 15 → Historical payment. No toggle. Bill state unchanged.
- Log a payment dated March 10 → Historical payment. No toggle. Bill state unchanged.

This lets you build a complete payment history when adding existing bills to Oar without scrambling your current obligations.

## Payment history

Every payment you log is recorded with its amount, date, and notes. To view a bill's payment history:

1. Click a bill row to open the Bill Detail Panel
2. Find the "View Payment History" section above the notes
3. Click to expand and see all payments, newest first

Each payment displays the date (formatted as DD/MM/YYYY), amount, and any notes you added. Long notes truncate to a single line; hover to see the full text.

If you need to correct a payment mistake, click any payment row to view its details and edit or delete it. See [Editing Payment History](./011-editing-payment-history.md) for details.

## Edge cases

**Zero amount.** The system requires a positive payment amount. You can't log a $0 payment.

**Overpayment.** If you log a payment larger than the amount due with the toggle off, the amount due becomes zero (it won't go negative). The bill treats any excess as an early payment on the current cycle.

**Multiple partial payments.** You can log as many partial payments as needed before advancing the cycle. Each one reduces the amount due. Log the final payment with "Update Due Date" on to advance.

**Variable amount bills.** The Log Payment dialog pre-fills with the current amount due, which matches your estimate for variable bills. Change the amount to reflect what you paid.

**Backdated payments.** You can pick any past date for the payment. If the date falls within the current billing cycle, the payment behaves normally. If the date falls before the current cycle, Oar treats it as a historical payment and won't modify the bill's state. See the "Historical payments" section above.

**Bill already paid.** For one-time bills marked as paid, the Log Payment button is disabled.

**Auto-pay bills.** If you've marked a bill as auto-pay, Oar logs payments automatically when the due date arrives. You'll still see these payments in the bill's history. See [Background Jobs](./006-background-jobs.md) and [Active Payer Signals](./010-active-payer-signals.md) for details.

## Verification

To confirm payment logging works:

1. Navigate to the Overview and find an unpaid bill.
2. Click the bill row to open the [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md) and click the **Log Payment** button.
3. The dialog should show the amount pre-filled and today's date selected.
4. Log a payment with "Update Due Date" on. The bill's due date should advance to the next cycle.
5. Create another bill and log a partial payment with the toggle off. Verify the Bill Detail Panel displays the remaining balance followed by the total amount in parentheses.
6. Click "View Payment History" in the Bill Detail Panel. Your logged payments should appear.

To confirm historical payment detection works:

1. Find a recurring bill (monthly works best for testing).
2. Click Log Payment and change the date to several months in the past.
3. An amber banner should appear saying "Historical payment."
4. The "Update Due Date" toggle should disappear.
5. Log the payment. The bill's due date and amount due should remain unchanged.
6. Check the payment history; your historical payment should appear with the backdated date.
