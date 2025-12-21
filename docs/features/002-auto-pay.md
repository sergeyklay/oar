# Logging Payments

- **Status:** Draft
- **Last Updated:** 2025-12-21
- **Related:** [Recurrence Engine](./001-recurrence-engine.md), [Background Jobs](./006-background-jobs.md), [Overview Screen](./005-overview-screen.md)

## Overview

Most expense trackers auto-import transactions from bank feeds. Oar takes a different approach: you log each payment yourself. This isn't a missing feature; it's the core of the "Active Payer" philosophy.

When you manually record a payment, you're forced to acknowledge the money leaving your account. This small friction builds financial awareness over time. You can't sleepwalk through your expenses when every payment requires a conscious action.

The Log Payment dialog captures what you paid, when you paid it, and optionally advances the bill to its next due date.

## The Log Payment dialog

Click the Log Payment button (the banknote icon) on any unpaid bill to open the dialog. You'll see four fields:

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

For example: a $200 bill due March 15. You log $75 with the toggle off. The due date stays March 15, but the amount due drops to $125. Log the remaining $125 later with the toggle on, and the cycle advances.

## One-time bills

Bills with a "Never" repeat interval behave differently. After you log a full payment:
- The amount due zeroes out
- The status changes to "paid"
- The bill remains in your history but no longer appears in active views

You can still log partial payments against one-time bills. When the cumulative payments equal or exceed the bill amount, the bill is marked paid.

## Payment history

Every payment you log is recorded with its amount, date, and notes. To view a bill's payment history:

1. Click the three-dot menu on the bill row
2. Select "View history"
3. A dialog shows all payments, newest first

Each payment displays the amount, date (formatted like "December 21, 2025"), and any notes you added.

## Deleting payments

You can delete a payment record from the history dialog by clicking the trash icon. A confirmation dialog appears warning that deletion won't change the bill's current due date or amount due.

This is intentional. Deleting a payment is a record correction, not an "undo" operation. If you logged a payment accidentally and the bill's due date already advanced, you'll need to edit the bill manually to fix it.

## Edge cases

**Zero amount.** The system requires a positive payment amount. You can't log a $0 payment.

**Overpayment.** If you log a payment larger than the amount due with the toggle off, the amount due becomes zero (it won't go negative). The bill treats any excess as an early payment on the current cycle.

**Multiple partial payments.** You can log as many partial payments as needed before advancing the cycle. Each one reduces the amount due. Log the final payment with "Update Due Date" on to advance.

**Variable amount bills.** The Log Payment dialog pre-fills with the current amount due, which matches your estimate for variable bills. Change the amount to reflect what you paid.

**Backdated payments.** You can pick any past date for the payment. This is useful when recording payments made outside of Oar. The date you select is stored; it doesn't affect how the due date advances.

**Bill already paid.** For one-time bills marked as paid, the Log Payment button is disabled.

**Auto-pay bills.** If you've marked a bill as auto-pay, Oar logs payments automatically when the due date arrives. You'll still see these payments in the bill's history. See [Background Jobs](./006-background-jobs.md) for details.

## Verification

To confirm payment logging works:

1. Navigate to the Overview and find an unpaid bill.
2. Click the Log Payment button (banknote icon).
3. The dialog should show the amount pre-filled and today's date selected.
4. Log a payment with "Update Due Date" on. The bill's due date should advance to the next cycle.
5. Create another bill and log a partial payment with the toggle off. The amount due should decrease while the due date stays the same.
6. Open the bill's payment history from the three-dot menu. Your logged payments should appear.
7. Delete a payment from history. Confirm the bill's due date didn't change.
